<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    protected $table = 'assets';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'asset_type',
        'temp_min_celsius',
        'temp_max_celsius',
        'humidity_max_percent',
    ];

    protected $casts = [
        'temp_min_celsius' => 'float',
        'temp_max_celsius' => 'float',
        'humidity_max_percent' => 'float',
        'created_at' => 'datetime',
    ];
}
