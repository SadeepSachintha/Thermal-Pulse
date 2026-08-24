<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MktCalculator
{
    /**
     * Compute Mean Kinetic Temperature (MKT) via TimescaleDB Haynes Stored Function.
     */
    public function getDeviceMKT(string $deviceId, Carbon $from, Carbon $to): ?float
    {
        $result = DB::selectOne(
            "SELECT calculate_mkt(:device_id, :start_date, :end_date) AS mkt",
            [
                'device_id'  => $deviceId,
                'start_date' => $from->toIso8601String(),
                'end_date'   => $to->toIso8601String(),
            ]
        );

        return $result && $result->mkt !== null ? (float) $result->mkt : null;
    }
}
