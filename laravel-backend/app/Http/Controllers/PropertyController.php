<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Unit;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    public function index()
    {
        return response()->json(Property::with('units')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'location' => 'required|string',
            'total_units' => 'required|integer',
        ]);

        $property = Property::create($validated);
        return response()->json($property, 201);
    }

    public function show($id)
    {
        return response()->json(Property::with('units')->findOrFail($id));
    }

    public function addUnit(Request $request, $propertyId)
    {
        $validated = $request->validate([
            'unit_number' => 'required|string',
            'price' => 'required|numeric',
        ]);

        $property = Property::findOrFail($propertyId);
        $unit = $property->units()->create($validated);

        return response()->json($unit, 201);
    }
}
