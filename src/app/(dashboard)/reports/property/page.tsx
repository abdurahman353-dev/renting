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

        const monthLabel = months.find(m => m.value === filters.month)?.label || "";
        const titleRow = [`${monthLabel} ${filters.year} Sales Report`];
        const headers = ["Property Name", "Initial Dues", "Rent & Arrears", "Amount Paid", "Balance"];
        const rows = data.map((row: any) => [
            `"${row.name}"`,
            row.initial_dues,
            row.rent_and_arrears,
            row.amount_paid,
            row.balance
        ]);

        const csvContent = [
            titleRow.join(","),
            "", // Empty row for spacing
            headers.join(","),
            ...rows.map((r) => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `property_report_${filters.year}_${filters.month}.csv`);
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
        <div className="p-6 space-y-6 bg-muted/40 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Property Report</h1>
                    <p className="text-muted-foreground mt-1">Monthly summary of occupancy and financials</p>
                </div>
                <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-4 text-foreground font-medium">
                    <Filter className="h-4 w-4" />
                    Filters
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Property Select */}
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Property</label>
                        <select
                            className="w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Month</label>
                        <select
                            className="w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Year</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            placeholder="YYYY"
                            className="w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.year || ''}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                if (val.length <= 4) {
                                    setFilters({ ...filters, year: parseInt(val) || 0 });
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <Card className="border-border shadow-sm overflow-hidden bg-card">
                <CardHeader>
                    <CardTitle className="text-lg text-foreground">Detailed Report</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                            <tr>
                                <th className="px-6 py-3">Property (Units T/O/V)</th>
                                <th className="px-6 py-3 text-right text-rose-500">Initial Dues</th>
                                <th className="px-6 py-3 text-right text-slate-900">Rent & Arrears</th>
                                <th className="px-6 py-3 text-right text-emerald-600">Amount Paid</th>
                                <th className="px-6 py-3 text-right font-bold">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No records found.</td></tr>
                            ) : (
                                data.map((row: any) => (
                                    <tr key={row.id} className="bg-card hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{row.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {row.total_units} units ({row.occupied_units} Occ / {row.vacant_units} Vac)
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-rose-500">
                                            {Number(row.initial_dues) !== 0 ? Number(row.initial_dues).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            {Number(row.rent_and_arrears) !== 0 ? Number(row.rent_and_arrears).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-emerald-600">
                                            {Number(row.amount_paid) !== 0 ? Number(row.amount_paid).toLocaleString() : '—'}
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
