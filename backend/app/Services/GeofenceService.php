<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GeofenceService
{
    /**
     * Get all active geofence zones as formatted GeoJSON / array records.
     */
    public function getAllGeofences(): array
    {
        $records = DB::select(
            "SELECT 
                id, 
                name, 
                zone_type, 
                ST_AsGeoJSON(boundary) as geojson,
                ST_AsText(boundary) as wkt,
                created_at
             FROM geofences
             ORDER BY id DESC"
        );

        return array_map(function ($row) {
            return [
                'id'         => $row->id,
                'name'       => $row->name,
                'zone_type'  => $row->zone_type,
                'geometry'   => json_decode($row->geojson),
                'wkt'        => $row->wkt,
                'created_at' => $row->created_at,
            ];
        }, $records);
    }

    /**
     * Create a new PostGIS polygon geofence corridor.
     *
     * @param string $name Name of the zone (e.g. Colombo Transit Corridor)
     * @param string $zoneType Zone category: SAFE_HUB, COLD_CORRIDOR, RESTRICTED_ZONE
     * @param array $polygonPoints Array of [lng, lat] coordinate pairs
     */
    public function createGeofence(string $name, string $zoneType, array $polygonPoints): array
    {
        // Ensure polygon ring closes properly
        if (reset($polygonPoints) !== end($polygonPoints)) {
            $polygonPoints[] = reset($polygonPoints);
        }

        $wktPairs = array_map(function ($pt) {
            return "{$pt[0]} {$pt[1]}";
        }, $polygonPoints);

        $wktPolygon = "POLYGON((" . implode(', ', $wktPairs) . "))";

        $id = DB::table('geofences')->insertGetId([
            'name'       => $name,
            'zone_type'  => $zoneType,
            'boundary'   => DB::raw("ST_GeomFromText('{$wktPolygon}', 4326)"),
            'created_at' => Carbon::now(),
        ]);

        return [
            'id'        => $id,
            'name'      => $name,
            'zone_type' => $zoneType,
            'wkt'       => $wktPolygon,
            'status'    => 'CREATED',
        ];
    }

    /**
     * Delete an existing geofence.
     */
    public function deleteGeofence(int $id): bool
    {
        return DB::table('geofences')->where('id', $id)->delete() > 0;
    }
}
