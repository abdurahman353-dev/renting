"use client";

import { useState, useEffect } from "react";
import { Download, Filter, User, CreditCard, AlertCircle } from "lucide-react";
import { financeAPI, propertyAPI } from "@/data/apis";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default function TenantReportPage() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [perPage] = useState(15);

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
        fetchReport(1);
    }, [filters]);

    const handlePageChange = (page: number) => {
        fetchReport(page);
    };

    const loadProperties = async () => {
        try {
            const res = await propertyAPI.getAll();
            // Handle paginated response ({ data: [...] }) or plain array
            setProperties(Array.isArray(res) ? res : (res.data ?? []));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReport = async (page = 1) => {
        setLoading(true);
        try {
            const res = await financeAPI.getTenantReport({
                ...filters,
                page,
                per_page: perPage
            });
            if (res && res.data) {
                setData(res.data);
                setCurrentPage(res.current_page);
                setLastPage(res.last_page);
                setTotalItems(res.total);
            } else {
                setData(Array.isArray(res) ? res : []);
            }
        } catch (error) {
            console.error("Failed to fetch report:", error);
            toast.error("Failed to fetch tenant report data");
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
        const titleRow = [`${monthLabel} ${filters.year} Tenant Financial Report`];
        const headers = ["Property Name", "Tenant", "Status", "Phone Number", "Unit", "Initial Dues", "(Rent+Deposits)", "Arrears", "Amount Paid", "Repair Expenses", "Net Collected", "Balance"];
        const rows = (data || []).map((row: any) => [
            `"${row.property_name}"`,
            `"${row.tenant_name}"`,
            `"${row.status}"`,
            `"${row.phone}"`,
            `"${row.unit_number}"`,
            row.initial_dues,
            row.rent,
            row.arrears,
            row.amount_paid,
            row.repair_expenses || 0,
            row.net_collected !== undefined ? row.net_collected : (Number(row.amount_paid || 0) - Number(row.repair_expenses || 0)),
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
        link.setAttribute("download", `tenant_report_${filters.year}_${filters.month}.csv`);
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

    const totalPaid = (data || []).reduce((acc, curr) => acc + Number(curr.amount_paid || 0), 0);
    const totalBalance = (data || []).reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
    const debtors = (data || []).filter(d => d.balance < 0).length;

    if (loading && (!data || data.length === 0)) {
        return (
            <div className="p-6 space-y-6 min-h-screen bg-muted/40">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                        <div className="h-9 w-64 bg-muted animate-pulse rounded-lg" />
                        <div className="h-4 w-80 bg-muted/60 animate-pulse rounded-md" />
                    </div>
                    <div className="h-10 w-36 bg-muted animate-pulse rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-28 rounded-xl bg-card border border-border shadow-sm p-5 animate-pulse space-y-2">
                            <div className="h-3 w-24 bg-muted rounded" />
                            <div className="h-7 w-28 bg-muted rounded" />
                        </div>
                    ))}
                </div>
                <div className="h-24 rounded-xl bg-card border border-border shadow-sm animate-pulse" />
                <div className="h-80 rounded-xl bg-card border border-border shadow-sm p-6 animate-pulse space-y-4">
                    <div className="h-6 w-48 bg-muted rounded" />
                    <div className="space-y-3 pt-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-10 w-full bg-muted/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 min-h-screen bg-muted/40">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Tenants Ledger Report</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Monthly financial overview of all tenant accounts
                    </p>
                </div>
                <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg border-none transition-all active:scale-95">
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="flex items-center p-6">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform">
                                <CreditCard className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Page Collected</p>
                                {loading ? (
                                    <div className="h-7 w-24 bg-muted animate-pulse rounded my-1" />
                                ) : (
                                    <p className="text-2xl font-black text-foreground">{totalPaid.toLocaleString()}</p>
                                )}
                            </div>
                        </div>
                        <div className="h-1 w-full bg-emerald-500/10">
                            <div className="h-full bg-emerald-500 w-full animate-pulse"></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="flex items-center p-6">
                            <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform">
                                <AlertCircle className="h-6 w-6 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Page Outstanding</p>
                                {loading ? (
                                    <div className="h-7 w-24 bg-muted animate-pulse rounded my-1" />
                                ) : (
                                    <p className="text-2xl font-black text-rose-600">{Math.abs(totalBalance).toLocaleString()}</p>
                                )}
                            </div>
                        </div>
                        <div className="h-1 w-full bg-rose-500/10">
                            <div className="h-full bg-rose-500 w-[70%]"></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="flex items-center p-6">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform">
                                <User className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Page Debtors</p>
                                {loading ? (
                                    <div className="h-7 w-12 bg-muted animate-pulse rounded my-1" />
                                ) : (
                                    <p className="text-2xl font-black text-foreground">{debtors}</p>
                                )}
                            </div>
                        </div>
                        <div className="h-1 w-full bg-indigo-500/10">
                            <div className="h-full bg-indigo-500 w-full"></div>
                        </div>
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
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Property</label>
                        <select
                            className="w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.property_id}
                            onChange={(e) => setFilters({ ...filters, property_id: e.target.value })}
                        >
                            <option value="all">Global View (All)</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

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
                    <CardTitle className="text-lg text-foreground font-semibold">Detailed Report</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <table className="w-full text-sm text-left relative">
                        <thead className="text-xs text-muted-foreground uppercase bg-slate-50 border-b sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3">Property</th>
                                <th className="px-6 py-3">Tenant Info</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-center">Unit</th>
                                <th className="px-6 py-3 text-right text-rose-500 font-semibold">Initial Dues</th>
                                <th className="px-6 py-3 text-right text-slate-900 font-semibold">(Rent+Deposits)</th>
                                <th className="px-6 py-3 text-right text-orange-600 font-semibold">Arrears</th>
                                <th className="px-6 py-3 text-right text-emerald-600 font-bold">Amount Collected</th>
                                <th className="px-6 py-3 text-right text-amber-600 font-bold">Repair Expenses</th>
                                <th className="px-6 py-3 text-right text-blue-600 font-extrabold">Net Collected</th>
                                <th className="px-6 py-3 text-right font-bold">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={`skel-tenant-${i}`} className="border-b border-border/50 animate-pulse">
                                        <td className="px-6 py-4"><div className="h-3.5 w-20 bg-muted rounded" /></td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 w-28 bg-muted rounded mb-1.5" />
                                            <div className="h-3 w-16 bg-muted/60 rounded" />
                                        </td>
                                        <td className="px-6 py-4"><div className="h-4 w-14 bg-muted rounded-full" /></td>
                                        <td className="px-6 py-4 text-center"><div className="h-4 w-8 bg-muted rounded mx-auto" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-4 w-12 bg-muted rounded ml-auto" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-4 w-12 bg-muted rounded ml-auto" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-4 w-12 bg-muted rounded ml-auto" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-4 w-14 bg-muted rounded ml-auto" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-4 w-14 bg-muted rounded ml-auto" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-4 w-14 bg-muted rounded ml-auto" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-4 w-12 bg-muted rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : (!data || data.length === 0) ? (
                                <tr key="empty-row">
                                    <td colSpan={11} className="px-6 py-8 text-center text-slate-500 font-medium">
                                        No tenant transactions recorded for this period.
                                    </td>
                                </tr>
                            ) : (
                                (data || []).map((row: any) => {
                                    const repairExpenses = Number(row.repair_expenses || 0);
                                    const amountPaid = Number(row.amount_paid || 0);
                                    const netCollected = row.net_collected !== undefined ? Number(row.net_collected) : (amountPaid - repairExpenses);

                                    return (
                                        <tr key={row.id} className="bg-card hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground text-[10px] uppercase truncate max-w-[120px]">{row.property_name}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-foreground">{row.tenant_name}</div>
                                                <div className="text-[10px] text-muted-foreground">{row.phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${row.status?.toLowerCase() === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                                    : (row.status?.toLowerCase() === 'inactive'
                                                        ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                                        : 'bg-slate-500/10 text-slate-600 border border-slate-500/20')
                                                    }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-foreground font-bold">{row.unit_number}</span>
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
                                                {Number(row.balance).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={lastPage}
                    onPageChange={handlePageChange}
                    totalItems={totalItems}
                    itemsPerPage={perPage}
                />
            </Card>
        </div>
    );
}
