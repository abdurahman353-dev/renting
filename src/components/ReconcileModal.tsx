'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check, ChevronsUpDown, User, Ticket, LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { tenantAPI, financeAPI } from '@/data/apis';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReconcileModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
    onSuccess?: () => void;
}

export default function ReconcileModal({
    isOpen,
    onClose,
    transaction,
    onSuccess,
}: ReconcileModalProps) {
    const [tenants, setTenants] = useState<any[]>([]);
    const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
    const [open, setOpen] = useState(false);
    const [loadingTenants, setLoadingTenants] = useState(false);
    const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTenants();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedTenant) {
            fetchPendingInvoices(selectedTenant.id);
        } else {
            setPendingInvoices([]);
            setSelectedInvoices([]);
        }
    }, [selectedTenant]);

    const fetchTenants = async () => {
        setLoadingTenants(true);
        try {
            const res = await tenantAPI.getAll();
            // Handle paginated response ({ data: [...] }) or plain array
            const data: any[] = Array.isArray(res) ? res : (res.data ?? []);
            setTenants(data);

            // Try to auto-match tenant by phone
            if (transaction?.phone_number) {
                const phone = String(transaction.phone_number).replace(/\D/g, '');
                const matched = data.find((t: any) => {
                    if (!t.phone) return false;
                    const tPhone = String(t.phone).replace(/\D/g, '');
                    return tPhone.endsWith(phone.substring(Math.max(0, phone.length - 9))) ||
                        phone.endsWith(tPhone.substring(Math.max(0, tPhone.length - 9)));
                });
                if (matched) {
                    setSelectedTenant(matched);
                }
            }
        } catch (error) {
            console.error('Failed to fetch tenants', error);
        } finally {
            setLoadingTenants(false);
        }
    };

    const fetchPendingInvoices = async (tenantId: number) => {
        try {
            const data = await financeAPI.getInvoices({ tenant_id: tenantId });
            // Handle Laravel paginated response if necessary
            const invoices = Array.isArray(data) ? data : (data.data || []);

            const pending = invoices.filter((inv: any) =>
                inv.status === 'PENDING' || inv.status === 'PARTIAL'
            );
            setPendingInvoices(pending);
        } catch (error) {
            console.error('Failed to fetch invoices', error);
        }
    };

    const handleReconcile = async () => {
        if (!selectedTenant) {
            toast.error('Please select a tenant');
            return;
        }

        setSubmitting(true);
        try {
            await financeAPI.reconcileTransaction({
                transaction_id: transaction.id,
                tenant_id: selectedTenant.id,
                invoice_ids: selectedInvoices,
            });

            toast.success('Transaction reconciled successfully');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('Reconciliation failed', error);
            const msg = error.response?.data?.message || 'Reconciliation failed';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleInvoiceSelection = (invoiceId: number) => {
        setSelectedInvoices(prev =>
            prev.includes(invoiceId)
                ? prev.filter(id => id !== invoiceId)
                : [...prev, invoiceId]
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
        }).format(amount);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manual Reconciliation</DialogTitle>
                    <DialogDescription>
                        Match M-Pesa transaction <code className="bg-slate-100 px-1 rounded">{transaction?.transaction_id}</code> of
                        <span className="font-bold text-slate-900 block mt-1">{formatCurrency(Number(transaction?.amount))}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Tenant</label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between"
                                >
                                    {selectedTenant ? selectedTenant.name : "Search tenant..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search tenant..." />
                                    <CommandEmpty>No tenant found.</CommandEmpty>
                                    <CommandGroup className="max-h-[300px] overflow-auto">
                                        {tenants.map((tenant) => (
                                            <CommandItem
                                                key={tenant.id}
                                                value={tenant.name}
                                                onSelect={() => {
                                                    setSelectedTenant(tenant);
                                                    setOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedTenant?.id === tenant.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span>{tenant.name}</span>
                                                    <span className="text-xs text-muted-foreground">{tenant.unit?.unit_number || 'No Unit'}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {selectedTenant && (
                        <div className="space-y-4">
                            <div className="text-sm font-medium border-t pt-4 flex justify-between">
                                <span>Pending Invoices (Optional)</span>
                                {selectedInvoices.length > 0 && (
                                    <Badge variant="secondary">{selectedInvoices.length} selected</Badge>
                                )}
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {pendingInvoices.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No pending invoices for this tenant.</p>
                                ) : (
                                    pendingInvoices.map((invoice) => {
                                        const invoiceBalance = Number(invoice.amount) - Number(invoice.paid_amount);
                                        return (
                                            <div
                                                key={invoice.id}
                                                className={cn(
                                                    "flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors",
                                                    selectedInvoices.includes(invoice.id) ? "bg-indigo-50 border-indigo-200" : "hover:bg-slate-50"
                                                )}
                                                onClick={() => toggleInvoiceSelection(invoice.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox checked={selectedInvoices.includes(invoice.id)} />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold">{invoice.invoice_number}</span>
                                                        <span className="text-xs text-muted-foreground">{invoice.description || `${invoice.month}/${invoice.year}`}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-bold text-indigo-600">{formatCurrency(invoiceBalance)}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 bg-slate-50 p-2 rounded">
                                <strong>Note:</strong> If no invoices are selected, the payment will be automatically allocated to the oldest pending invoices.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleReconcile}
                        disabled={!selectedTenant || submitting}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Reconciling...
                            </>
                        ) : (
                            <>
                                <LinkIcon className="mr-2 h-4 w-4" />
                                Reconcile
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
