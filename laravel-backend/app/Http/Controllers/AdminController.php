<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function index() {}
    public function store(Request $request) {}
    public function update(Request $request, $id) {}
    public function destroy($id) {}
    public function suspend($id) {}
    public function activate($id) {}
    public function settings() {}
    public function updateSettings(Request $request) {}
}
