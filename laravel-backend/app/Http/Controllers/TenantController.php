<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index()
    {
        return response()->json(Tenant::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'id_number' => 'required|string|unique:tenants',
            'phone' => 'required|string',
            'email' => 'nullable|email',
        ]);

        $tenant = Tenant::create($validated);
        return response()->json($tenant, 201);
    }

    public function show($id)
    {
        return response()->json(Tenant::with(['leases', 'invoices', 'payments'])->findOrFail($id));
    }
}
