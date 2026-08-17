"use client";

import { useState, useEffect } from "react";
import { saasAPI } from "@/data/apis";
import { toast } from "sonner";
import Cookies from "js-cookie";
import Link from "next/link";
import {
    BarChart3,
    DollarSign,
    Building2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Sparkles,
    ShieldCheck,
    Zap,
    Download,
    RefreshCw,
    Clock,
    FileSpreadsheet,
    Filter
} from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const MONTH_NAMES = [
    { value: "all", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
];

export default function SaasReportsPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Dynamic Time & Filter States
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [yearInput, setYearInput] = useState<string>(new Date().getFullYear().toString());
    const [month, setMonth] = useState<string>("all");
    const [day, setDay] = useState<string>("all");
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);

    const [reportData, setReportData] = useState<any>(null);

    const fetchReports = async (
        targetYear = year,
        targetMonth = month,
        targetDay = day,
        targetPage = page,
        targetPerPage = perPage,
        silent = false
    ) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            const data = await saasAPI.getSaasReports({
                year: targetYear,
                month: targetMonth,
                day: targetDay,
                page: targetPage,
                per_page: targetPerPage,
            });
            setReportData(data);
        } catch (error: any) {
            console.error("Failed to load SaaS financial reports:", error);
            if (error.response?.status === 403) {
                toast.error("Super Admin session invalid or expired. Re-authenticating...");
                Cookies.remove("admin_token");
                sessionStorage.removeItem("admin_user");
                if (typeof window !== "undefined") {
                    window.location.href = "/login?error=unauthorized";
                }
            } else {
                toast.error("Failed to load SaaS financial reports.");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchReports(year, month, day, 1, perPage);
    }, [year, month, day, perPage]);

    const handleExportCSV = () => {
        if (!reportData?.monthly_breakdown) return;

        const headers = ["Month", "Gross Top-ups (KES)", "Adjustments / Corrections (KES)", "Internal Plan Fees (KES)", "Net Revenue (KES)", "Transactions Count"];
        const rows = reportData.monthly_breakdown.map((m: any) => [
            m.month_name,
            m.gross_topups,
            m.adjust_deductions,
            m.plan_deductions,
            m.net_revenue,
            m.transaction_count
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `saas_financial_report_${year}_${month}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Exported financial report for ${year} as CSV`);
    };

    if (loading && !reportData) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
                <p className="text-muted-foreground font-medium">Loading SaaS Financial Reports & Analytics...</p>
            </div>
        );
    }

    const summary = reportData?.summary || {};
    const monthlyBreakdown = reportData?.monthly_breakdown || [];
    const topAgenciesData = reportData?.top_agencies?.data || reportData?.recent_top_agencies || [];
    const topAgenciesMeta = reportData?.top_agencies;
    const revenueByPlan = reportData?.revenue_by_plan || [];

    const selectedMonthObj = MONTH_NAMES.find(m => m.value === month);
    const selectedMonthLabel = selectedMonthObj && month !== "all" ? selectedMonthObj.label : "";

    // Max monthly revenue for visual progress bar scale
    const maxMonthlyNet = Math.max(...monthlyBreakdown.map((m: any) => m.net_revenue || 0), 1000);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-muted/30 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-emerald-500 shrink-0" />
                        <span>SaaS Financial Reports &amp; Revenue Analytics</span>
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Real-time month-by-month earnings, growth metrics, and top revenue-generating landlords.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => fetchReports(year, month, day, page, perPage, true)}
                        disabled={refreshing}
                        className="rounded-xl font-bold gap-1.5 text-xs shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
                        Refresh
                    </Button>

                    <Button
                        onClick={handleExportCSV}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md text-xs gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Dynamic Time & Date Range Filter Bar */}
            <Card className="border-none shadow-md bg-card">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Time &amp; Period Filter:</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
                            {/* Strict 4-Digit Typeable Year Input (No Dropdown Hardcoding) */}
                            <div className="flex items-center gap-1.5 bg-background border rounded-xl px-3 py-1.5 shadow-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-bold text-muted-foreground uppercase">Year:</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={yearInput}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setYearInput(val);
                                        if (val.length === 4) {
                                            const num = parseInt(val, 10);
                                            if (num >= 2000 && num <= 2100) {
                                                setYear(num);
                                            }
                                        }
                                    }}
                                    onBlur={() => {
                                        if (yearInput.length !== 4) {
                                            setYearInput(year.toString());
                                        }
                                    }}
                                    placeholder="YYYY"
                                    className="w-16 bg-transparent text-sm font-black text-emerald-600 dark:text-emerald-400 focus:outline-none border-b border-emerald-500/30 focus:border-emerald-500 text-center font-mono"
                                />
                            </div>

                            {/* Month Selector */}
                            <div className="flex items-center gap-1.5 bg-background border rounded-xl px-3 py-1.5 shadow-sm">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Month:</span>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer"
                                >
                                    {MONTH_NAMES.map((m) => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Day Selector */}
                            <div className="flex items-center gap-1.5 bg-background border rounded-xl px-3 py-1.5 shadow-sm">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Day:</span>
                                <select
                                    value={day}
                                    onChange={(e) => setDay(e.target.value)}
                                    className="bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer"
                                >
                                    <option value="all">All Days</option>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                        <option key={d} value={d}>Day {d}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards Row */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

                {/* This Month's Revenue */}
                <Card className="border-none shadow-lg shadow-emerald-500/5 bg-card overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">This Month ({new Date().toLocaleString('en-KE', { month: 'short' })})</CardTitle>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            KES {(summary.this_month_revenue || 0).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                            <Badge className={`text-[11px] font-bold px-1.5 py-0.5 border-0 ${
                                (summary.mom_growth_percent || 0) >= 0 ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"
                            }`}>
                                {(summary.mom_growth_percent || 0) >= 0 ? <ArrowUpRight className="w-3 h-3 inline mr-0.5" /> : <ArrowDownRight className="w-3 h-3 inline mr-0.5" />}
                                {Math.abs(summary.mom_growth_percent || 0)}% MoM
                            </Badge>
                            <span className="text-xs text-muted-foreground font-medium">vs last month</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Lifetime Revenue Collected */}
                <Card className="border-none shadow-lg shadow-indigo-500/5 bg-card overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-violet-400" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Lifetime Revenue</CardTitle>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                            <Sparkles className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                            KES {(summary.total_lifetime_revenue || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            Net top-ups &amp; wallet adjustments all-time
                        </p>
                    </CardContent>
                </Card>

                {/* Avg Revenue Per Agency */}
                <Card className="border-none shadow-lg shadow-purple-500/5 bg-card overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-indigo-400" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg Revenue / Agency</CardTitle>
                        <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
                            <Building2 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                            KES {(summary.avg_revenue_per_agency || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            Across {summary.active_agencies_count || 0} active subscriber agencies
                        </p>
                    </CardContent>
                </Card>

                {/* Last Month Baseline */}
                <Card className="border-none shadow-lg shadow-amber-500/5 bg-card overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-400" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Previous Month Revenue</CardTitle>
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                            <Clock className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                            KES {(summary.last_month_revenue || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            Previous 30-day billing period baseline
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Financial Performance Table (Scrollable Card) */}
            <Card className="border-none shadow-xl bg-card">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>Monthly Revenue Performance ({year}{selectedMonthLabel ? ` — ${selectedMonthLabel}` : ""})</span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            Real-time breakdown of gross top-ups, typo adjustments, plan deductions, and net cash earnings.
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="font-bold text-xs">Month</TableHead>
                                    <TableHead className="font-bold text-xs">Gross Top-ups (+)</TableHead>
                                    <TableHead className="font-bold text-xs">Typo / Wallet Deductions (−)</TableHead>
                                    <TableHead className="font-bold text-xs text-indigo-600">Plan Fees Charged</TableHead>
                                    <TableHead className="font-bold text-xs text-emerald-600">Net Revenue Collected</TableHead>
                                    <TableHead className="font-bold text-xs">Revenue Visual Bar</TableHead>
                                    <TableHead className="font-bold text-xs text-right">Transactions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthlyBreakdown.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs font-semibold">
                                            No financial data for selected time filter ({year}{selectedMonthLabel ? ` - ${selectedMonthLabel}` : ""}).
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    monthlyBreakdown.map((m: any) => {
                                        const percent = Math.min(100, Math.max(5, (m.net_revenue / maxMonthlyNet) * 100));
                                        const isCurrentMonth = new Date().getFullYear() === year && (new Date().getMonth() + 1) === m.month_num;
                                        return (
                                            <TableRow key={m.month_num} className={isCurrentMonth ? "bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold" : ""}>
                                                <TableCell className="font-bold text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span>{m.month_name}</span>
                                                        {isCurrentMonth && (
                                                            <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0 border-0">
                                                                Current
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs font-semibold text-emerald-600">
                                                    +KES {m.gross_topups.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs font-semibold text-red-500">
                                                    {m.adjust_deductions > 0 ? `−KES ${m.adjust_deductions.toLocaleString()}` : "—"}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-indigo-600 font-medium">
                                                    KES {m.plan_deductions.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                    KES {m.net_revenue.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="w-48">
                                                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                                                            style={{ width: `${m.net_revenue > 0 ? percent : 0}%` }}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-xs text-muted-foreground">
                                                    {m.transaction_count} tx
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Section: Scrollable Cards with Pagination */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">

                {/* Top Revenue-Generating Landlords Table (Scrollable + Paginated) */}
                <Card className="border-none shadow-xl bg-card lg:col-span-2">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-600 shrink-0" />
                                Top Revenue-Generating Landlords / Agencies
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                Ranked by total net cash paid into your SaaS platform.
                            </p>
                        </div>
                        {/* Per-Page Selector */}
                        <div className="flex items-center gap-2 text-xs font-semibold">
                            <span className="text-muted-foreground">Show:</span>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    const newSize = Number(e.target.value);
                                    setPerPage(newSize);
                                    fetchReports(year, month, day, 1, newSize);
                                }}
                                className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-bold"
                            >
                                <option value={5}>5 per page</option>
                                <option value={10}>10 per page</option>
                                <option value={25}>25 per page</option>
                                <option value={50}>50 per page</option>
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead className="font-bold text-xs">Agency Name</TableHead>
                                        <TableHead className="font-bold text-xs">Subscription Plan</TableHead>
                                        <TableHead className="font-bold text-xs">Status</TableHead>
                                        <TableHead className="font-bold text-xs">Net Cash Paid</TableHead>
                                        <TableHead className="font-bold text-xs text-right">Transactions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topAgenciesData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                                                No agency payments recorded yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        topAgenciesData.map((agency: any, index: number) => {
                                            const rankNum = topAgenciesMeta ? ((topAgenciesMeta.current_page - 1) * perPage) + index + 1 : index + 1;
                                            return (
                                                <TableRow key={agency.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                    <TableCell className="font-bold text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] flex items-center justify-center font-bold">
                                                                #{rankNum}
                                                            </span>
                                                            <div>
                                                                <div className="text-foreground">{agency.name}</div>
                                                                <div className="text-[10px] text-muted-foreground font-mono">{agency.email}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize font-bold text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-200">
                                                            <Zap className="w-2.5 h-2.5 mr-1 text-amber-500" />
                                                            {agency.subscription_plan || 'Starter'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`text-[10px] font-bold border-0 ${
                                                            agency.status === 'active' ? 'bg-emerald-500 text-white' : agency.status === 'trial' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                                                        }`}>
                                                            {agency.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                        KES {agency.net_payments.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-xs text-muted-foreground">
                                                        {agency.payment_count} tx
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Standardized Top Agencies Table Pagination Bar */}
                        {topAgenciesMeta && (
                            <PaginationControls
                                currentPage={page}
                                totalPages={topAgenciesMeta.last_page || 1}
                                onPageChange={(newPage) => {
                                    setPage(newPage);
                                    fetchReports(year, month, day, newPage, perPage);
                                }}
                                totalItems={topAgenciesMeta.total || 0}
                                itemsPerPage={perPage}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Revenue Distribution by Subscription Plan (Scrollable Card) */}
                <Card className="border-none shadow-xl bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                            Revenue by Plan Tier
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            Breakdown of payments collected by subscription tier.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[440px] overflow-y-auto">
                        {revenueByPlan.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4 text-center">No plan breakdown available.</p>
                        ) : (
                            revenueByPlan.map((plan: any) => {
                                const totalSum = revenueByPlan.reduce((acc: number, p: any) => acc + p.total_amount, 0) || 1;
                                const planPercent = Math.round((plan.total_amount / totalSum) * 100);
                                return (
                                    <div key={plan.plan} className="p-3.5 rounded-xl border bg-muted/30 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="capitalize text-foreground flex items-center gap-1.5">
                                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                                {plan.plan} Plan
                                            </span>
                                            <span className="text-emerald-600 font-mono font-black">
                                                KES {plan.total_amount.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-indigo-600 h-2 rounded-full"
                                                style={{ width: `${planPercent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                                            <span>{plan.tx_count} payment transaction{plan.tx_count !== 1 ? 's' : ''}</span>
                                            <span>{planPercent}% of total</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        <div className="pt-2 border-t text-center">
                            <Link href="/super-admin" className="text-xs font-bold text-indigo-600 hover:underline">
                                Go to SaaS Control Center →
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
