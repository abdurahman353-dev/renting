"use client";

import { useState, useEffect } from "react";
import {
    Building2,
    Search,
    Download,
    Filter,
    DollarSign,
    FileText,
    CheckCircle,
    Clock,
    Home
} from "lucide-react";
import apiClient, { financeAPI, propertyAPI, unitAPI } from "@/data/apis";
import { toast } from "sonner";

// Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PropertyReportPage() {
    const [loading, setLoading] = useState(false);
    const [properties, setProperties] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [reportData, setReportData] = useState<any>(null);

    const [filters, setFilters] = useState({
        property_id: "all",
        unit_id: "all",
        status: "all",
        start_date: "",
        end_date: ""
    });

    useEffect(() => {
        loadFilterOptions();
    }, []);

    useEffect(() => {
        fetchReport();
    }, [filters]); // Auto-fetch on filter change as requested ("whenever i filter i can be able to see the effect")

    const loadFilterOptions = async () => {
        try {
            const [propsData, unitsData] = await Promise.all([
                propertyAPI.getAll(),
                unitAPI.getAll()
            ]);
            setProperties(propsData);
            setUnits(unitsData);
        } catch (error) {
            console.error("Failed to load filter options:", error);
            // toast.error("Failed to load filter options");
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            // Convert 'all' to empty string or null if API expects that, but my API logic handled 'all' string explicitly.
            const data = await financeAPI.getPropertyReport(filters);
            setReportData(data);
        } catch (error) {
            console.error("Failed to fetch report:", error);
            toast.error("Failed to fetch report data");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!reportData?.table_data || reportData.table_data.length === 0) {
            toast.error("No data to export");
            return;
        }

        // CSV Generation
        const headers = ["Property Name", "Tenant Name", "Phone Number", "Unit", "Status", "Amount"];
        const rows = reportData.table_data.map((row: any) => [
            `"${row.property_name}"`, // Quote strings to handle commas
            `"${row.tenant_name}"`,
            `"${row.tenant_phone}"`,
            `"${row.unit}"`,
            `"${row.status}"`,
            row.amount
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r: any[]) => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `property_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter UI helpers
    const currentUnits = filters.property_id === 'all'
        ? units
        : units.filter((u: any) => u.property_id === parseInt(filters.property_id));

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Property Report</h1>
                    <p className="text-slate-500 mt-1">Comprehensive financial and occupancy reports</p>
                </div>
                <Button
                    onClick={handleExport}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4 text-slate-700 font-medium">
                    <Filter className="h-4 w-4" />
                    Filters
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <select
                        className="p-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.property_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, property_id: e.target.value, unit_id: 'all' }))}
                    >
                        <option value="all">All Properties</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <select
                        className="p-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.unit_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, unit_id: e.target.value }))}
                    >
                        <option value="all">All Units</option>
                        {currentUnits.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.unit_number}</option>
                        ))}
                    </select>

                    <select
                        className="p-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="all">All Statuses</option>
                        <option value="PAID">Paid</option>
                        <option value="PENDING">Pending</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="OVERDUE">Overdue</option>
                    </select>

                    <input
                        type="date"
                        className="p-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.start_date}
                        onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                        placeholder="Start Date"
                    />

                    <input
                        type="date"
                        className="p-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.end_date}
                        onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                        placeholder="End Date"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Properties</CardTitle>
                        <Building2 className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{reportData?.summary?.total_properties || 0}</div>
                        <p className="text-xs text-slate-500 mt-1">Active in system</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            KES {(reportData?.summary?.total_revenue || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Based on filtered selection</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Paid Invoices</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{reportData?.summary?.paid_count || 0}</div>
                        <p className="text-xs text-slate-500 mt-1">Fully settled payments</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Pending Invoices</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{reportData?.summary?.pending_count || 0}</div>
                        <p className="text-xs text-slate-500 mt-1">Awaiting payment</p>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg text-slate-800">Detailed Report</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Property Name</th>
                                <th className="px-6 py-3">Tenant Name</th>
                                <th className="px-6 py-3">Phone Number</th>
                                <th className="px-6 py-3">Unit</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        Loading report data...
                                    </td>
                                </tr>
                            ) : (!reportData?.table_data || reportData.table_data.length === 0) ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No records found matching filters.
                                    </td>
                                </tr>
                            ) : (
                                reportData.table_data.map((row: any, index: number) => (
                                    <tr key={index} className="bg-white hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{row.property_name}</td>
                                        <td className="px-6 py-4 text-slate-600">{row.tenant_name}</td>
                                        <td className="px-6 py-4 text-slate-600">{row.tenant_phone}</td>
                                        <td className="px-6 py-4 text-slate-600">{row.unit}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                                row.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                    row.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            {Number(row.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {reportData?.table_data && reportData.table_data.length > 0 && (
                            <tfoot className="bg-slate-50 font-semibold text-slate-900 border-t border-slate-200">
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-right">Total Amount</td>
                                    <td className="px-6 py-4 text-right">
                                        KES {Number(reportData.summary?.total_filtered_amount || 0).toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </Card>
        </div>
    );
}


