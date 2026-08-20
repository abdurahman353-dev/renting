"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, Building2, Home, CheckCircle2, Calendar } from "lucide-react";

interface FilterComponentProps {
    properties: any[];
    units: any[];
    currentFilters: {
        property_id: string;
        unit_id: string;
        status: string;
        month: string;
        year: string;
    };
    onFilterChange: (filters: any) => void;
    onRefresh: () => void;
}

export default function FilterComponent({ properties, units, currentFilters, onFilterChange, onRefresh }: FilterComponentProps) {
    const months = [
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

    const filteredUnits = currentFilters.property_id !== "all"
        ? units.filter((u: any) => u.property_id.toString() === currentFilters.property_id)
        : [];

    const hasActiveFilters = currentFilters.property_id !== "all" || currentFilters.unit_id !== "all" || currentFilters.status !== "all" || Boolean(currentFilters.month) || Boolean(currentFilters.year);

    return (
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-wrap items-center gap-3 transition-all">
            {/* Filter Badge Header */}
            <div className="flex items-center gap-2 mr-1 border-r pr-3.5 border-border">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60">
                    <Filter className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Filters</span>
            </div>

            {/* Property Filter */}
            <div className="flex flex-col gap-1 min-w-[140px]">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider pl-0.5 flex items-center gap-1">
                    <Building2 className="w-2.5 h-2.5 text-blue-500" />
                    <span>Property</span>
                </span>
                <select
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors hover:bg-muted/40"
                    value={currentFilters.property_id}
                    onChange={(e) => {
                        onFilterChange({
                            property_id: e.target.value,
                            unit_id: "all"
                        });
                    }}
                >
                    <option value="all">All Properties</option>
                    {properties.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Unit Filter */}
            <div className={`flex flex-col gap-1 min-w-[110px] transition-opacity duration-200 ${currentFilters.property_id === 'all' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider pl-0.5 flex items-center gap-1">
                    <Home className="w-2.5 h-2.5 text-indigo-500" />
                    <span>Unit</span>
                </span>
                <select
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors hover:bg-muted/40"
                    value={currentFilters.unit_id}
                    onChange={(e) => onFilterChange({ unit_id: e.target.value })}
                    disabled={currentFilters.property_id === 'all'}
                >
                    <option value="all">All Units</option>
                    {filteredUnits.length > 0 ? (
                        filteredUnits.map((u) => (
                            <option key={u.id} value={u.id}>{u.unit_number}</option>
                        ))
                    ) : (
                        <option disabled>No units found</option>
                    )}
                </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1 min-w-[120px]">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider pl-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-amber-500" />
                    <span>Status</span>
                </span>
                <select
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors hover:bg-muted/40"
                    value={currentFilters.status}
                    onChange={(e) => onFilterChange({ status: e.target.value })}
                >
                    <option value="all">All Statuses</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="REVERSED">Reversed</option>
                </select>
            </div>

            {/* Month Filter */}
            <div className="flex flex-col gap-1 min-w-[110px]">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider pl-0.5 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-purple-500" />
                    <span>Month</span>
                </span>
                <select
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors hover:bg-muted/40"
                    value={currentFilters.month}
                    onChange={(e) => onFilterChange({ month: e.target.value })}
                >
                    <option value="">All Year</option>
                    {months.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
            </div>

            {/* Year Filter */}
            <div className="flex flex-col gap-1 min-w-[90px]">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider pl-0.5 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-purple-500" />
                    <span>Year</span>
                </span>
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors hover:bg-muted/40"
                    placeholder="YYYY"
                    value={currentFilters.year}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        onFilterChange({ year: val });
                    }}
                />
            </div>

            <div className="flex-1"></div>

            {/* Reset Button */}
            <Button
                variant="outline"
                onClick={onRefresh}
                size="sm"
                className={`mt-4 h-9 text-xs transition-colors font-semibold ${
                    hasActiveFilters
                        ? 'border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-900/60 dark:text-indigo-400 dark:bg-indigo-950/40'
                        : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
            >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Reset Filters
            </Button>
        </div>
    );
}
