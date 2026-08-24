<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TelemetryController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    Route::get('/assets/{deviceId}/compliance', [TelemetryController::class, 'getComplianceSummary']);
    Route::get('/assets/{deviceId}/shelflife', [TelemetryController::class, 'getShelfLifePrediction']);
    Route::get('/assets/{deviceId}/export', [TelemetryController::class, 'exportAuditReport']);
    Route::get('/telemetry/live', [TelemetryController::class, 'getLiveFleetStatus']);

    // PostGIS Geofence Management
    Route::get('/geofences', [TelemetryController::class, 'getGeofences']);
    Route::post('/geofences', [TelemetryController::class, 'createGeofence']);
    Route::delete('/geofences/{id}', [TelemetryController::class, 'deleteGeofence']);
});
