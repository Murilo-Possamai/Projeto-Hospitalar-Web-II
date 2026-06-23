<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('login', fn() => Inertia::render('Auth/Login'))->name('login');

Route::post('logout', function () {
    session()->forget(['jwt_user', 'jwt_token']);
    return redirect()->route('login');
})->name('logout');
