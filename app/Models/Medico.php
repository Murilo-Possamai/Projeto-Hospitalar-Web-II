<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medico extends Model
{
    protected $table = 'medico';
    protected $primaryKey = 'id';
    public $timestamps = true;
    const CREATED_AT = 'data_criacao';
    const UPDATED_AT = 'data_alteracao';

    protected $fillable = [
        'id_pessoa', 'especialidade', 'sub_especialidade',
        'crm', 'uf_crm', 'tipo', 'status',
    ];

    public function scopeAtivos($query)
    {
        return $query->where('status', 'A');
    }

    public function pessoa()
    {
        return $this->belongsTo(Pessoa::class, 'id_pessoa');
    }

    public function agendas()
    {
        return $this->hasMany(Agenda::class, 'id_medico');
    }

    public function consultas()
    {
        return $this->hasMany(Consulta::class, 'id_medico');
    }
}
