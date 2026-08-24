<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ShelfLifePredictor
{
    /**
     * Compute estimated remaining shelf-life days and degradation percentage
     * for cold chain biopharma products using Arrhenius decay kinetics.
     *
     * @param string $deviceId
     * @param float $nominalShelfLifeDays Baseline shelf life at optimal 5°C (default: 180 days)
     * @param float $activationEnergyConstant Activation energy Ea/R (default: 10000 K)
     */
    public function predictRemainingShelfLife(
        string $deviceId,
        float $nominalShelfLifeDays = 180.0,
        float $activationEnergyConstant = 10000.0
    ): array {
        // Query mean hourly temperatures for the asset over the last 30 days
        $hourlyData = DB::select(
            "SELECT 
                bucket,
                avg_temp,
                sample_count
             FROM telemetry_hourly_summary
             WHERE device_id = :device_id
               AND bucket >= NOW() - INTERVAL '30 days'
             ORDER BY bucket ASC",
            ['device_id' => $deviceId]
        );

        if (empty($hourlyData)) {
            return [
                'device_id'                  => $deviceId,
                'status'                     => 'INSUFFICIENT_DATA',
                'cumulative_degradation_pct' => 0.0,
                'estimated_days_remaining'   => $nominalShelfLifeDays,
                'quality_grade'              => 'OPTIMAL',
            ];
        }

        $refTempKelvin = 5.0 + 273.15; // 5°C standard reference storage
        $totalEquivalentHoursUsed = 0.0;

        foreach ($hourlyData as $row) {
            $currentTempKelvin = (float) $row->avg_temp + 273.15;
            
            // Arrhenius degradation acceleration factor vs 5°C reference
            $accelerationFactor = exp($activationEnergyConstant * ((1.0 / $refTempKelvin) - (1.0 / $currentTempKelvin)));
            
            // 1 bucket represents 1 hour
            $totalEquivalentHoursUsed += (1.0 * $accelerationFactor);
        }

        $nominalHoursTotal = $nominalShelfLifeDays * 24.0;
        $degradationFraction = min(1.0, max(0.0, $totalEquivalentHoursUsed / $nominalHoursTotal));
        $degradationPct = round($degradationFraction * 100.0, 2);

        $remainingHours = max(0.0, $nominalHoursTotal - $totalEquivalentHoursUsed);
        $remainingDays = round($remainingHours / 24.0, 1);

        $grade = 'OPTIMAL';
        if ($degradationPct >= 100.0) {
            $grade = 'EXPIRED_SPOILED';
        } elseif ($degradationPct >= 50.0) {
            $grade = 'HIGH_RISK_DEGRADED';
        } elseif ($degradationPct >= 20.0) {
            $grade = 'MODERATE_DEGRADATION';
        }

        return [
            'device_id'                  => $deviceId,
            'status'                     => 'ANALYZED',
            'nominal_shelf_life_days'    => $nominalShelfLifeDays,
            'cumulative_degradation_pct' => $degradationPct,
            'equivalent_hours_consumed'  => round($totalEquivalentHoursUsed, 1),
            'estimated_days_remaining'   => $remainingDays,
            'quality_grade'              => $grade,
        ];
    }
}
