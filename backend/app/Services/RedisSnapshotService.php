<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;

class RedisSnapshotService
{
    /**
     * Get live hot snapshot state for all active telemetry devices.
     */
    public function getActiveFleetSnapshots(): array
    {
        $deviceIds = Redis::smembers('active_devices');
        if (empty($deviceIds)) {
            return [];
        }

        $fleet = [];
        foreach ($deviceIds as $id) {
            $data = Redis::hgetall("device:{$id}:latest");
            if (!empty($data)) {
                $fleet[] = [
                    'device_id'    => $id,
                    'temperature'  => isset($data['temp']) ? (float) $data['temp'] : null,
                    'humidity'     => isset($data['humidity']) ? (float) $data['humidity'] : null,
                    'door_open'    => isset($data['door']) && $data['door'] === '1',
                    'battery'      => isset($data['battery']) ? (int) $data['battery'] : null,
                    'latitude'     => isset($data['lat']) ? (float) $data['lat'] : null,
                    'longitude'    => isset($data['lng']) ? (float) $data['lng'] : null,
                    'updated_at'   => $data['updated_at'] ?? null,
                ];
            }
        }

        return $fleet;
    }
}
