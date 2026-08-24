<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AuditReportGenerator
{
    protected MktCalculator $mktCalculator;
    protected ShelfLifePredictor $shelfLifePredictor;

    public function __construct(
        MktCalculator $mktCalculator,
        ShelfLifePredictor $shelfLifePredictor
    ) {
        $this->mktCalculator = $mktCalculator;
        $this->shelfLifePredictor = $shelfLifePredictor;
    }

    /**
     * Generate structured compliance report array.
     */
    public function generateReportData(string $deviceId, Carbon $from, Carbon $to): array
    {
        $asset = DB::table('assets')->where('id', $deviceId)->first();
        
        $stats = DB::selectOne(
            "SELECT 
                COUNT(*) as total_pings,
                MIN(temperature) as min_temp,
                MAX(temperature) as max_temp,
                AVG(temperature) as avg_temp,
                AVG(humidity) as avg_humidity
             FROM sensor_telemetry
             WHERE device_id = :device_id AND recorded_at BETWEEN :start_date AND :end_date",
            [
                'device_id'  => $deviceId,
                'start_date' => $from->toIso8601String(),
                'end_date'   => $to->toIso8601String()
            ]
        );

        $mkt = $this->mktCalculator->getDeviceMKT($deviceId, $from, $to);
        $shelfLife = $this->shelfLifePredictor->predictRemainingShelfLife($deviceId);

        $excursions = DB::table('excursion_logs')
            ->where('device_id', $deviceId)
            ->whereBetween('started_at', [$from, $to])
            ->get();

        $maxAllowed = $asset ? (float) $asset->temp_max_celsius : 8.0;
        $status = ($excursions->isEmpty() && ($mkt === null || $mkt <= $maxAllowed)) ? 'COMPLIANT' : 'EXCURSION_BREACHED';

        return [
            'metadata' => [
                'report_title'     => 'WHO / HACCP Cold Chain Compliance Audit',
                'generated_at'     => Carbon::now()->toIso8601String(),
                'audit_window_from' => $from->toIso8601String(),
                'audit_window_to'   => $to->toIso8601String(),
            ],
            'asset' => [
                'device_id'            => $deviceId,
                'name'                 => $asset ? $asset->name : $deviceId,
                'asset_type'           => $asset ? $asset->asset_type : 'pharma_reefer',
                'temp_min_celsius'     => $asset ? (float) $asset->temp_min_celsius : 2.0,
                'temp_max_celsius'     => $maxAllowed,
            ],
            'audit_summary' => [
                'total_telemetry_samples' => (int) ($stats->total_pings ?? 0),
                'min_temperature_celsius' => $stats->min_temp !== null ? (float) $stats->min_temp : null,
                'max_temperature_celsius' => $stats->max_temp !== null ? (float) $stats->max_temp : null,
                'avg_temperature_celsius' => $stats->avg_temp !== null ? round((float) $stats->avg_temp, 2) : null,
                'mean_kinetic_temp_mkt'   => $mkt,
                'regulatory_status'       => $status,
            ],
            'shelf_life_kinetics' => $shelfLife,
            'excursions'          => $excursions,
        ];
    }

    /**
     * Generate CSV export content for compliance auditing.
     */
    public function generateCsvContent(string $deviceId, Carbon $from, Carbon $to): string
    {
        $data = $this->generateReportData($deviceId, $from, $to);
        $summary = $data['audit_summary'];
        $asset = $data['asset'];

        $csvLines = [];
        $csvLines[] = "WHO/HACCP COLD CHAIN COMPLIANCE AUDIT REPORT";
        $csvLines[] = "Generated At," . $data['metadata']['generated_at'];
        $csvLines[] = "Device ID," . $asset['device_id'];
        $csvLines[] = "Asset Name,\"" . $asset['name'] . "\"";
        $csvLines[] = "Asset Type," . $asset['asset_type'];
        $csvLines[] = "Audit Window," . $data['metadata']['audit_window_from'] . " to " . $data['metadata']['audit_window_to'];
        $csvLines[] = "Regulatory Status," . $summary['regulatory_status'];
        $csvLines[] = "";
        $csvLines[] = "SUMMARY METRICS";
        $csvLines[] = "Metric,Value,Unit";
        $csvLines[] = "Total Telemetry Samples," . $summary['total_telemetry_samples'] . ",Pings";
        $csvLines[] = "Minimum Temperature," . ($summary['min_temperature_celsius'] ?? 'N/A') . ",°C";
        $csvLines[] = "Maximum Temperature," . ($summary['max_temperature_celsius'] ?? 'N/A') . ",°C";
        $csvLines[] = "Average Temperature," . ($summary['avg_temperature_celsius'] ?? 'N/A') . ",°C";
        $csvLines[] = "Mean Kinetic Temp (MKT)," . ($summary['mean_kinetic_temp_mkt'] ?? 'N/A') . ",°C";
        $csvLines[] = "Cumulative Product Decay," . $data['shelf_life_kinetics']['cumulative_degradation_pct'] . ",%";
        $csvLines[] = "Estimated Remaining Shelf Life," . $data['shelf_life_kinetics']['estimated_days_remaining'] . ",Days";
        $csvLines[] = "";
        $csvLines[] = "EXCURSION BREACH LOGS";
        $csvLines[] = "ID,Type,Recorded Value,Threshold,Started At,Is Active";

        foreach ($data['excursions'] as $ex) {
            $csvLines[] = implode(',', [
                $ex->id ?? '',
                $ex->excursion_type ?? '',
                $ex->recorded_value ?? '',
                $ex->threshold_limit ?? '',
                $ex->started_at ?? '',
                ($ex->is_active ?? false) ? 'YES' : 'NO'
            ]);
        }

        return implode("\n", $csvLines);
    }
}
