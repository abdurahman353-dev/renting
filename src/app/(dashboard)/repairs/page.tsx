"use client";

import { useEffect, useState, useCallback } from "react";
import { repairAPI, propertyAPI, tenantAPI, unitAPI } from "@/data/apis";
import { toast } from "sonner";
import {
  Wrench,
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Building2,
  Home,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X,
  User,
  Calendar,
} from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Repair {
  id: number;
  unit_id: number;
  tenant_id: number | null;
  invoice_id: number | null;
  title: string;
  description: string | null;
  vendor: string | null;
  cost: number;
  paid_by: "tenant" | "landlord";
  status: "pending" | "in_progress" | "completed" | "charged";
  reported_date: string | null;
  completed_date: string | null;
  notes: string | null;
  unit_number: string;
  property_name: string;
  tenant_name: string | null;
  invoice?: { invoice_number: string } | null;
  created_at: string;
}

interface RepairForm {
  property_id: string;
  unit_id: string;
  tenant_id: string;
  title: string;
  description: string;
  vendor: string;
  cost: string;
  paid_by: "tenant" | "landlord";
  status: "pending" | "in_progress" | "completed";
  reported_date: string;
  completed_date: string;
  notes: string;
}

interface Property { id: number; name: string; }
interface Unit {
  id: number;
  unit_number: string;
  property_id: number;
  status?: string;
  type?: string;
  price?: number;
  property?: { name: string };
  active_lease?: {
    tenant?: {
      id: number;
      name: string;
      phone?: string;
      id_number?: string;
    };
  };
}
interface Tenant { id: number; name: string; phone?: string; id_number?: string; unit_id?: number; unit?: { id: number }; leases?: any[]; }

function getTenantForUnit(unitIdStr: string, unitsList: Unit[], tenantsList: Tenant[]) {
  if (!unitIdStr) return null;
  const unitId = Number(unitIdStr);

  const unitObj = unitsList.find((u) => u.id === unitId);
  if (unitObj?.active_lease?.tenant) {
    return unitObj.active_lease.tenant;
  }

  const matchedTenant = tenantsList.find((t: any) => {
    if (t.unit_id === unitId || t.unit?.id === unitId) return true;
    if (t.leases && Array.isArray(t.leases)) {
      return t.leases.some((l: any) => l.unit_id === unitId && (l.status || '').toLowerCase() === 'active');
    }
    return false;
  });

  return matchedTenant ?? null;
}

const EMPTY_FORM: RepairForm = {
  property_id: "",
  unit_id: "",
  tenant_id: "",
  title: "",
  description: "",
  vendor: "",
  cost: "",
  paid_by: "landlord",
  status: "pending",
  reported_date: "",
  completed_date: "",
  notes: "",
};

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:     { label: "Pending",     color: "bg-yellow-500 hover:bg-yellow-600 text-white border-0",    icon: Clock          },
  in_progress: { label: "In Progress", color: "bg-blue-500 hover:bg-blue-600 text-white border-0",          icon: AlertCircle    },
  completed:   { label: "Completed",   color: "bg-green-500 hover:bg-green-600 text-white border-0",       icon: CheckCircle2   },
  charged:     { label: "Charged",     color: "bg-purple-500 hover:bg-purple-600 text-white border-0",    icon: Receipt        },
};

