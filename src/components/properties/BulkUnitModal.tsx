"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/data/apis";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface BulkUnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: number;
    onSuccess: () => void;
    existingUnits?: string[];
}

interface GeneratedUnit {
    unit_number: string;
    price: number | string;
    deposit_1: number | string;
    deposit_2: number | string;
    status: string;
    type: string;
}

export function BulkUnitModal({ isOpen, onClose, propertyId, onSuccess, existingUnits = [] }: BulkUnitModalProps) {
    const [prefix, setPrefix] = useState("A");
    const [startNumber, setStartNumber] = useState(101);
    const [count, setCount] = useState(10);
    const [defaultPrice, setDefaultPrice] = useState<number | string>("");
    const [defaultDeposit1, setDefaultDeposit1] = useState<number | string>("");
    const [defaultDeposit2, setDefaultDeposit2] = useState<number | string>("");
    const [defaultType, setDefaultType] = useState("");

    const [generatedUnits, setGeneratedUnits] = useState<GeneratedUnit[]>([]);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePreview = () => {
        const units: GeneratedUnit[] = [];
        for (let i = 0; i < count; i++) {
            units.push({
                unit_number: `${prefix}${startNumber + i}`,
                price: defaultPrice,
                deposit_1: defaultDeposit1,
                deposit_2: defaultDeposit2,
                status: "vacant",
                type: defaultType,
            });
        }
        setGeneratedUnits(units);
        setIsPreviewing(true);
    };

    const handleRemoveUnit = (index: number) => {
        setGeneratedUnits(units => units.filter((_, i) => i !== index));
    };

    const handleUnitChange = (index: number, field: keyof GeneratedUnit, value: any) => {
        setGeneratedUnits(units => units.map((u, i) => i === index ? { ...u, [field]: value } : u));
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            await api.post(`/properties/${propertyId}/units/bulk`, { units: generatedUnits });
            toast.success(`Successfully added ${generatedUnits.length} units`);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Failed to add bulk units:", error);
            const errorMessage = error.response?.data?.message || "Failed to add bulk units. Please check for duplicate unit numbers.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setIsPreviewing(false);
        setGeneratedUnits([]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Bulk Add Units</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {!isPreviewing ? (
                        <div className="grid grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-muted/40">
                            <div className="space-y-2">
                                <Label>Unit Prefix</Label>
                                <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="e.g. A, Block B-" />
                            </div>
                            <div className="space-y-2">
                                <Label>Start Number</Label>
                                <Input type="number" value={startNumber} onChange={(e) => setStartNumber(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Number of Units</Label>
                                <Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} max={100} />
                            </div>
                            <div className="space-y-2">
                                <Label>Default Type</Label>
                                <Select value={defaultType} onValueChange={setDefaultType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1 Bedroom">1 Bedroom</SelectItem>
                                        <SelectItem value="2 Bedroom">2 Bedroom</SelectItem>
                                        <SelectItem value="3 Bedroom">3 Bedroom</SelectItem>
                                        <SelectItem value="Shop">Shop</SelectItem>
                                        <SelectItem value="Office">Office</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Default Monthly Rent (KES)</Label>
                                <Input type="number" value={defaultPrice} onChange={(e) => setDefaultPrice(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Default Deposit 1 (KES)</Label>
                                <Input type="number" value={defaultDeposit1} onChange={(e) => setDefaultDeposit1(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Default Deposit 2 (KES)</Label>
                                <Input type="number" value={defaultDeposit2} onChange={(e) => setDefaultDeposit2(Number(e.target.value))} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 border border-border rounded-md overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Unit Number</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Price (KES)</TableHead>
                                        <TableHead>Deposit 1</TableHead>
                                        <TableHead>Deposit 2</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {generatedUnits.map((unit, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Input
                                                        value={unit.unit_number}
                                                        onChange={(e) => handleUnitChange(index, 'unit_number', e.target.value)}
                                                        className={`h-8 ${existingUnits.includes(unit.unit_number) ? "border-destructive focus-visible:ring-destructive bg-destructive/10" : ""}`}
                                                    />
                                                    {existingUnits.includes(unit.unit_number) && (
                                                        <p className="text-[10px] font-medium text-destructive">Already exists</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select value={unit.type} onValueChange={(val) => handleUnitChange(index, 'type', val)}>
                                                    <SelectTrigger className="h-8 w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1 Bedroom">1 Bedroom</SelectItem>
                                                        <SelectItem value="2 Bedroom">2 Bedroom</SelectItem>
                                                        <SelectItem value="3 Bedroom">3 Bedroom</SelectItem>
                                                        <SelectItem value="Shop">Shop</SelectItem>
                                                        <SelectItem value="Office">Office</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={unit.price}
                                                    onChange={(e) => handleUnitChange(index, 'price', Number(e.target.value))}
                                                    className="h-8 w-[100px]"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={unit.deposit_1}
                                                    onChange={(e) => handleUnitChange(index, 'deposit_1', Number(e.target.value))}
                                                    className="h-8 w-[100px]"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={unit.deposit_2}
                                                    onChange={(e) => handleUnitChange(index, 'deposit_2', Number(e.target.value))}
                                                    className="h-8 w-[100px]"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveUnit(index)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {!isPreviewing ? (
                        <Button onClick={handlePreview} className="w-full sm:w-auto">
                            Generate Preview
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>
                                Back to Settings
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || generatedUnits.length === 0 || generatedUnits.some(u => existingUnits.includes(u.unit_number) || !u.type || u.price === "" || u.status === "")}
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save {generatedUnits.length} Units
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
