<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExcursionLog extends Model
{
    protected $table = 'excursion_logs';
    public $timestamps = false;

    protected $fillable = [
        'device_id',
        'excursion_type',
        'recorded_value',
        'threshold_limit',
        'started_at',
        'resolved_at',
        'is_active',
    ];

    protected $casts = [
        'recorded_value' => 'float',
        'threshold_limit' => 'float',
        'started_at' => 'datetime',
        'resolved_at' => 'datetime',
        'is_active' => 'boolean',
    ];
}
