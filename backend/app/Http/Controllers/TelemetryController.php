<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use App\Services\MktCalculator;
use App\Services\ShelfLifePredictor;
use App\Services\RedisSnapshotService;
use App\Services\AuditReportGenerator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TelemetryController extends Controller
{
    protected MktCalculator $mktService;
    protected ShelfLifePredictor $shelfLifePredictor;
    protected RedisSnapshotService $snapshotService;
    protected AuditReportGenerator $reportGenerator;

    public function __construct(
        MktCalculator $mktService,
        ShelfLifePredictor $shelfLifePredictor,
        RedisSnapshotService $snapshotService,
        AuditReportGenerator $reportGenerator
    ) {
        $this->mktService = $mktService;
        $this->shelfLifePredictor = $shelfLifePredictor;
        $this->snapshotService = $snapshotService;
        $this->reportGenerator = $reportGenerator;
    }

    /**
     * Generate WHO/HACCP compliant excursion audit summary.
     */
    public function getComplianceSummary(Request $request, string $deviceId): JsonResponse
    {
        $from = $request->query('from') ? Carbon::parse($request->query('from')) : Carbon::now()->subDays(7);
        $to = $request->query('to') ? Carbon::parse($request->query('to')) : Carbon::now();

        $stats = DB::selectOne(
            "SELECT 
                COUNT(*) as total_pings,
                MIN(temperature) as min_temp,
                MAX(temperature) as max_temp,
                AVG(temperature) as avg_temp
             FROM sensor_telemetry
             WHERE device_id = :device_id AND recorded_at BETWEEN :start_date AND :end_date",
            [
                'device_id'  => $deviceId,
                'start_date' => $from->toIso8601String(),
                'end_date'   => $to->toIso8601String()
            ]
        );

        $mkt = $this->mktService->getDeviceMKT($deviceId, $from, $to);

        $excursions = DB::table('excursion_logs')
            ->where('device_id', $deviceId)
            ->whereBetween('started_at', [$from, $to])
            ->get();

        return response()->json([
            'device_id'          => $deviceId,
            'audit_window'       => ['from' => $from->toIso8601String(), 'to' => $to->toIso8601String()],
            'telemetry_samples'  => (int) ($stats->total_pings ?? 0),
            'min_temp_celsius'   => $stats->min_temp !== null ? (float) $stats->min_temp : null,
            'max_temp_celsius'   => $stats->max_temp !== null ? (float) $stats->max_temp : null,
            'avg_temp_celsius'   => $stats->avg_temp !== null ? round((float) $stats->avg_temp, 2) : null,
            'mkt_celsius'        => $mkt,
            'regulatory_status'  => ($excursions->isEmpty() && ($mkt === null || $mkt <= 8.0)) ? 'COMPLIANT' : 'EXCURSION_BREACHED',
            'excursion_events'   => $excursions
        ]);
    }

    /**
     * Export WHO/HACCP compliance audit report as CSV or JSON format.
     */
    public function exportAuditReport(Request $request, string $deviceId)
    {
        $from = $request->query('from') ? Carbon::parse($request->query('from')) : Carbon::now()->subDays(7);
        $to = $request->query('to') ? Carbon::parse($request->query('to')) : Carbon::now();
        $format = strtolower($request->query('format', 'json'));

        if ($format === 'csv') {
            $csv = $this->reportGenerator->generateCsvContent($deviceId, $from, $to);
            return response($csv, 200, [
                'Content-Type'        => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"WHO_Compliance_Audit_{$deviceId}.csv\"",
            ]);
        }

        $data = $this->reportGenerator->generateReportData($deviceId, $from, $to);
        return response()->json($data);
    }

    /**
     * Get biopharma vaccine degradation and shelf-life prediction.
     */
    public function getShelfLifePrediction(Request $request, string $deviceId): JsonResponse
    {
        $nominalDays = (float) $request->query('nominal_days', 180.0);
        $result = $this->shelfLifePredictor->predictRemainingShelfLife($deviceId, $nominalDays);

        return response()->json($result);
    }

    /**
     * Get live hot snapshot data for all active fleet assets.
     */
    public function getLiveFleetStatus(): JsonResponse
    {
        $fleet = $this->snapshotService->getActiveFleetSnapshots();
        return response()->json([
            'total_active_assets' => count($fleet),
            'timestamp'           => Carbon::now()->toIso8601String(),
            'assets'              => $fleet
        ]);
    }
}
