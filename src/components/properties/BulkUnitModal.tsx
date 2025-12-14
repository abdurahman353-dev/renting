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

interface BulkUnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: number;
    onSuccess: () => void;
}

interface GeneratedUnit {
    unit_number: string;
    price: number;
    status: string;
    type: string;
}

export function BulkUnitModal({ isOpen, onClose, propertyId, onSuccess }: BulkUnitModalProps) {
    const [prefix, setPrefix] = useState("A");
    const [startNumber, setStartNumber] = useState(101);
    const [count, setCount] = useState(10);
    const [defaultPrice, setDefaultPrice] = useState(15000);
    const [defaultType, setDefaultType] = useState("One Bedroom");

    const [generatedUnits, setGeneratedUnits] = useState<GeneratedUnit[]>([]);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePreview = () => {
        const units: GeneratedUnit[] = [];
        for (let i = 0; i < count; i++) {
            units.push({
                unit_number: `${prefix}${startNumber + i}`,
                price: defaultPrice,
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
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to add bulk units:", error);
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
                        <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-slate-50">
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
                                        <SelectItem value="Studio">Studio</SelectItem>
                                        <SelectItem value="One Bedroom">One Bedroom</SelectItem>
                                        <SelectItem value="Two Bedroom">Two Bedroom</SelectItem>
                                        <SelectItem value="Three Bedroom">Three Bedroom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Default Monthly Rent (KES)</Label>
                                <Input type="number" value={defaultPrice} onChange={(e) => setDefaultPrice(Number(e.target.value))} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 border rounded-md overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Unit Number</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Price (KES)</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {generatedUnits.map((unit, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Input
                                                    value={unit.unit_number}
                                                    onChange={(e) => handleUnitChange(index, 'unit_number', e.target.value)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select value={unit.type} onValueChange={(val) => handleUnitChange(index, 'type', val)}>
                                                    <SelectTrigger className="h-8 w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Studio">Studio</SelectItem>
                                                        <SelectItem value="One Bedroom">1 Bed</SelectItem>
                                                        <SelectItem value="Two Bedroom">2 Bed</SelectItem>
                                                        <SelectItem value="Three Bedroom">3 Bed</SelectItem>
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
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveUnit(index)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
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
                            <Button onClick={handleSubmit} disabled={isSubmitting || generatedUnits.length === 0} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
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
