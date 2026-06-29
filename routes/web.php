<?php

use App\Http\Controllers\Recepcao\AgendamentoController;
use App\Http\Controllers\Recepcao\PacienteController;
use App\Http\Controllers\Recepcao\AgendaController;
use App\Http\Controllers\Recepcao\CheckinController;
use App\Http\Controllers\Recepcao\AgendadosController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn() => redirect()->route('login'));

Route::middleware('jwt')->group(function () {
    Route::get('/dashboard', fn() => redirect('/recepcao/agendamento'))->name('dashboard');

    Route::prefix('recepcao')->name('recepcao.')->group(function () {
        // Agendamento
        Route::get('/agendamento',              [AgendamentoController::class, 'index'])->name('agendamento');
        Route::get('/medicos',                  [AgendamentoController::class, 'medicos'])->name('medicos');
        Route::get('/pacientes-lista',          [AgendamentoController::class, 'pacientes'])->name('pacientes-lista');
        Route::get('/disponibilidade',          [AgendamentoController::class, 'disponibilidade'])->name('disponibilidade');
        Route::post('/agendamento',             [AgendamentoController::class, 'store'])->name('agendamento.store');
        Route::get('/agendamento/{id}/editar',  [AgendamentoController::class, 'edit'])->name('agendamento.edit');
        Route::put('/agendamento/{id}',         [AgendamentoController::class, 'update'])->name('agendamento.update');
        Route::delete('/agendamento/{id}',      [AgendamentoController::class, 'destroy'])->name('agendamento.destroy');

        // Pacientes CRUD
        Route::get('/pacientes',                [PacienteController::class, 'index'])->name('pacientes');
        Route::post('/pacientes',               [PacienteController::class, 'store'])->name('pacientes.store');
        Route::put('/pacientes/{id}',           [PacienteController::class, 'update'])->name('pacientes.update');
        Route::delete('/pacientes/{id}',        [PacienteController::class, 'destroy'])->name('pacientes.destroy');

        // Agenda Médica
        Route::get('/agenda',                   [AgendaController::class, 'index'])->name('agenda');
        Route::post('/agenda',                  [AgendaController::class, 'store'])->name('agenda.store');
        Route::put('/agenda/{id}',              [AgendaController::class, 'update'])->name('agenda.update');
        Route::delete('/agenda/{id}',           [AgendaController::class, 'destroy'])->name('agenda.destroy');

        // Check-in
        Route::get('/checkin',                  [CheckinController::class, 'index'])->name('checkin');
        Route::post('/checkin/{id}',            [CheckinController::class, 'store'])->name('checkin.store');

        // Agendados
        Route::get('/agendados',                [AgendadosController::class, 'index'])->name('agendados');
        Route::patch('/agendados/{id}/finalizar', [AgendadosController::class, 'finalizar'])->name('agendados.finalizar');
        Route::patch('/agendados/{id}/cancelar',  [AgendadosController::class, 'cancelar'])->name('agendados.cancelar');
    });
});

require __DIR__.'/auth.php';
