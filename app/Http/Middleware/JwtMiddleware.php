<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class JwtMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken() ?? session('jwt_token');

        if (!$token) {
            return redirect()->route('login');
        }

        $user = null;

        if (session('jwt_token') === $token) {
            $user = session('jwt_user');
        }

        if (!$user) {
            $response = Http::withToken($token)
                ->get(env('HOSPITAL_API_URL') . '/auth/me');

            if (!$response->successful()) {
                session()->forget(['jwt_token', 'jwt_user']);
                return redirect()->route('login');
            }

            $user = $response->json();
            session(['jwt_user' => $user, 'jwt_token' => $token]);
        }

        $request->attributes->set('jwt_user', $user);
        $request->attributes->set('jwt_token', $token);

        return $next($request);
    }
}
