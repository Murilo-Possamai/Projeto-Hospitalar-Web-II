<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pessoa extends Model
{
    protected $table = 'pessoa';
    protected $primaryKey = 'id';
    public $timestamps = true;
    const CREATED_AT = 'data_criacao';
    const UPDATED_AT = 'data_alteracao';

    protected $fillable = [
        'nome', 'cpf', 'data_nascimento', 'email', 'telefone', 'id_endereco',
    ];

    public function endereco()
    {
        return $this->belongsTo(Endereco::class, 'id_endereco');
    }
}
