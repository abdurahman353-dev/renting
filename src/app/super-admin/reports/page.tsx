"use client";

import { useState, useEffect } from "react";
import { saasAPI } from "@/data/apis";
import { toast } from "sonner";
import Cookies from "js-cookie";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
    Filter,
    Eye,
    Receipt,
    Search,
    Coins,
    TrendingUp,
    TrendingDown,
    Info,
    CheckCircle2,
    AlertTriangle,
    FileText,
    X,
    ChevronRight,
    ArrowRight,
    RotateCcw
} from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

    // Month Audit & Forensic Ledger Modal States
    const [auditModalOpen, setAuditModalOpen] = useState(false);
    const [auditMonthNum, setAuditMonthNum] = useState<number | null>(null);
    const [auditYear, setAuditYear] = useState<number>(year);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditData, setAuditData] = useState<any>(null);
    const [auditSearchQuery, setAuditSearchQuery] = useState("");
    const [auditCategoryFilter, setAuditCategoryFilter] = useState<'all' | 'topup' | 'deduction' | 'adjustment'>('all');
    const [auditOrgFilter, setAuditOrgFilter] = useState<string>('all');
    const [auditPlanFilter, setAuditPlanFilter] = useState<string>('all');
    const [auditStartDate, setAuditStartDate] = useState<string>('');
    const [auditEndDate, setAuditEndDate] = useState<string>('');
    const [auditMinAmount, setAuditMinAmount] = useState<string>('');
    const [auditMaxAmount, setAuditMaxAmount] = useState<string>('');
    const [auditTab, setAuditTab] = useState<'ledger' | 'agencies'>('ledger');
    const [selectedAuditTx, setSelectedAuditTx] = useState<any>(null);
    const [showAuditFiltersMobile, setShowAuditFiltersMobile] = useState(false);

    const executeAuditQuery = async (params: any) => {
        setAuditLoading(true);
        try {
            const data = await saasAPI.getSaasMonthAudit(params);
            setAuditData(data);
            if (data?.start_date_raw) setAuditStartDate(data.start_date_raw);
            if (data?.end_date_raw) setAuditEndDate(data.end_date_raw);
        } catch (err: any) {
            console.error("Failed to load audit:", err);
            toast.error(err?.response?.data?.message || "Failed to load financial audit.");
        } finally {
            setAuditLoading(false);
        }
    };

    const openMonthAudit = async (monthNum: number, targetYear = year) => {
        setAuditMonthNum(monthNum);
        setAuditYear(targetYear);
        setAuditModalOpen(true);
        setAuditSearchQuery("");
        setAuditCategoryFilter('all');
        setAuditOrgFilter('all');
        setAuditPlanFilter('all');
        setAuditMinAmount('');
        setAuditMaxAmount('');
        setAuditTab('ledger');

        const mStr = String(monthNum).padStart(2, '0');
        const start = `${targetYear}-${mStr}-01`;
        const lastDay = new Date(targetYear, monthNum, 0).getDate();
        const end = `${targetYear}-${mStr}-${String(lastDay).padStart(2, '0')}`;
        setAuditStartDate(start);
        setAuditEndDate(end);

        await executeAuditQuery({
            year: targetYear,
            month: monthNum,
        });
    };

    // Automatic Filter Change Handlers
    const handleStartDateChange = (val: string) => {
        setAuditStartDate(val);
        if (val && auditEndDate) {
            executeAuditQuery({
                start_date: val,
                end_date: auditEndDate,
                organization_id: auditOrgFilter,
                plan: auditPlanFilter,
            });
        }
    };

    const handleEndDateChange = (val: string) => {
        setAuditEndDate(val);
        if (auditStartDate && val) {
            executeAuditQuery({
                start_date: auditStartDate,
                end_date: val,
                organization_id: auditOrgFilter,
                plan: auditPlanFilter,
            });
        }
    };

    const handleOrgFilterChange = (val: string) => {
        setAuditOrgFilter(val);
        executeAuditQuery({
            start_date: auditStartDate,
            end_date: auditEndDate,
            organization_id: val,
            plan: auditPlanFilter,
        });
    };

    const handlePlanFilterChange = (val: string) => {
        setAuditPlanFilter(val);
        executeAuditQuery({
            start_date: auditStartDate,
            end_date: auditEndDate,
            organization_id: auditOrgFilter,
            plan: val,
        });
    };

    const handleClearAuditFilters = async () => {
        setAuditSearchQuery("");
        setAuditCategoryFilter('all');
        setAuditOrgFilter('all');
        setAuditPlanFilter('all');
        setAuditMinAmount('');
        setAuditMaxAmount('');
        
        const mNum = auditMonthNum || (new Date().getMonth() + 1);
        const tYear = auditYear || new Date().getFullYear();
        const mStr = String(mNum).padStart(2, '0');
        const start = `${tYear}-${mStr}-01`;
        const lastDay = new Date(tYear, mNum, 0).getDate();
        const end = `${tYear}-${mStr}-${String(lastDay).padStart(2, '0')}`;
        setAuditStartDate(start);
        setAuditEndDate(end);

        toast.info("Filters cleared to default month view.");
        await executeAuditQuery({
            year: tYear,
            month: mNum,
        });
    };

    const handleExportAuditCSV = () => {
        if (!auditData?.transactions) return;
        const headers = ["Timestamp", "Organization Name", "Current Plan", "Action Type", "Amount (KES)", "Wallet Before (KES)", "Wallet After (KES)", "M-Pesa Reference", "Recorded By", "Notes"];
        const rows = (filteredAuditTransactions || []).map((t: any) => [
            `"${t.formatted_date}"`,
            `"${(t.organization_name || '').replace(/"/g, '""')}"`,
            t.current_org_plan,
            `"${t.action_label}"`,
            t.amount_paid,
            t.wallet_before,
            t.wallet_after,
            `"${t.mpesa_reference || ''}"`,
            `"${(t.recorded_by || '').replace(/"/g, '""')}"`,
            `"${(t.note || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `saas_audit_ledger_${auditData.month_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'statement'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported filtered audit ledger (${rows.length} records) as CSV`);
    };

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

    const maxMonthlyNet = Math.max(...monthlyBreakdown.map((m: any) => m.net_revenue || 0), 1000);

    const filteredAuditTransactions = (auditData?.transactions || []).filter((t: any) => {
        if (auditCategoryFilter !== 'all') {
            if (auditCategoryFilter === 'topup' && t.action_category !== 'topup') return false;
            if (auditCategoryFilter === 'deduction' && t.action_category !== 'deduction') return false;
            if (auditCategoryFilter === 'adjustment' && t.action_category !== 'adjustment') return false;
        }
        if (auditOrgFilter !== 'all' && String(t.organization_id) !== String(auditOrgFilter)) {
            return false;
        }
        if (auditPlanFilter !== 'all' && (t.current_org_plan || '').toLowerCase() !== auditPlanFilter.toLowerCase()) {
            return false;
        }
        if (auditMinAmount) {
            const min = parseFloat(auditMinAmount);
            if (!isNaN(min) && Math.abs(t.amount_paid) < min) return false;
        }
        if (auditMaxAmount) {
            const max = parseFloat(auditMaxAmount);
            if (!isNaN(max) && Math.abs(t.amount_paid) > max) return false;
        }
        if (auditSearchQuery.trim()) {
            const q = auditSearchQuery.toLowerCase();
            const orgMatch = (t.organization_name || '').toLowerCase().includes(q);
            const refMatch = (t.mpesa_reference || '').toLowerCase().includes(q);
            const noteMatch = (t.note || '').toLowerCase().includes(q);
            const recordedByMatch = (t.recorded_by || '').toLowerCase().includes(q);
            const actionMatch = (t.action_label || '').toLowerCase().includes(q);
            if (!orgMatch && !refMatch && !noteMatch && !recordedByMatch && !actionMatch) {
                return false;
            }
        }
        return true;
    });

    // Dynamic Filtered Context & Real-Time Card Calculations
    const activeSelectedOrg = auditData?.agencies_summary?.find(
        (ag: any) => String(ag.organization_id) === String(auditOrgFilter)
    );

    const isAuditFiltered =
        auditOrgFilter !== 'all' ||
        auditCategoryFilter !== 'all' ||
        auditPlanFilter !== 'all' ||
        !!auditSearchQuery.trim() ||
        !!auditMinAmount ||
        !!auditMaxAmount;

    const filteredGrossTopups = filteredAuditTransactions
        .filter((t: any) => t.action_category === 'topup' && t.amount_paid > 0)
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount_paid) || 0), 0);
    const filteredTopupCount = filteredAuditTransactions
        .filter((t: any) => t.action_category === 'topup' && t.amount_paid > 0).length;

    const filteredAdjustDeductions = filteredAuditTransactions
        .filter((t: any) => t.action_category === 'adjustment' && t.amount_paid < 0)
        .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount_paid) || 0), 0);
    const filteredAdjustCount = filteredAuditTransactions
        .filter((t: any) => t.action_category === 'adjustment' && t.amount_paid < 0).length;

    const filteredPlanDeductions = filteredAuditTransactions
        .filter((t: any) => t.action_category === 'deduction' || t.payment_type === 'monthly_deduction')
        .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount_paid) || 0), 0);
    const filteredPlanDeductionCount = filteredAuditTransactions
        .filter((t: any) => t.action_category === 'deduction' || t.payment_type === 'monthly_deduction').length;

    const filteredNetCash = filteredGrossTopups - filteredAdjustDeductions;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-muted/30 min-h-screen">
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
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={handleExportCSV}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold gap-1.5 text-xs shadow-sm shadow-emerald-500/20"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export Annual CSV
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-lg bg-card overflow-hidden">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time Horizon:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Year:</span>
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="2020"
                                    max="2099"
                                    value={yearInput}
                                    onChange={(e) => setYearInput(e.target.value)}
                                    className="w-20 h-9 rounded-xl border border-input bg-background px-2.5 text-xs font-bold text-center"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-3 rounded-xl text-xs font-bold"
                                    onClick={() => {
                                        const y = parseInt(yearInput, 10);
                                        if (y >= 2020 && y <= 2099) {
                                            setYear(y);
                                        } else {
                                            toast.error("Please enter a valid year between 2020 and 2099.");
                                        }
                                    }}
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Month:</span>
                            <select
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold"
                            >
                                {MONTH_NAMES.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Day:</span>
                            <select
                                value={day}
                                onChange={(e) => setDay(e.target.value)}
                                disabled={month === "all"}
                                className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold disabled:opacity-50"
                            >
                                <option value="all">All Days</option>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                    <option key={d} value={d.toString()}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-lg shadow-emerald-500/5 bg-card overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Platform Lifetime Revenue</CardTitle>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            KES {Math.max(0, summary.total_lifetime_revenue || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1">
                            <span>Avg. KES {Math.max(0, summary.avg_revenue_per_agency || 0).toLocaleString()} per agency</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg shadow-indigo-500/5 bg-card overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-400" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            {new Date().toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })} Revenue
                        </CardTitle>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                            <Calendar className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-black text-foreground">
                            KES {Math.max(0, summary.this_month_revenue || 0).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs font-bold">
                            {summary.mom_growth_percent >= 0 ? (
                                <span className="text-emerald-600 flex items-center gap-0.5">
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                    +{summary.mom_growth_percent}% MoM
                                </span>
                            ) : (
                                <span className="text-red-500 flex items-center gap-0.5">
                                    <ArrowDownRight className="h-3.5 w-3.5" />
                                    {summary.mom_growth_percent}% MoM
                                </span>
                            )}
                            <span className="text-muted-foreground font-normal">vs {new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg shadow-blue-500/5 bg-card overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Paying Agencies</CardTitle>
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                            <Building2 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl sm:text-3xl font-black text-foreground">
                            {summary.active_agencies_count || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            Landlords &amp; property managers with active status
                        </p>
                    </CardContent>
                </Card>

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
                            KES {Math.max(0, summary.last_month_revenue || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                            Previous 30-day billing period baseline
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl bg-card">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>Monthly Revenue Performance ({year}{selectedMonthLabel ? ` — ${selectedMonthLabel}` : ""})</span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            Real-time breakdown of gross top-ups, typo adjustments, plan deductions, and net cash earnings. Click any row or &quot;Inspect&quot; to audit every single shilling.
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
                                    <TableHead className="font-bold text-xs text-center">Transactions</TableHead>
                                    <TableHead className="font-bold text-xs text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthlyBreakdown.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs font-semibold">
                                            No financial data for selected time filter ({year}{selectedMonthLabel ? ` - ${selectedMonthLabel}` : ""}).
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    monthlyBreakdown.map((m: any) => {
                                        const percent = Math.min(100, Math.max(5, (m.net_revenue / maxMonthlyNet) * 100));
                                        const isCurrentMonth = new Date().getFullYear() === year && (new Date().getMonth() + 1) === m.month_num;
                                        return (
                                            <TableRow 
                                                key={m.month_num} 
                                                onClick={() => openMonthAudit(m.month_num, year)}
                                                className={`cursor-pointer transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/60 ${
                                                    isCurrentMonth ? "bg-emerald-50/40 dark:bg-emerald-950/20 font-semibold" : ""
                                                }`}
                                            >
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
                                                    KES {Math.max(0, m.net_revenue || 0).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="w-40">
                                                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                                                            style={{ width: `${m.net_revenue > 0 ? percent : 0}%` }}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-xs text-muted-foreground">
                                                    {m.transaction_count} tx
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openMonthAudit(m.month_num, year);
                                                        }}
                                                        className="h-8 px-2.5 rounded-xl text-xs font-bold border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 gap-1.5 shadow-xs"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Audit Details</span>
                                                    </Button>
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

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
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

            {/* Monthly Financial Audit & Forensic Ledger Modal (Units Page UI Style + Large Screen Support) */}
            <Dialog open={auditModalOpen} onOpenChange={setAuditModalOpen}>
                <DialogContent className="!max-w-[96vw] sm:!max-w-[95vw] md:!max-w-[92vw] lg:!max-w-7xl w-[96vw] max-h-[96vh] h-[94vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card">
                    {/* Header styled exactly like Units page */}
                    <DialogHeader className="p-4 sm:p-6 pb-4 border-b border-border bg-card text-left shrink-0">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800">
                                        <Receipt className="w-3.5 h-3.5" />
                                        Financial Audit &amp; Ledger
                                    </span>
                                    {auditData?.date_range && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 font-mono">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {auditData.date_range.start} – {auditData.date_range.end}
                                        </span>
                                    )}
                                    {auditData?.summary?.total_transactions !== undefined && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                                            {auditData.summary.total_transactions} Records Found
                                        </span>
                                    )}
                                </div>
                                <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground text-left">
                                    {auditData?.month_name || 'Financial'} Reconciliation
                                </DialogTitle>
                                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5 text-left">
                                    Reconciled forensic breakdown of all {auditData?.summary?.total_transactions || 0} ledger actions across {auditData?.summary?.active_agencies_count || 0} participating landlord organizations.
                                </DialogDescription>
                            </div>

                            {/* Top Quick Actions */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <Button
                                    size="sm"
                                    variant={showAuditFiltersMobile ? "secondary" : "outline"}
                                    onClick={() => setShowAuditFiltersMobile(!showAuditFiltersMobile)}
                                    className="h-9 px-3 rounded-xl font-bold gap-1.5 text-xs shadow-xs md:hidden"
                                >
                                    <Filter className="w-3.5 h-3.5" />
                                    <span>{showAuditFiltersMobile ? "Close Filters" : "Filters"}</span>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => executeAuditQuery({
                                        start_date: auditStartDate,
                                        end_date: auditEndDate,
                                        organization_id: auditOrgFilter,
                                        plan: auditPlanFilter,
                                    })}
                                    disabled={auditLoading}
                                    className="h-9 px-3 rounded-xl font-bold gap-1.5 text-xs shadow-xs"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? "animate-spin" : ""}`} />
                                    <span>Refresh Audit</span>
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleExportAuditCSV}
                                    disabled={!auditData?.transactions?.length}
                                    className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs gap-1.5"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Export to CSV</span>
                                </Button>
                            </div>
                        </div>

                        {/* Automatic Real-Time Filter Suite (Collapsible on mobile, always visible on md+) */}
                        <div className={`${showAuditFiltersMobile ? "grid" : "hidden md:grid"} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 mt-3 border-t border-border bg-muted/30 p-3 rounded-xl`}>
                            {/* From Date */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">From Date</label>
                                <Input
                                    type="date"
                                    value={auditStartDate}
                                    onChange={(e) => handleStartDateChange(e.target.value)}
                                    className="h-8 text-xs bg-background"
                                />
                            </div>

                            {/* To Date */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">To Date</label>
                                <Input
                                    type="date"
                                    value={auditEndDate}
                                    onChange={(e) => handleEndDateChange(e.target.value)}
                                    className="h-8 text-xs bg-background"
                                />
                            </div>

                            {/* Landlord Organization */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Landlord / Agency</label>
                                <select
                                    value={auditOrgFilter}
                                    onChange={(e) => handleOrgFilterChange(e.target.value)}
                                    className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold"
                                >
                                    <option value="all">All Landlords</option>
                                    {auditData?.agencies_summary?.map((ag: any) => (
                                        <option key={ag.organization_id} value={ag.organization_id}>
                                            {ag.organization_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Plan Filter */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Subscription Plan</label>
                                <select
                                    value={auditPlanFilter}
                                    onChange={(e) => handlePlanFilterChange(e.target.value)}
                                    className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-semibold capitalize"
                                >
                                    <option value="all">All Plans</option>
                                    <option value="starter">Starter</option>
                                    <option value="growth">Growth</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>

                            {/* Min Amount */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Min KES</label>
                                <Input
                                    type="number"
                                    placeholder="Min Amount"
                                    value={auditMinAmount}
                                    onChange={(e) => setAuditMinAmount(e.target.value)}
                                    className="h-8 text-xs bg-background"
                                />
                            </div>

                            {/* Clear Filters Action */}
                            <div className="space-y-1 flex items-end">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleClearAuditFilters}
                                    className="h-8 w-full px-3 text-xs font-bold gap-1.5 text-red-600 border-red-200 bg-red-50/60 hover:bg-red-100 hover:text-red-700 hover:border-red-300 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/40 transition-colors"
                                    title="Clear and reset all filters"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                    <span>Clear Filters</span>
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    {auditLoading ? (
                        <div className="p-16 flex flex-col items-center justify-center min-h-[380px] space-y-3">
                            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                            <p className="text-sm font-semibold text-muted-foreground">
                                Performing forensic reconciliation and loading ledger...
                            </p>
                        </div>
                    ) : !auditData ? (
                        <div className="p-12 text-center text-muted-foreground text-sm font-semibold">
                            No audit data found for this time range.
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5 bg-muted/20 w-full max-w-full min-w-0">
                            {/* Summary Card with Narrative & 4-Box KPI Equation (Dynamic to Selected Landlord & Filters) */}
                            <Card className="border-border shadow-sm bg-card w-full max-w-full min-w-0 overflow-hidden">
                                <CardContent className="p-4 sm:p-5 space-y-4">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                Reconciliation Summary &amp; Math Equation
                                            </span>
                                            {activeSelectedOrg ? (
                                                <Badge variant="outline" className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300">
                                                    {activeSelectedOrg.organization_name}
                                                </Badge>
                                            ) : isAuditFiltered ? (
                                                <Badge variant="outline" className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300">
                                                    Filtered View ({filteredAuditTransactions.length} actions)
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                                        {activeSelectedOrg ? (
                                            <>
                                                For <strong className="text-foreground">{auditData?.month_name || 'this period'}</strong>, <strong className="text-foreground">{activeSelectedOrg.organization_name}</strong> transacted across <strong className="text-foreground">{filteredAuditTransactions.length}</strong> total ledger actions. Gross cash deposits of <strong className="text-emerald-600 font-mono">KES {filteredGrossTopups.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> were recorded, with <strong className="text-red-500 font-mono">KES {filteredAdjustDeductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> in typo/adjustment reversals, yielding <strong className="text-emerald-700 dark:text-emerald-400 font-mono">KES {filteredNetCash.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> Net Cash Collected. Plan fees consumed: <strong className="text-indigo-600 font-mono">KES {filteredPlanDeductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>.
                                            </>
                                        ) : isAuditFiltered ? (
                                            <>
                                                Showing filtered reconciliation across <strong className="text-foreground">{filteredAuditTransactions.length}</strong> matching ledger action(s). Gross cash deposits of <strong className="text-emerald-600 font-mono">KES {filteredGrossTopups.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>, typo adjustments of <strong className="text-red-500 font-mono">KES {filteredAdjustDeductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong>, yielding <strong className="text-emerald-700 dark:text-emerald-400 font-mono">KES {filteredNetCash.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> Net Cash Collected.
                                            </>
                                        ) : (
                                            auditData.summary.narrative
                                        )}
                                    </p>

                                    {/* Responsive 4-Box Metric Grid (Dynamically Calculated) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 w-full min-w-0">
                                        {/* 1. Gross Top-ups */}
                                        <div className="p-3.5 rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50/60 dark:bg-green-950/20 min-w-0">
                                            <span className="text-[11px] font-bold text-green-700 dark:text-green-300 uppercase">Gross Top-ups (+)</span>
                                            <p className="text-lg sm:text-xl font-extrabold text-green-700 dark:text-green-300 font-mono mt-0.5 truncate">
                                                +KES {filteredGrossTopups.toLocaleString()}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground font-medium">{filteredTopupCount} payment{filteredTopupCount !== 1 ? 's' : ''} received</span>
                                        </div>

                                        {/* 2. Typo Corrections */}
                                        <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 min-w-0">
                                            <span className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase">Typo Deductions (−)</span>
                                            <p className="text-lg sm:text-xl font-extrabold text-red-600 dark:text-red-400 font-mono mt-0.5 truncate">
                                                −KES {filteredAdjustDeductions.toLocaleString()}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground font-medium">{filteredAdjustCount} reversal{filteredAdjustCount !== 1 ? 's' : ''}</span>
                                        </div>

                                        {/* 3. Net Cash Collected */}
                                        <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs min-w-0">
                                            <span className="text-[11px] font-bold text-foreground uppercase">Net Cash Collected (=)</span>
                                            <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 truncate">
                                                KES {filteredNetCash.toLocaleString()}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground font-medium">Actual net platform cash</span>
                                        </div>

                                        {/* 4. Plan Fees Realized */}
                                        <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/20 min-w-0">
                                            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">Plan Fees Billed</span>
                                            <p className="text-lg sm:text-xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono mt-0.5 truncate">
                                                KES {filteredPlanDeductions.toLocaleString()}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground font-medium">{filteredPlanDeductionCount} renewal{filteredPlanDeductionCount !== 1 ? 's' : ''} charged</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tabs Component: Itemized Ledger & Landlord Contributions */}
                            <Tabs value={auditTab} onValueChange={(v: any) => setAuditTab(v)} className="space-y-4 w-full min-w-0 max-w-full">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
                                    <TabsList className="bg-muted/80 p-1 rounded-xl w-full sm:w-auto flex flex-wrap sm:flex-nowrap h-auto gap-1">
                                        <TabsTrigger value="ledger" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-1.5 flex-1 sm:flex-initial text-center justify-center">
                                            <Receipt className="w-3.5 h-3.5 shrink-0" />
                                            <span>Itemized Audit Ledger ({filteredAuditTransactions.length})</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="agencies" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-1.5 flex-1 sm:flex-initial text-center justify-center">
                                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                                            <span>Landlord Contributions ({auditData.agencies_summary?.length || 0})</span>
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* TAB 1: ITEMIZED TRANSACTION LEDGER */}
                                <TabsContent value="ledger" className="space-y-4 m-0 w-full min-w-0 max-w-full">
                                    {/* Search and Category Filter Card (Units Page Style) */}
                                    <Card className="border-border shadow-sm bg-card w-full max-w-full min-w-0 overflow-hidden">
                                        <CardHeader className="p-4">
                                            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between w-full min-w-0">
                                                <div className="relative flex-1 w-full max-w-full lg:max-w-md">
                                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search by landlord, M-Pesa reference, or note..."
                                                        className="pl-9 bg-accent/20 border-input placeholder:text-muted-foreground text-xs sm:text-sm h-9 w-full"
                                                        value={auditSearchQuery}
                                                        onChange={(e) => setAuditSearchQuery(e.target.value)}
                                                    />
                                                </div>

                                                {/* Professional Styled Filter Chips (No harsh black backgrounds) */}
                                                <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => setAuditCategoryFilter('all')}
                                                        className={cn(
                                                            "h-8 px-3 text-xs font-semibold rounded-lg transition-all border flex-1 sm:flex-initial flex items-center justify-center gap-1",
                                                            auditCategoryFilter === 'all'
                                                                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xs font-bold"
                                                                : "bg-background text-muted-foreground hover:bg-muted border-border font-medium"
                                                        )}
                                                    >
                                                        All ({auditData.transactions?.length || 0})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAuditCategoryFilter('topup')}
                                                        className={cn(
                                                            "h-8 px-3 text-xs font-semibold rounded-lg transition-all border flex-1 sm:flex-initial flex items-center justify-center gap-1",
                                                            auditCategoryFilter === 'topup'
                                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold ring-2 ring-emerald-500/20"
                                                                : "bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100/70 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800 font-medium"
                                                        )}
                                                    >
                                                        Top-Ups (+KES)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAuditCategoryFilter('deduction')}
                                                        className={cn(
                                                            "h-8 px-3 text-xs font-semibold rounded-lg transition-all border flex-1 sm:flex-initial flex items-center justify-center gap-1",
                                                            auditCategoryFilter === 'deduction'
                                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold ring-2 ring-indigo-500/20"
                                                                : "bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100/70 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800 font-medium"
                                                        )}
                                                    >
                                                        Plan Fees (-KES)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAuditCategoryFilter('adjustment')}
                                                        className={cn(
                                                            "h-8 px-3 text-xs font-semibold rounded-lg transition-all border flex-1 sm:flex-initial flex items-center justify-center gap-1",
                                                            auditCategoryFilter === 'adjustment'
                                                                ? "bg-rose-600 text-white border-rose-600 shadow-xs font-bold ring-2 ring-rose-500/20"
                                                                : "bg-rose-50/60 text-rose-700 hover:bg-rose-100/70 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800 font-medium"
                                                        )}
                                                    >
                                                        Typo Adjustments (-KES)
                                                    </button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0 w-full max-w-full overflow-hidden">
                                            <div className="w-full max-w-full overflow-x-auto max-h-[460px] xl:max-h-[540px] 2xl:max-h-[620px] overflow-y-auto relative rounded-b-xl">
                                                <Table className="w-full min-w-[840px]">
                                                    <TableHeader className="sticky top-0 bg-secondary/90 z-10 shadow-xs border-b border-border backdrop-blur-sm">
                                                        <TableRow>
                                                            <TableHead className="font-bold text-xs min-w-[130px]">Timestamp</TableHead>
                                                            <TableHead className="font-bold text-xs min-w-[170px]">Landlord / Agency</TableHead>
                                                            <TableHead className="font-bold text-xs min-w-[150px]">Action &amp; Purpose</TableHead>
                                                            <TableHead className="font-bold text-xs text-right min-w-[110px]">Amount (KES)</TableHead>
                                                            <TableHead className="font-bold text-xs min-w-[150px]">Wallet Impact</TableHead>
                                                            <TableHead className="font-bold text-xs min-w-[180px]">Reference &amp; Notes</TableHead>
                                                            <TableHead className="font-bold text-xs min-w-[120px]">Recorded By</TableHead>
                                                            <TableHead className="font-bold text-xs text-center min-w-[60px]">View</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {filteredAuditTransactions.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs font-semibold">
                                                                    No transactions match the selected filters.
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            filteredAuditTransactions.map((tx: any) => {
                                                                const isPositive = tx.amount_paid > 0;
                                                                const isDeduction = tx.payment_type === 'monthly_deduction' || (!isPositive && tx.payment_type === 'topup');
                                                                const isAdjustment = tx.payment_type === 'manual_adjustment' || tx.payment_type === 'wallet_correction';

                                                                return (
                                                                    <TableRow key={tx.id} className="hover:bg-muted/40 transition-colors">
                                                                        <TableCell className="font-mono text-[11px] whitespace-nowrap text-muted-foreground">
                                                                            {tx.formatted_date}
                                                                        </TableCell>

                                                                        <TableCell>
                                                                            <div className="space-y-0.5">
                                                                                <p className="font-bold text-xs text-foreground">
                                                                                    {tx.organization_name}
                                                                                </p>
                                                                                <Badge variant="outline" className="capitalize text-[9px] px-1 py-0 font-bold bg-muted/60">
                                                                                    {tx.current_org_plan}
                                                                                </Badge>
                                                                            </div>
                                                                        </TableCell>

                                                                        <TableCell>
                                                                            <Badge className={`text-[10px] font-bold border ${
                                                                                isDeduction
                                                                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
                                                                                    : isAdjustment
                                                                                        ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                                                                                        : 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                                                                            }`}>
                                                                                {tx.action_label}
                                                                            </Badge>
                                                                        </TableCell>

                                                                        <TableCell className={`text-right font-mono font-black text-xs ${
                                                                            isPositive
                                                                                ? 'text-green-600 dark:text-green-400'
                                                                                : 'text-red-600 dark:text-red-400'
                                                                        }`}>
                                                                            {isPositive ? '+' : ''}KES {tx.amount_paid.toLocaleString()}
                                                                        </TableCell>

                                                                        <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                                                                            <span>KES {tx.wallet_before.toLocaleString()}</span>
                                                                            <span className="mx-1 text-slate-400">➔</span>
                                                                            <span className="font-bold text-foreground">KES {tx.wallet_after.toLocaleString()}</span>
                                                                        </TableCell>

                                                                        <TableCell className="max-w-xs">
                                                                            <div className="space-y-0.5">
                                                                                {tx.mpesa_reference && (
                                                                                    <p className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                                                                        Ref: {tx.mpesa_reference}
                                                                                    </p>
                                                                                )}
                                                                                <p className="text-[11px] text-muted-foreground line-clamp-2">
                                                                                    {tx.note || '—'}
                                                                                </p>
                                                                            </div>
                                                                        </TableCell>

                                                                        <TableCell className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                                                            {tx.recorded_by}
                                                                        </TableCell>

                                                                        <TableCell className="text-center whitespace-nowrap">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => setSelectedAuditTx(tx)}
                                                                                className="h-7 w-7 p-0 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 inline-flex items-center justify-center"
                                                                                title="View Forensic Audit Details"
                                                                            >
                                                                                <Eye className="w-4 h-4" />
                                                                                <span className="sr-only">View Details</span>
                                                                            </Button>
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
                                </TabsContent>

                                {/* TAB 2: LANDLORD CONTRIBUTION SUMMARY */}
                                <TabsContent value="agencies" className="space-y-4 m-0 w-full min-w-0 max-w-full">
                                    <Card className="border-border shadow-sm bg-card w-full max-w-full min-w-0 overflow-hidden">
                                        <CardContent className="p-0 w-full max-w-full overflow-hidden">
                                            <div className="w-full max-w-full overflow-x-auto max-h-[460px] xl:max-h-[540px] 2xl:max-h-[620px] overflow-y-auto relative rounded-b-xl">
                                                <Table className="w-full min-w-[840px]">
                                                    <TableHeader className="sticky top-0 bg-secondary/90 z-10 shadow-xs border-b border-border backdrop-blur-sm">
                                                        <TableRow>
                                                            <TableHead className="font-bold text-xs min-w-[200px]">Landlord / Organization</TableHead>
                                                            <TableHead className="font-bold text-xs min-w-[120px]">Current Plan</TableHead>
                                                            <TableHead className="font-bold text-xs min-w-[140px]">Current Wallet</TableHead>
                                                            <TableHead className="font-bold text-xs text-green-600 min-w-[140px]">Gross Top-Ups (+)</TableHead>
                                                            <TableHead className="font-bold text-xs text-red-500 min-w-[140px]">Typo Reversals (−)</TableHead>
                                                            <TableHead className="font-bold text-xs text-indigo-600 min-w-[140px]">Plan Fees Deducted</TableHead>
                                                            <TableHead className="font-bold text-xs text-right text-green-600 min-w-[140px]">Net Cash Paid</TableHead>
                                                            <TableHead className="font-bold text-xs text-right min-w-[110px]">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {auditData.agencies_summary?.length === 0 ? (
                                                            <TableRow>
                                                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs font-semibold">
                                                                    No agencies transacted in this period.
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            auditData.agencies_summary?.map((ag: any) => (
                                                                <TableRow key={ag.organization_id} className="hover:bg-muted/40 transition-colors">
                                                                    <TableCell className="font-bold text-xs">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0">
                                                                                {ag.organization_name.charAt(0)}
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="font-bold text-foreground truncate">{ag.organization_name}</p>
                                                                                <p className="text-[10px] text-muted-foreground font-normal">{ag.transaction_count} actions in period</p>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline" className="capitalize text-[10px] font-bold">
                                                                            {ag.current_plan}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="font-mono text-xs font-semibold">
                                                                        KES {ag.current_wallet_balance.toLocaleString()}
                                                                    </TableCell>
                                                                    <TableCell className="font-mono text-xs font-bold text-green-600">
                                                                        +KES {ag.gross_topups.toLocaleString()}
                                                                    </TableCell>
                                                                    <TableCell className="font-mono text-xs font-semibold text-red-500">
                                                                        {ag.adjustments < 0 ? `−KES ${Math.abs(ag.adjustments).toLocaleString()}` : (ag.adjustments > 0 ? `+KES ${ag.adjustments.toLocaleString()}` : '—')}
                                                                    </TableCell>
                                                                    <TableCell className="font-mono text-xs font-medium text-indigo-600">
                                                                        KES {ag.plan_deductions.toLocaleString()}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-mono font-black text-sm text-green-600 dark:text-green-400">
                                                                        KES {ag.net_cash_paid.toLocaleString()}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => {
                                                                                handleOrgFilterChange(String(ag.organization_id));
                                                                                setAuditTab('ledger');
                                                                            }}
                                                                            className="h-7 px-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 gap-1"
                                                                        >
                                                                            <span>Filter Ledger</span>
                                                                            <ArrowRight className="w-3 h-3" />
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Individual Transaction Forensic Receipt Modal */}
            <Dialog open={!!selectedAuditTx} onOpenChange={(open) => !open && setSelectedAuditTx(null)}>
                <DialogContent className="max-w-xl w-[95vw] p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card">
                    {selectedAuditTx && (
                        <>
                            <DialogHeader className="p-5 pb-4 border-b border-border bg-muted/20 text-left">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800 font-mono">
                                        TX #{selectedAuditTx.id}
                                    </span>
                                    <Badge className={`text-xs font-bold border ${
                                        selectedAuditTx.action_category === 'deduction'
                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
                                            : selectedAuditTx.action_category === 'adjustment'
                                                ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                                                : 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                                    }`}>
                                        {selectedAuditTx.action_label}
                                    </Badge>
                                </div>
                                <DialogTitle className="text-xl font-extrabold text-foreground mt-2 text-left">
                                    Forensic Ledger Receipt
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground text-left">
                                    Detailed financial ledger entry for {selectedAuditTx.organization_name}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="p-5 space-y-4 text-sm">
                                {/* Amount Hero Card */}
                                <div className="p-4 rounded-xl border border-border bg-accent/20 flex items-center justify-between">
                                    <div>
                                        <span className="text-[11px] font-bold uppercase text-muted-foreground">Amount Transacted</span>
                                        <p className={`text-2xl font-black font-mono mt-0.5 ${
                                            selectedAuditTx.amount_paid > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {selectedAuditTx.amount_paid > 0 ? '+' : ''}KES {selectedAuditTx.amount_paid.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[11px] font-bold uppercase text-muted-foreground">Wallet Math</span>
                                        <p className="text-xs font-mono text-muted-foreground mt-0.5">
                                            KES {selectedAuditTx.wallet_before.toLocaleString()} ➔ <strong className="text-foreground">KES {selectedAuditTx.wallet_after.toLocaleString()}</strong>
                                        </p>
                                    </div>
                                </div>

                                {/* Detailed Metadata Grid */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="p-2.5 rounded-lg border border-border bg-card">
                                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Landlord Organization</span>
                                        <span className="font-bold text-foreground">{selectedAuditTx.organization_name}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg border border-border bg-card">
                                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Plan Tier</span>
                                        <span className="font-bold capitalize text-foreground">{selectedAuditTx.current_org_plan}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg border border-border bg-card">
                                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Timestamp</span>
                                        <span className="font-mono text-foreground">{selectedAuditTx.formatted_date}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg border border-border bg-card">
                                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Recorded By</span>
                                        <span className="font-semibold text-foreground">{selectedAuditTx.recorded_by}</span>
                                    </div>
                                    {selectedAuditTx.mpesa_reference && (
                                        <div className="p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 col-span-2">
                                            <span className="text-indigo-700 dark:text-indigo-400 block text-[10px] uppercase font-bold">M-Pesa Reference</span>
                                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-300">{selectedAuditTx.mpesa_reference}</span>
                                        </div>
                                    )}
                                    {selectedAuditTx.billing_period_start && (
                                        <div className="p-2.5 rounded-lg border border-border bg-card col-span-2">
                                            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Billing Cycle Covered</span>
                                            <span className="font-mono text-foreground">{selectedAuditTx.billing_period_start} – {selectedAuditTx.billing_period_end}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Administrative Audit Note */}
                                <div className="p-3 rounded-lg border border-border bg-muted/40 text-xs space-y-1">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Administrative Note &amp; Audit Log</span>
                                    <p className="text-foreground leading-relaxed">
                                        {selectedAuditTx.note || 'Standard system financial transaction record.'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 border-t border-border bg-card flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedAuditTx(null)}
                                    className="font-bold text-xs"
                                >
                                    Close
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
