"use client";

import { useEffect, useState, useCallback } from "react";
import { repairAPI, propertyAPI, tenantAPI, unitAPI } from "@/data/apis";
import { toast } from "sonner";
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Loader2,
  Pencil,
  Trash2,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    };
  };
}
interface Tenant { id: number; name: string; unit_id?: number; unit?: { id: number }; }

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
  pending:     { label: "Pending",     color: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",    icon: Clock          },
  in_progress: { label: "In Progress", color: "bg-blue-500/15 text-blue-400 border-blue-500/30",          icon: AlertCircle    },
  completed:   { label: "Completed",   color: "bg-green-500/15 text-green-400 border-green-500/30",       icon: CheckCircle2   },
  charged:     { label: "Charged",     color: "bg-purple-500/15 text-purple-400 border-purple-500/30",    icon: Receipt        },
};

const PAID_BY_CONFIG = {
  tenant:   { label: "Tenant",   color: "bg-rose-500/15 text-rose-400 border-rose-500/30"     },
  landlord: { label: "Landlord", color: "bg-slate-500/15 text-slate-400 border-slate-500/30"  },
};

function StatusBadge({ status }: { status: Repair["status"] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1 text-xs ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
}

function PaidByBadge({ paidBy }: { paidBy: Repair["paid_by"] }) {
  const cfg = PAID_BY_CONFIG[paidBy] ?? PAID_BY_CONFIG.landlord;
  return (
    <Badge variant="outline" className={`text-xs ${cfg.color}`}>
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
  const [search, setSearch]             = useState("");
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterPaidBy, setFilterPaidBy]     = useState("all");
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

      const data = await repairAPI.getAll(params);
      setRepairs(data.data ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.last_page ?? 1);
    } catch {
      toast.error("Failed to load repairs");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterProperty, filterStatus, filterPaidBy]);

  useEffect(() => { fetchRepairs(); }, [fetchRepairs]);

  // ── Derived stats ────────────────────────────────────────────────────────
  const stats = {
    total:       repairs.length,
    pending:     repairs.filter((r) => r.status === "pending").length,
    inProgress:  repairs.filter((r) => r.status === "in_progress").length,
    completed:   repairs.filter((r) => r.status === "completed").length,
    charged:     repairs.filter((r) => r.status === "charged").length,
    totalCost:   repairs.reduce((s, r) => s + Number(r.cost), 0),
    tenantCost:  repairs.filter((r) => r.paid_by === "tenant").reduce((s, r) => s + Number(r.cost), 0),
  };

  // ── Unit list filtered by selected property (in modal) ───────────────────
  const filteredUnits = form.unit_id !== ""
    ? units
    : filterProperty !== "all"
      ? units.filter((u) => String(u.property_id) === filterProperty)
      : units;

  const modalUnits = units.filter((u) =>
    filterProperty !== "all" ? String(u.property_id) === filterProperty : true
  );

  // Tenants linked to selected unit in modal
  const unitTenants = form.unit_id
    ? tenants.filter((t) => String(t.unit_id) === form.unit_id || String(t.unit?.id) === form.unit_id)
    : tenants;

  // ── Open modal ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditRepair(null);
    setForm(EMPTY_FORM);
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
        toast.success("Repair updated");
      } else {
        await repairAPI.create(payload);
        toast.success("Repair logged");
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
      toast.success("Repair deleted");
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
    setSearch(""); setFilterProperty("all"); setFilterStatus("all"); setFilterPaidBy("all"); setPage(1);
  };

  const hasActiveFilters = search || filterProperty !== "all" || filterStatus !== "all" || filterPaidBy !== "all";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-500" />
            Unit Repairs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track repair work, costs, and optional tenant charges
          </p>
        </div>
        <Button id="btn-add-repair" onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Log Repair
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              KES {stats.totalCost.toLocaleString("en-KE", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{total} repairs tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
            <p className="text-xs text-muted-foreground mt-1">Work ongoing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Charged to Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-400">{stats.charged}</p>
            <p className="text-xs text-rose-400 mt-1">
              KES {stats.tenantCost.toLocaleString("en-KE")} billed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search-repairs"
                placeholder="Search title, vendor, unit, tenant…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>

            <Select value={filterProperty} onValueChange={(v) => { setFilterProperty(v); setPage(1); }}>
              <SelectTrigger id="filter-property" className="w-[180px]">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger id="filter-status" className="w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="charged">Charged</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPaidBy} onValueChange={(v) => { setFilterPaidBy(v); setPage(1); }}>
              <SelectTrigger id="filter-paid-by" className="w-[140px]">
                <SelectValue placeholder="All Payers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payers</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="landlord">Landlord</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button id="btn-clear-filters" variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                <X className="w-4 h-4" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repair</TableHead>
                <TableHead>Unit / Property</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Cost (KES)</TableHead>
                <TableHead>Paid By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                      <span>Loading repairs…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : repairs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Wrench className="w-10 h-10 opacity-30" />
                      <p className="font-medium">No repairs found</p>
                      {hasActiveFilters ? (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
                      ) : (
                        <Button size="sm" onClick={openAdd} className="gap-1">
                          <Plus className="w-4 h-4" /> Log first repair
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                repairs.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{r.title}</p>
                        {r.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                            {r.description}
                          </p>
                        )}
                        {r.reported_date && (
                          <p className="text-xs text-muted-foreground">
                            Reported: {new Date(r.reported_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{r.unit_number}</p>
                          <p className="text-xs text-muted-foreground">{r.property_name}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {r.tenant_name ? (
                        <span className="text-sm">{r.tenant_name}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="text-sm">{r.vendor || <span className="text-muted-foreground text-xs">—</span>}</span>
                    </TableCell>

                    <TableCell className="text-right font-mono font-medium">
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
                          <SelectTrigger className="h-auto p-0 border-none bg-transparent hover:bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 cursor-pointer">
                            <SelectValue>
                              <Badge variant="outline" className={`gap-1 text-xs cursor-pointer hover:brightness-110 transition-all ${STATUS_CONFIG[r.status].color}`}>
                                {(() => {
                                  const Icon = STATUS_CONFIG[r.status].icon;
                                  return <Icon className="w-3 h-3" />;
                                })()}
                                {STATUS_CONFIG[r.status].label}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {/* Charge to tenant */}
                        {r.paid_by === "tenant" && !r.invoice_id && (
                          r.status === "completed" ? (
                            <Button
                              id={`btn-charge-${r.id}`}
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                              onClick={() => setChargeTarget(r)}
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Charge
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="gap-1 text-xs opacity-50 cursor-not-allowed border-purple-500/20 text-purple-400/50"
                              title="Mark as Completed to enable charging"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Charge
                            </Button>
                          )
                        )}

                        {/* View invoice */}
                        {r.invoice_id && r.invoice && (
                          <span className="text-xs text-purple-400 font-medium px-2">
                            {r.invoice.invoice_number}
                          </span>
                        )}

                        {/* Edit — disabled for charged */}
                        {r.status !== "charged" && (
                          <Button
                            id={`btn-edit-${r.id}`}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(r)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Delete — disabled for charged */}
                        {r.status !== "charged" && (
                          <Button
                            id={`btn-delete-${r.id}`}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(r)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} · {total} repairs
            </p>
            <div className="flex gap-2">
              <Button
                id="btn-prev-page"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                id="btn-next-page"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              {editRepair ? "Edit Repair" : "Log New Repair"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {/* Title */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
              <Input
                id="form-title"
                placeholder="e.g. Plumbing fix – leaking pipe"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
              />
            </div>

            {/* Property */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Property <span className="text-destructive">*</span></label>
              <Select
                value={form.property_id}
                onValueChange={(v) => {
                  setField("property_id", v);
                  setField("unit_id", "");
                  setField("tenant_id", "");
                }}
              >
                <SelectTrigger id="form-property">
                  <SelectValue placeholder="Select property…" />
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

            {/* Unit */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Unit <span className="text-destructive">*</span></label>
              <Select
                value={form.unit_id}
                disabled={!form.property_id}
                onValueChange={(v) => {
                  setField("unit_id", v);
                  const selectedUnit = units.find((u) => String(u.id) === v);
                  const tenantId = selectedUnit?.active_lease?.tenant?.id;
                  if (tenantId) {
                    setField("tenant_id", String(tenantId));
                  } else {
                    const unitTenant = tenants.find((t) => String(t.unit_id) === v || String(t.unit?.id) === v);
                    setField("tenant_id", unitTenant ? String(unitTenant.id) : "");
                  }
                }}
              >
                <SelectTrigger id="form-unit">
                  <SelectValue placeholder={form.property_id ? "Select unit…" : "Select property first"} />
                </SelectTrigger>
                <SelectContent>
                  {units
                    .filter((u) => String(u.property_id) === form.property_id)
                    .map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.unit_number}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit details confirmation card */}
            {form.unit_id && (() => {
              const selectedUnit = units.find((u) => String(u.id) === form.unit_id);
              const selectedProp = properties.find((p) => String(p.id) === form.property_id) || selectedUnit?.property;
              const activeTenantName = selectedUnit?.active_lease?.tenant?.name;
              const activeTenantPhone = selectedUnit?.active_lease?.tenant?.phone;
              const unitTenant = tenants.find((t) => String(t.unit_id) === form.unit_id || String(t.unit?.id) === form.unit_id);
              const tenantName = activeTenantName || unitTenant?.name;

              return (
                <div className="sm:col-span-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.03] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                    <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      Unit Verification Details
                    </span>
                    <Badge variant="outline" className={
                      selectedUnit?.status?.toLowerCase() === 'occupied'
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-green-500/10 text-green-400 border-green-500/20"
                    }>
                      {selectedUnit?.status || 'Available'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Property</p>
                      <p className="font-semibold text-foreground mt-0.5">{selectedProp?.name ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Unit Number</p>
                      <p className="font-semibold text-foreground mt-0.5">{selectedUnit?.unit_number ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Unit Type</p>
                      <p className="font-semibold text-foreground mt-0.5">{selectedUnit?.type || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Rent</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {selectedUnit?.price ? `KES ${Number(selectedUnit.price).toLocaleString("en-KE")}` : "—"}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-4 bg-muted/30 p-2.5 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground font-medium">Current Occupant / Tenant</p>
                      {tenantName ? (
                        <div className="mt-1 flex items-center justify-between">
                          <p className="font-semibold text-rose-400">{tenantName}</p>
                          {activeTenantPhone && (
                            <p className="text-xs text-muted-foreground">{activeTenantPhone}</p>
                          )}
                        </div>
                      ) : (
                        <p className="font-semibold text-green-400 mt-1">Vacant / No Active Tenant</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Paid by */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Paid By <span className="text-destructive">*</span></label>
              <Select
                value={form.paid_by}
                onValueChange={(v: "tenant" | "landlord") => {
                  setField("paid_by", v);
                  if (v === "landlord") {
                    setField("tenant_id", "");
                  } else if (v === "tenant" && form.unit_id) {
                    const selectedUnit = units.find((u) => String(u.id) === form.unit_id);
                    const tenantId = selectedUnit?.active_lease?.tenant?.id;
                    if (tenantId) {
                      setField("tenant_id", String(tenantId));
                    } else {
                      const unitTenant = tenants.find((t) => String(t.unit_id) === form.unit_id || String(t.unit?.id) === form.unit_id);
                      if (unitTenant) setField("tenant_id", String(unitTenant.id));
                    }
                  }
                }}
              >
                <SelectTrigger id="form-paid-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landlord">Landlord (business expense)</SelectItem>
                  <SelectItem value="tenant">Tenant (will be charged)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tenant — only when paid_by=tenant */}
            {form.paid_by === "tenant" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Assign Tenant</label>
                <Select value={form.tenant_id} onValueChange={(v) => setField("tenant_id", v)}>
                  <SelectTrigger id="form-tenant">
                    <SelectValue placeholder="Select tenant…" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitTenants.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Cost */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cost (KES) <span className="text-destructive">*</span></label>
              <Input
                id="form-cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.cost}
                onChange={(e) => setField("cost", e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={(v: RepairForm["status"]) => setField("status", v)}>
                <SelectTrigger id="form-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vendor */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Vendor / Contractor</label>
              <Input
                id="form-vendor"
                placeholder="Who did the work?"
                value={form.vendor}
                onChange={(e) => setField("vendor", e.target.value)}
              />
            </div>

            {/* Reported date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reported Date</label>
              <Input
                id="form-reported-date"
                type="date"
                value={form.reported_date}
                onChange={(e) => setField("reported_date", e.target.value)}
              />
            </div>

            {/* Completed date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Completed Date</label>
              <Input
                id="form-completed-date"
                type="date"
                value={form.completed_date}
                onChange={(e) => setField("completed_date", e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                id="form-description"
                placeholder="Describe the repair work…"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                id="form-notes"
                placeholder="Any additional notes…"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>
          </div>

          {/* Info banner for tenant charges */}
          {form.paid_by === "tenant" && (
            <div className="flex gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-sm text-purple-300">
              <Receipt className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Tenant will be charged via invoice</p>
                <p className="text-xs opacity-80 mt-0.5">
                  Once you mark the repair as <strong>Completed</strong>, click <strong>"Charge"</strong> in the table to create a repair invoice for the tenant.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button id="btn-cancel-modal" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button id="btn-save-repair" onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editRepair ? "Save Changes" : "Log Repair"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Repair?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>"{deleteTarget?.title}"</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              id="btn-confirm-delete"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Charge Confirmation ──────────────────────────────────────────── */}
      <AlertDialog open={!!chargeTarget} onOpenChange={(open) => { if (!open) setChargeTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-400" />
              Charge Tenant?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will create a <strong>repair invoice</strong> of{" "}
                <strong>KES {Number(chargeTarget?.cost ?? 0).toLocaleString("en-KE")}</strong> for{" "}
                <strong>{chargeTarget?.tenant_name}</strong>.
              </span>
              <span className="block text-xs">
                • Any available credit balance will be auto-applied.<br />
                • The invoice will appear in the tenant's financial statement.<br />
                • The repair will be locked to prevent further edits.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              id="btn-confirm-charge"
              onClick={handleCharge}
              disabled={charging}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {charging ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Invoice &amp; Charge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
