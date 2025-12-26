import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter } from "lucide-react";

interface FilterComponentProps {
    properties: any[];
    units: any[];
    onFilterChange: (filters: any) => void;
    onRefresh: () => void;
}

export default function FilterComponent({ properties, units, onFilterChange, onRefresh }: FilterComponentProps) {
    const [selectedProperty, setSelectedProperty] = useState("all");
    const [selectedUnit, setSelectedUnit] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    // Generate month options
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

    // Generate year options
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2020 + 2 }, (_, i) => (currentYear + 1 - i).toString());

    // Filter units based on selected property
    const filteredUnits = selectedProperty !== "all"
        ? units.filter((u: any) => u.property_id.toString() === selectedProperty)
        : [];

    useEffect(() => {
        onFilterChange({
            property_id: selectedProperty,
            unit_id: selectedUnit,
            status: selectedStatus,
            month: selectedMonth,
            year: selectedYear
        });
    }, [selectedProperty, selectedUnit, selectedStatus, selectedMonth, selectedYear]);

    // Reset unit when property changes
    useEffect(() => {
        if (selectedProperty === "all") {
            setSelectedUnit("all");
        }
    }, [selectedProperty]);

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-500 mr-2 border-r pr-4 border-slate-200">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
            </div>

            {/* Property Filter */}
            <div className="flex flex-col gap-1 min-w-[150px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">Property</span>
                <select
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200 hover:bg-white"
                    value={selectedProperty}
                    onChange={(e) => {
                        setSelectedProperty(e.target.value);
                        setSelectedUnit("all"); // Reset unit on property change
                    }}
                >
                    <option value="all">All Properties</option>
                    {properties.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Unit Filter */}
            <div className={`flex flex-col gap-1 min-w-[120px] transition-opacity duration-300 ${selectedProperty === 'all' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">Unit</span>
                <select
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200 hover:bg-white"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    disabled={selectedProperty === 'all'}
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
            <div className="flex flex-col gap-1 min-w-[130px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">Status</span>
                <select
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200 hover:bg-white"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                >
                    <option value="all">All Statuses</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="OVERDUE">Overdue</option>
                </select>
            </div>

            {/* Month Filter */}
            <div className="flex flex-col gap-1 min-w-[120px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">Month</span>
                <select
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200 hover:bg-white"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                >
                    <option value="">All Year</option>
                    {months.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
            </div>

            {/* Year Filter */}
            <div className="flex flex-col gap-1 min-w-[100px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">Year</span>
                <select
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200 hover:bg-white"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                >
                    <option value="">All Time</option>
                    {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1"></div>

            <Button
                variant="outline"
                onClick={onRefresh}
                size="sm"
                className="mt-4 h-9 border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50"
            >
                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh
            </Button>
        </div>
    );
}
