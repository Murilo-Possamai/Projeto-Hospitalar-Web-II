<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Usuario extends Model
{
    protected $table = 'usuario';
    protected $primaryKey = 'id';
    public $timestamps = true;
    const CREATED_AT = 'data_criacao';
    const UPDATED_AT = 'data_alteracao';

    protected $fillable = [
        'usuario', 'email', 'senha', 'funcao',
        'id_pessoa', 'id_cadastro', 'id_plano', 'primeiro_acesso',
    ];

    protected $hidden = ['senha'];

    public function pessoa()
    {
        return $this->belongsTo(Pessoa::class, 'id_pessoa');
    }

    public function plano()
    {
        return $this->belongsTo(Plano::class, 'id_plano');
    }

    public function consultas()
    {
        return $this->hasMany(Consulta::class, 'id_paciente');
    }
}
