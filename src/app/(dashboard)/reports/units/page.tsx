"use client";

import { useState, useEffect } from "react";
import { Download, Filter, Home, CheckCircle2, XCircle, User } from "lucide-react";
import { financeAPI, propertyAPI } from "@/data/apis";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnitsReportPage() {
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
            setProperties(Array.isArray(res) ? res : (res?.data || []));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await financeAPI.getUnitReport(filters);
            if (res && Array.isArray(res.data)) {
                setData(res.data);
            } else if (Array.isArray(res)) {
                setData(res);
            } else {
                setData(res?.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch report:", error);
            toast.error("Failed to fetch unit report data");
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
        const titleRow = [`${monthLabel} ${filters.year} Unit Financial Report`];
        const headers = ["Unit", "Property", "Tenant", "Status", "Initial Dues", "(Rent+Deposits)", "Arrears", "Amount Collected", "Landlord Repairs", "Net Collected", "Balance"];
        const rows = (data || []).map((row: any) => {
            const repairExpenses = Number(row.repair_expenses || 0);
            const amountPaid = Number(row.amount_paid || 0);
            const netCollected = row.net_collected !== undefined ? Number(row.net_collected) : (amountPaid - repairExpenses);

            return [
                `"${row.unit_number}"`,
                `"${row.property_name || ''}"`,
                `"${row.tenant_name}"`,
                `"${row.status}"`,
                row.initial_dues,
                row.rent,
                row.arrears,
                amountPaid,
                repairExpenses,
                netCollected,
                row.balance
            ];
        });

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
        link.setAttribute("download", `unit_financial_report_${filters.year}_${filters.month}.csv`);
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
    const years = [currentYear - 1, currentYear, currentYear + 1];

    const stats = {
        total: (data || []).length,
        occupied: (data || []).filter(u => u.status?.toLowerCase() === 'occupied').length,
        available: (data || []).filter(u => u.status?.toLowerCase() !== 'occupied').length,
        totalPaid: (data || []).reduce((sum, u) => sum + Number(u.amount_paid || 0), 0),
        totalRepairs: (data || []).reduce((sum, u) => sum + Number(u.repair_expenses || 0), 0),
        totalNet: (data || []).reduce((sum, u) => {
            const repairExp = Number(u.repair_expenses || 0);
            const paid = Number(u.amount_paid || 0);
            const net = u.net_collected !== undefined ? Number(u.net_collected) : (paid - repairExp);
            return sum + net;
        }, 0),
    };

    return (
        <div className="p-6 space-y-6 min-h-screen bg-muted/40">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Units Financial Report</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Comprehensive overview of unit occupancy, monthly collections, repair costs, and net income
                    </p>
                </div>
                <Button onClick={handleExport} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all active:scale-95">
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-5">
                        <div className="flex items-center">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mr-3">
                                <Home className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Units (Occ/Total)</p>
                                <p className="text-xl font-black text-foreground">{stats.occupied} / {stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Collected</p>
                        <p className="text-xl font-black text-emerald-600">KES {stats.totalPaid.toLocaleString()}</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Landlord Repairs</p>
                        <p className="text-xl font-black text-amber-600">KES {stats.totalRepairs.toLocaleString()}</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Net Collected</p>
                        <p className={`text-xl font-black ${stats.totalNet >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                            KES {stats.totalNet.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Occupancy Rate</p>
                        <p className="text-xl font-black text-indigo-600">
                            {stats.total > 0 ? `${Math.round((stats.occupied / stats.total) * 100)}%` : '0%'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-4 text-foreground font-medium">
                    <Filter className="h-4 w-4" />
                    Filters
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Property Select */}
                    <div className="space-y-1">
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
                    <div className="space-y-1">
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
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Year</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            placeholder="YYYY"
                            className="w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.year}
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
                    <CardTitle className="text-lg text-foreground font-semibold">Detailed Unit Financial Breakdown</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <table className="w-full text-sm text-left relative">
                        <thead className="text-xs text-muted-foreground uppercase bg-slate-50 border-b sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3">Unit Info</th>
                                <th className="px-6 py-3">Occupancy</th>
                                <th className="px-6 py-3 text-right text-rose-500 font-semibold">Initial Dues</th>
                                <th className="px-6 py-3 text-right text-slate-900 font-semibold">(Rent+Deposits)</th>
                                <th className="px-6 py-3 text-right text-orange-600 font-semibold">Arrears</th>
                                <th className="px-6 py-3 text-right text-emerald-600 font-bold">Amount Collected</th>
                                <th className="px-6 py-3 text-right text-amber-600 font-bold">Landlord Repairs</th>
                                <th className="px-6 py-3 text-right text-blue-600 font-extrabold">Net Collected</th>
                                <th className="px-6 py-3 text-right font-bold">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr key="loading-row">
                                    <td colSpan={9} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                                </tr>
                            ) : (!data || data.length === 0) ? (
                                <tr key="empty-row">
                                    <td colSpan={9} className="px-6 py-8 text-center text-slate-500 font-medium">
                                        No metrics found for this period.
                                    </td>
                                </tr>
                            ) : (
                                (data || []).map((row: any) => {
                                    const repairExpenses = Number(row.repair_expenses || 0);
                                    const amountPaid = Number(row.amount_paid || 0);
                                    const netCollected = row.net_collected !== undefined ? Number(row.net_collected) : (amountPaid - repairExpenses);

                                    return (
                                        <tr key={row.id} className="bg-card hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-foreground text-base">{row.unit_number}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase truncate max-w-[150px]">{row.property_name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${row.status.toLowerCase() === 'occupied'
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/50'
                                                        : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50'
                                                        }`}>
                                                        {row.status}
                                                    </span>
                                                    {row.tenant_name !== 'N/A' && (
                                                        <div className="text-[10px] font-bold text-foreground flex items-center gap-1">
                                                            <User className="h-3 w-3" /> {row.tenant_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-rose-500">
                                                {Number(row.initial_dues) !== 0 ? Number(row.initial_dues).toLocaleString() : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-900">
                                                {Number(row.rent) !== 0 ? Number(row.rent).toLocaleString() : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-orange-600">
                                                {Number(row.arrears) !== 0 ? Number(row.arrears).toLocaleString() : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                                {amountPaid > 0 ? amountPaid.toLocaleString() : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-amber-600">
                                                {repairExpenses > 0 ? `KES ${repairExpenses.toLocaleString()}` : '—'}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-black ${netCollected >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                                KES {netCollected.toLocaleString()}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${row.balance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {row.balance !== 0 ? Number(row.balance).toLocaleString() : (row.amount_paid > 0 ? '0' : '—')}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
