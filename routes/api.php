<?php

use App\Http\Controllers\Api\ConsultasDoDiaController;
use Illuminate\Support\Facades\Route;

// Integração Saída: endpoint público para equipe-3
Route::get('/consultas-do-dia', [ConsultasDoDiaController::class, 'index']);
