<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PublicListingController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\CommunicationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| The complete list of endpoints for the Renting System, covering
| Authentication, Super Admin, Property Management, Tenants, Billing,
| and Public Landing Page requirements.
|
*/

// =========================================================================
// PUBLIC ROUTES (No Authentication Required)
// =========================================================================

// 1. Authentication
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// 2. Public Listings (Landing Page)
Route::prefix('public')->group(function () {
    Route::get('/properties', [PublicListingController::class, 'index']); // List with filters (location, price, type)
    Route::get('/properties/{id}', [PublicListingController::class, 'show']); // Details for landing page
    Route::get('/stats', [PublicListingController::class, 'stats']); // "500+ Units", "98% Satisfaction"
    Route::post('/contact', [PublicListingController::class, 'contact']); // "Contact Us" form submission
});


// =========================================================================
// PROTECTED ROUTES (Requires 'auth:sanctum' token)
// =========================================================================
Route::middleware('auth:sanctum')->group(function () {

    // 1. User/Profile
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);


    // 2. Dashboard Statistics (Admin Dashboard)
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [DashboardController::class, 'index']); // Revenue, Active Tenants, Occupancy...
        Route::get('/recent-activity', [DashboardController::class, 'recentActivity']);
        Route::get('/revenue-chart', [DashboardController::class, 'revenueChart']);
    });


    // 3. Property Management
    Route::prefix('properties')->group(function () {
        Route::get('/', [PropertyController::class, 'index']);
        Route::post('/', [PropertyController::class, 'store']);
        Route::get('/{id}', [PropertyController::class, 'show']);
        Route::put('/{id}', [PropertyController::class, 'update']);
        Route::delete('/{id}', [PropertyController::class, 'destroy']);

        // Units within Properties
        Route::post('/{id}/units', [PropertyController::class, 'addUnit']);
        Route::put('/units/{unitId}', [PropertyController::class, 'updateUnit']);
        Route::delete('/units/{unitId}', [PropertyController::class, 'deleteUnit']);
    });


    // 4. Tenant Management
    Route::prefix('tenants')->group(function () {
        Route::get('/', [TenantController::class, 'index']);
        Route::post('/', [TenantController::class, 'store']); // Register new tenant
        Route::get('/{id}', [TenantController::class, 'show']);
        Route::put('/{id}', [TenantController::class, 'update']);
        Route::delete('/{id}', [TenantController::class, 'destroy']);
        
        Route::post('/{id}/assign-unit', [TenantController::class, 'assignUnit']);
        Route::get('/{id}/payment-history', [TenantController::class, 'paymentHistory']);
    });


    // 5. Finance & Billing
    Route::prefix('finance')->group(function () {
        Route::get('/invoices', [BillingController::class, 'invoices']);
        Route::post('/invoices/generate', [BillingController::class, 'generateInvoice']); // Monthly generation
        Route::get('/invoices/{id}', [BillingController::class, 'showInvoice']);
        
        Route::get('/payments', [BillingController::class, 'payments']);
        Route::post('/payments', [BillingController::class, 'recordPayment']);
        
        Route::get('/reports/revenue', [BillingController::class, 'revenueReport']);
        Route::get('/reports/expenses', [BillingController::class, 'expenseReport']);
    });

    
    // 6. Maintenance & Repairs
    Route::prefix('maintenance')->group(function () {
        Route::get('/', [MaintenanceController::class, 'index']);
        Route::post('/', [MaintenanceController::class, 'store']); // Report issue
        Route::get('/{id}', [MaintenanceController::class, 'show']);
        Route::put('/{id}', [MaintenanceController::class, 'update']); // Update status (Pending -> In Progress -> Resolved)
        Route::delete('/{id}', [MaintenanceController::class, 'destroy']);
    });

    // 7. Expenses (Operational Costs)
    Route::prefix('expenses')->group(function () {
        Route::get('/', [ExpenseController::class, 'index']);
        Route::post('/', [ExpenseController::class, 'store']);
        Route::get('/{id}', [ExpenseController::class, 'show']);
        Route::put('/{id}', [ExpenseController::class, 'update']);
        Route::delete('/{id}', [ExpenseController::class, 'destroy']);
    });

    // 8. Communications (SMS/WhatsApp)
    Route::prefix('communications')->group(function () {
        Route::get('/logs', [CommunicationController::class, 'index']); // History of sent messages
        Route::post('/send', [CommunicationController::class, 'send']); // Manual send endpoint
    });

    // 9. Super Admin Features (Requires higher privilege check in controller/middleware)
    Route::prefix('super-admin')->group(function () {
        // Admin Management
        Route::get('/admins', [AdminController::class, 'index']);
        Route::post('/admins', [AdminController::class, 'store']);
        Route::put('/admins/{id}', [AdminController::class, 'update']);
        Route::delete('/admins/{id}', [AdminController::class, 'destroy']);
        Route::post('/admins/{id}/suspend', [AdminController::class, 'suspend']);
        Route::post('/admins/{id}/activate', [AdminController::class, 'activate']);

        // Activity Logs
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
        
        // System Settings
        Route::get('/settings', [AdminController::class, 'settings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);
    });

});