const PAID_BY_CONFIG = {
  tenant:   { label: "Tenant",   color: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-0 font-medium" },
  landlord: { label: "Landlord", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-0 font-medium" },
};

function StatusBadge({ status }: { status: Repair["status"] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <Badge className={cfg.color}>
      {cfg.label}
    </Badge>
  );
}

function PaidByBadge({ paidBy }: { paidBy: Repair["paid_by"] }) {
  const cfg = PAID_BY_CONFIG[paidBy] ?? PAID_BY_CONFIG.landlord;
  return (
    <Badge className={cfg.color}>
      {cfg.label}
    </Badge>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RepairsPage() {
  // data
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // filter state
  const [search, setSearch]                 = useState("");
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterPaidBy, setFilterPaidBy]     = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo]     = useState("");
  const [page, setPage]                     = useState(1);
  const PER_PAGE = 15;

  // lookups
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits]           = useState<Unit[]>([]);
  const [tenants, setTenants]       = useState<Tenant[]>([]);

  // modals
  const [modalOpen, setModalOpen]           = useState(false);
  const [editRepair, setEditRepair]         = useState<Repair | null>(null);
  const [form, setForm]                     = useState<RepairForm>(EMPTY_FORM);
  const [saving, setSaving]                 = useState(false);
  const [deleteTarget, setDeleteTarget]     = useState<Repair | null>(null);
  const [chargeTarget, setChargeTarget]     = useState<Repair | null>(null);
  const [charging, setCharging]             = useState(false);
  const [deleting, setDeleting]             = useState(false);

  // ── Load lookups once ────────────────────────────────────────────────────
  useEffect(() => {
    propertyAPI.getAll().then((d) => setProperties(d.data ?? d)).catch(() => {});
    unitAPI.getAll({ per_page: 500 }).then((d) => setUnits(d.data ?? d)).catch(() => {});
    tenantAPI.getActive().then((d) => setTenants(d.data ?? d)).catch(() => {});
  }, []);

  // ── Fetch repairs ────────────────────────────────────────────────────────
  const fetchRepairs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: PER_PAGE };
      if (search)                          params.search      = search;
      if (filterProperty !== "all")        params.property_id = filterProperty;
      if (filterStatus   !== "all")        params.status      = filterStatus;
      if (filterPaidBy   !== "all")        params.paid_by     = filterPaidBy;
      if (filterDateFrom)                  params.date_from   = filterDateFrom;
      if (filterDateTo)                    params.date_to     = filterDateTo;

      const data = await repairAPI.getAll(params);
      setRepairs(data.data ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.last_page ?? 1);
    } catch {
      toast.error("Failed to load repairs");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterProperty, filterStatus, filterPaidBy, filterDateFrom, filterDateTo]);

  useEffect(() => { fetchRepairs(); }, [fetchRepairs]);

  // ── Open modal ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditRepair(null);
    setForm({
      ...EMPTY_FORM,
      reported_date: new Date().toISOString().split("T")[0],
    });
    setModalOpen(true);
  };

  const openEdit = (r: Repair) => {
    const unit = units.find((u) => u.id === r.unit_id);
    const propId = unit ? String(unit.property_id) : "";

    setEditRepair(r);
    setForm({
      property_id:    propId,
      unit_id:        String(r.unit_id),
      tenant_id:      r.tenant_id ? String(r.tenant_id) : "",
      title:          r.title,
      description:    r.description ?? "",
      vendor:         r.vendor ?? "",
      cost:           String(r.cost),
      paid_by:        r.paid_by,
      status:         r.status === "charged" ? "completed" : r.status,
      reported_date:  r.reported_date ?? "",
      completed_date: r.completed_date ?? "",
      notes:          r.notes ?? "",
    });
    setModalOpen(true);
  };

  // ── Form helpers ─────────────────────────────────────────────────────────
  const setField = <K extends keyof RepairForm>(k: K, v: RepairForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  // ── Save (create / update) ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.unit_id) { toast.error("Please select a unit"); return; }
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.cost || Number(form.cost) < 0) { toast.error("Enter a valid cost (≥ 0)"); return; }

    setSaving(true);
    try {
      const payload = {
        unit_id:        Number(form.unit_id),
        tenant_id:      form.paid_by === "tenant" && form.tenant_id ? Number(form.tenant_id) : null,
        title:          form.title.trim(),
        description:    form.description || null,
        vendor:         form.vendor || null,
        cost:           Number(form.cost),
        paid_by:        form.paid_by,
        status:         form.status,
        reported_date:  form.reported_date || null,
        completed_date: form.completed_date || null,
        notes:          form.notes || null,
      };

      if (editRepair) {
        await repairAPI.update(editRepair.id, payload);
        toast.success("Repair updated successfully");
      } else {
        await repairAPI.create(payload);
        toast.success("Repair logged successfully");
      }

      setModalOpen(false);
      fetchRepairs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to save repair");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await repairAPI.delete(deleteTarget.id);
      toast.success("Repair deleted successfully");
      setDeleteTarget(null);
      fetchRepairs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to delete repair");
    } finally {
      setDeleting(false);
    }
  };

  // ── Charge to tenant ─────────────────────────────────────────────────────
  const handleCharge = async () => {
    if (!chargeTarget) return;
    setCharging(true);
    try {
      await repairAPI.charge(chargeTarget.id);
      toast.success("Repair charged to tenant — invoice created");
      setChargeTarget(null);
      fetchRepairs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to charge tenant");
    } finally {
      setCharging(false);
    }
  };

  // ── Clear filters ────────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearch("");
    setFilterProperty("all");
    setFilterStatus("all");
    setFilterPaidBy("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  };

  const hasActiveFilters = search || filterProperty !== "all" || filterStatus !== "all" || filterPaidBy !== "all" || filterDateFrom || filterDateTo;
  const filterPropertyObj = properties.find(p => String(p.id) === filterProperty);
  const filterPropertyName = filterPropertyObj?.name || filterProperty;

  return (
    <div className="p-8 space-y-8 bg-muted/40 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Unit Repairs</h2>
          <p className="text-muted-foreground">Manage unit repair requests, costs, and tenant charges.</p>
        </div>

        <div className="flex gap-2">
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            onClick={openAdd}
          >
            <Plus className="mr-2 h-4 w-4" /> Log Repair
          </Button>
        </div>
      </div>

      {/* Professional Search and Filters */}
      <div className="bg-card rounded-xl shadow-lg border border-border p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Enhanced Search Bar */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Search Repairs
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by title, vendor, unit, or tenant..."
                className="pl-12 pr-4 h-12 text-base border-input focus:border-ring focus:ring-ring rounded-lg shadow-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {/* Property Filter */}
          <div className="lg:w-64">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              <Building2 className="inline w-4 h-4 mr-1" />
              Property
            </label>
            <select
              value={filterProperty}
              onChange={(e) => { setFilterProperty(e.target.value); setPage(1); }}
              className="w-full h-12 px-4 text-base rounded-lg border border-input bg-background shadow-sm focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none transition-all cursor-pointer hover:border-input"
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              <Wrench className="inline w-4 h-4 mr-1" />
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="w-full h-12 px-4 text-base rounded-lg border border-input bg-background shadow-sm focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none transition-all cursor-pointer hover:border-input"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="charged">Charged</option>
            </select>
          </div>

          {/* Paid By Filter */}
          <div className="lg:w-44">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              <DollarSign className="inline w-4 h-4 mr-1" />
              Paid By
            </label>
            <select
              value={filterPaidBy}
              onChange={(e) => { setFilterPaidBy(e.target.value); setPage(1); }}
              className="w-full h-12 px-4 text-base rounded-lg border border-input bg-background shadow-sm focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none transition-all cursor-pointer hover:border-input"
            >
              <option value="all">All Payers</option>
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
            </select>
          </div>

          {/* Date From Filter */}
          <div className="lg:w-44">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Date From
            </label>
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
              className="h-12 text-sm rounded-lg border border-input bg-background shadow-sm focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>

          {/* Date To Filter */}
          <div className="lg:w-44">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Date To
            </label>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
              className="h-12 text-sm rounded-lg border border-input bg-background shadow-sm focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Filters:</span>
              {search && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0">
                  Search: "{search}"
                  <button onClick={() => setSearch("")} className="ml-2 hover:text-blue-900">×</button>
                </Badge>
              )}
              {filterProperty !== "all" && (
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0">
                  Property: {filterPropertyName}
                  <button onClick={() => setFilterProperty("all")} className="ml-2 hover:text-purple-900">×</button>
                </Badge>
              )}
              {filterStatus !== "all" && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0">
                  Status: {filterStatus.replace("_", " ")}
                  <button onClick={() => setFilterStatus("all")} className="ml-2 hover:text-green-900">×</button>
                </Badge>
              )}
              {filterPaidBy !== "all" && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0">
                  Payer: {filterPaidBy}
                  <button onClick={() => setFilterPaidBy("all")} className="ml-2 hover:text-amber-900">×</button>
                </Badge>
              )}
              {filterDateFrom && (
                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-0">
                  From: {filterDateFrom}
                  <button onClick={() => setFilterDateFrom("")} className="ml-2 hover:text-indigo-900">×</button>
                </Badge>
              )}
              {filterDateTo && (
                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-0">
                  To: {filterDateTo}
                  <button onClick={() => setFilterDateTo("")} className="ml-2 hover:text-indigo-900">×</button>
                </Badge>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground underline ml-2"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="rounded-md border border-border bg-card shadow-sm">
        <div className="max-h-[600px] overflow-y-auto relative">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow>
                <TableHead className="bg-card">Repair Title</TableHead>
                <TableHead className="bg-card">Property / Unit</TableHead>
                <TableHead className="bg-card">Tenant</TableHead>
                <TableHead className="bg-card">Vendor</TableHead>
                <TableHead className="bg-card">Activity Dates</TableHead>
                <TableHead className="bg-card text-right">Cost (KES)</TableHead>
                <TableHead className="bg-card">Paid By</TableHead>
                <TableHead className="bg-card">Status</TableHead>
                <TableHead className="w-[50px] bg-card"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                      <span className="font-semibold text-base">Loading repairs...</span>
                      <span className="text-sm">Please wait while we fetch the repair records.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : repairs.length > 0 ? (
                repairs.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>{r.title}</div>
                      {r.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[240px]">
                          {r.description}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div>{r.property_name || "N/A"}</div>
                      <div className="text-xs text-muted-foreground">Unit: {r.unit_number}</div>
                    </TableCell>

                    <TableCell className="text-sm">
                      {r.tenant_name ? (
                        <span>{r.tenant_name}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm">
                      {r.vendor || <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>

                    <TableCell className="text-xs space-y-1">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>Reported: {r.reported_date ? new Date(r.reported_date).toLocaleDateString() : (r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A')}</span>
                      </div>
                      {r.completed_date && (
                        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>Completed: {new Date(r.completed_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {r.created_at && (
                        <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>Logged: {new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-semibold">
                      {Number(r.cost).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                    </TableCell>

                    <TableCell>
                      <PaidByBadge paidBy={r.paid_by} />
                    </TableCell>

                    <TableCell>
                      {r.status === "charged" ? (
                        <StatusBadge status={r.status} />
                      ) : (
                        <Select
                          value={r.status}
                          onValueChange={async (newStatus: Repair["status"]) => {
                            try {
                              await repairAPI.update(r.id, { status: newStatus });
                              toast.success(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
                              fetchRepairs();
                            } catch (err: any) {
                              toast.error(err?.response?.data?.message ?? "Failed to update status");
                            }
                          }}
                        >
                          <SelectTrigger className="h-9 border-2 border-slate-300 dark:border-slate-600 bg-card hover:bg-muted px-3 py-1 rounded-lg shadow-sm focus:ring-2 focus:ring-ring flex items-center justify-between gap-2 cursor-pointer text-xs font-semibold min-w-[135px]">
                            <SelectValue>
                              <StatusBadge status={r.status} />
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                <span>Pending</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="in_progress">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span>In Progress</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="completed">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span>Completed</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {r.status !== "charged" && (
                            <DropdownMenuItem onClick={() => openEdit(r)}>
                              <Pencil className="mr-2 h-4 w-4 text-slate-500" /> Edit Repair
                            </DropdownMenuItem>
                          )}
                          {r.paid_by === "tenant" && !r.invoice_id && r.status === "completed" && (
                            <DropdownMenuItem onClick={() => setChargeTarget(r)}>
                              <Receipt className="mr-2 h-4 w-4 text-purple-600" /> Charge to Tenant
                            </DropdownMenuItem>
                          )}
                          {r.invoice_id && r.invoice && (
                            <DropdownMenuItem disabled>
                              <Receipt className="mr-2 h-4 w-4 text-purple-600" /> {r.invoice.invoice_number}
                            </DropdownMenuItem>
                          )}
                          {r.status !== "charged" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                onClick={() => setDeleteTarget(r)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Repair
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="bg-muted p-6 rounded-full">
                        <Wrench className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">Log unit repairs by clicking Log Repair button</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">Keep track of property repairs, costs, and tenant invoices in one place.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        {total > 0 && (
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
            totalItems={total}
            itemsPerPage={15}
          />
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRepair ? "Edit Repair" : "Log New Repair"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="form-title">Title *</Label>
              <Input
                id="form-title"
                placeholder="e.g. Plumbing fix – leaking pipe"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="form-property">Property *</Label>
              <Select
                value={form.property_id}
                onValueChange={(v) => {
                  setField("property_id", v);
                  setField("unit_id", "");
                  setField("tenant_id", "");
                }}
              >
                <SelectTrigger id="form-property">
                  <SelectValue placeholder="Select property..." />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="form-unit">Unit *</Label>
              <Select
                value={form.unit_id}
                disabled={!form.property_id}
                onValueChange={(v) => {
                  setField("unit_id", v);
                  const t = getTenantForUnit(v, units, tenants);
                  if (t?.id) {
                    setField("tenant_id", String(t.id));
                  } else {
                    setField("tenant_id", "");
                  }
                }}
              >
                <SelectTrigger id="form-unit">
                  <SelectValue placeholder={form.property_id ? "Select unit..." : "Select property first"} />
                </SelectTrigger>
                <SelectContent>
                  {units
                    .filter((u) => String(u.property_id) === form.property_id)
                    .map((u) => {
                      const t = getTenantForUnit(String(u.id), units, tenants);
                      return (
                        <SelectItem key={u.id} value={String(u.id)}>
                          Unit {u.unit_number} {t ? `— Tenant: ${t.name}` : `(Vacant)`}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            {/* Tenant / Unit Confidence Card */}
            {form.unit_id && (() => {
              const selectedTenant = getTenantForUnit(form.unit_id, units, tenants);
              const selectedUnitObj = units.find((u) => String(u.id) === form.unit_id);

              if (selectedTenant) {
                return (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300 text-sm">
                      <User className="h-4 w-4" />
                      Active Tenant: {selectedTenant.name}
                    </div>
                    <div className="text-muted-foreground font-medium">
                      {selectedTenant.id_number ? `ID: ${selectedTenant.id_number} ` : ''}
                      {selectedTenant.phone ? `| Phone: ${selectedTenant.phone}` : ''}
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
                      ✓ Confirmed: Unit {selectedUnitObj?.unit_number} is occupied by {selectedTenant.name}.
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs space-y-1 font-medium">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300 text-sm">
                      <Home className="h-4 w-4" />
                      Unit Status: Vacant (No Active Tenant)
                    </div>
                    <div className="text-muted-foreground">
                      Unit {selectedUnitObj?.unit_number} has no active tenant registered.
                    </div>
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold pt-0.5">
                      ℹ️ Note: Set "Paid By" to Landlord for vacant unit maintenance.
                    </div>
                  </div>
                );
              }
            })()}

            <div className="grid gap-1.5">
              <Label htmlFor="form-cost">Cost (KES) *</Label>
              <Input
                id="form-cost"
                type="number"
                placeholder="0.00"
                value={form.cost}
                onChange={(e) => setField("cost", e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="form-paidby">Paid By *</Label>
              <Select
                value={form.paid_by}
                onValueChange={(v: "tenant" | "landlord") => setField("paid_by", v)}
              >
                <SelectTrigger id="form-paidby">
                  <SelectValue placeholder="Select payer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landlord">Landlord</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="form-vendor">Vendor / Contractor</Label>
              <Input
                id="form-vendor"
                placeholder="e.g. John Plumbing Services"
                value={form.vendor}
                onChange={(e) => setField("vendor", e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="form-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v: "pending" | "in_progress" | "completed") => setField("status", v)}
              >
                <SelectTrigger id="form-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="form-reported-date">Reported Date</Label>
                <Input
                  id="form-reported-date"
                  type="date"
                  value={form.reported_date}
                  onChange={(e) => setField("reported_date", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="form-completed-date">Completed Date</Label>
                <Input
                  id="form-completed-date"
                  type="date"
                  value={form.completed_date}
                  onChange={(e) => setField("completed_date", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="form-description">Description</Label>
              <Input
                id="form-description"
                placeholder="Detailed description of repair..."
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editRepair ? "Update Repair" : "Log Repair"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation alert */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Repair Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete repair "{deleteTarget?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Charge to tenant confirmation alert */}
      <AlertDialog open={!!chargeTarget} onOpenChange={() => setChargeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Charge Repair to Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              This will create an invoice of KES {Number(chargeTarget?.cost ?? 0).toLocaleString()} for tenant "{chargeTarget?.tenant_name ?? "assigned tenant"}" and update status to Charged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleCharge}
              disabled={charging}
            >
              {charging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Invoice & Charge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
