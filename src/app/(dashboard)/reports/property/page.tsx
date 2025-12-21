"use client";

import { useState, useEffect } from "react";
import { Download, Filter } from "lucide-react";
import { financeAPI, propertyAPI } from "@/data/apis";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PropertyReportPage() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);

    // Default to current month/year
    const [filters, setFilters] = useState({
        property_id: "all",
        month: new Date().getMonth() + 1, // 1-12
        year: new Date().getFullYear()
    });

    useEffect(() => {
        loadProperties();
    }, []);

    useEffect(() => {
        fetchReport();
    }, [filters]);

    const loadProperties = async () => {
        try {
            const res = await propertyAPI.getAll();
            setProperties(res);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await financeAPI.getPropertyReport(filters);
            setData(res);
        } catch (error) {
            console.error("Failed to fetch report:", error);
            toast.error("Failed to fetch report data");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!data || data.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Property Name", "Total Units", "Occupied Units", "Vacant Units", "Total Deposits", "Amount Paid", "Balance"];
        const rows = data.map((row: any) => [
            `"${row.name}"`,
            row.total_units,
            row.occupied_units,
            row.vacant_units,
            row.total_deposits || 0,
            row.amount_paid,
            row.balance
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `property_monthly_report_${filters.year}_${filters.month}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const months = [
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" }
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Property Report</h1>
                    <p className="text-slate-500 mt-1">Monthly summary of occupancy and financials</p>
                </div>
                <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Property Select */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Property</label>
                        <select
                            className="w-full p-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.property_id}
                            onChange={(e) => setFilters({ ...filters, property_id: e.target.value })}
                        >
                            <option value="all">All Properties</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Month Select */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Month</label>
                        <select
                            className="w-full p-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.month}
                            onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year Select */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
                        <select
                            className="w-full p-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.year}
                            onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg text-slate-800">Detailed Report</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Property Name</th>
                                <th className="px-6 py-3 text-center">Total Units</th>
                                <th className="px-6 py-3 text-center text-emerald-600">Occupied Units</th>
                                <th className="px-6 py-3 text-center text-slate-400">Vacant Units</th>
                                {/* <th className="px-6 py-3 text-right">Deposits</th> */}
                                <th className="px-6 py-3 text-right">Amount Paid</th>
                                <th className="px-6 py-3 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No records found.</td></tr>
                            ) : (
                                data.map((row: any) => (
                                    <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                                        <td className="px-6 py-4 text-center">{row.total_units}</td>
                                        <td className="px-6 py-4 text-center font-medium text-emerald-600 bg-emerald-50 rounded-lg">{row.occupied_units}</td>
                                        <td className="px-6 py-4 text-center text-slate-500">{row.vacant_units}</td>
                                        {/* <td className="px-6 py-4 text-right font-medium text-blue-600">
                                            {Number(row.total_deposits || 0).toLocaleString()}
                                        </td> */}
                                        <td className="px-6 py-4 text-right font-medium text-slate-700">
                                            {Number(row.amount_paid).toLocaleString()}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${row.balance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {Number(row.balance).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
