<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\BillingController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Properties & Units
Route::get('/properties', [PropertyController::class, 'index']);
Route::post('/properties', [PropertyController::class, 'store']);
Route::get('/properties/{id}', [PropertyController::class, 'show']);
Route::post('/properties/{id}/units', [PropertyController::class, 'addUnit']);

// Tenants
Route::get('/tenants', [TenantController::class, 'index']);
Route::post('/tenants', [TenantController::class, 'store']);
Route::get('/tenants/{id}', [TenantController::class, 'show']);

// Billing
Route::post('/invoices/generate', [BillingController::class, 'generateInvoice']);
Route::post('/payments', [BillingController::class, 'recordPayment']);

// User (Auth)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
