<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillingController extends Controller
{
    public function generateInvoice(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'unit_id' => 'required|exists:units,id',
            'amount' => 'required|numeric',
            'month' => 'required|integer',
            'year' => 'required|integer',
        ]);

        $invoice = Invoice::create($validated);
        
        // Logic to deduct from credit balance would go here
        
        return response()->json($invoice, 201);
    }

    public function recordPayment(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'amount' => 'required|numeric',
            'method' => 'required|string',
            'reference' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $payment = Payment::create($validated);
            
            // Update tenant balance
            $tenant = Tenant::findOrFail($validated['tenant_id']);
            $tenant->balance += $validated['amount'];
            $tenant->save();

            // Auto-allocate to pending invoices logic would go here
        });

        return response()->json(['message' => 'Payment recorded successfully'], 201);
    }
}
