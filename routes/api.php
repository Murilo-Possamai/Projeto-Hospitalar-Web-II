<?php

use App\Http\Controllers\Api\ConsultasDoDiaController;
use App\Http\Controllers\Api\ResultadosExamesController;
use Illuminate\Support\Facades\Route;

// Integração Saída: endpoint público para equipe-3
Route::get('/consultas-do-dia', [ConsultasDoDiaController::class, 'index']);

// Integração Saída: resultados de exames para equipe-7
Route::get('/resultados-exames', [ResultadosExamesController::class, 'index']);
