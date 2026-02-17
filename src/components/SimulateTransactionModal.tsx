'use client';

import { useState } from 'react';
import { Loader2, Smartphone, DollarSign, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { financeAPI } from '@/data/apis';
import { toast } from 'sonner';

interface SimulateTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function SimulateTransactionModal({
    isOpen,
    onClose,
    onSuccess,
}: SimulateTransactionModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: '100',
        phone_number: '254708374149',
        account_reference: 'INV-TEST-001',
        command_id: 'CustomerPayBillOnline'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (value: string) => {
        setFormData({ ...formData, command_id: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await financeAPI.triggerC2BSimulation({
                amount: Number(formData.amount),
                phone_number: formData.phone_number,
                account_reference: formData.account_reference,
                command_id: formData.command_id
            });

            toast.success('Simulation initiated successfully!');
            toast.info('Wait a few seconds for Safaricom to call back.');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('Simulation failed', error);
            const msg = error.response?.data?.message || 'Simulation failed';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Simulate C2B Transaction</DialogTitle>
                    <DialogDescription>
                        Trigger a fake payment from Safaricom Sandbox to test your validation and confirmation URLs.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="command_id">Transaction Type</Label>
                        <Select
                            value={formData.command_id}
                            onValueChange={handleSelectChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select transaction type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CustomerPayBillOnline">Pay Bill (CustomerPayBillOnline)</SelectItem>
                                <SelectItem value="CustomerBuyGoodsOnline">Buy Goods (CustomerBuyGoodsOnline)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (KES)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                required
                                value={formData.amount}
                                onChange={handleChange}
                                className="pl-9"
                                placeholder="100"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <div className="relative">
                            <Smartphone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="phone_number"
                                name="phone_number"
                                required
                                value={formData.phone_number}
                                onChange={handleChange}
                                className="pl-9"
                                placeholder="2547XXXXXXXX"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Use the test number 254708374149 for Sandbox.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account_reference">Account Reference / BillRefNumber</Label>
                        <div className="relative">
                            <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="account_reference"
                                name="account_reference"
                                required
                                value={formData.account_reference}
                                onChange={handleChange}
                                className="pl-9"
                                placeholder="e.g. INV-001 or Unit A1"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Simulating...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Simulate Payment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
