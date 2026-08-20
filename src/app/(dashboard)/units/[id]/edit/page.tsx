"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { propertyAPI, unitAPI } from "@/data/apis";
import { toast } from "sonner";
import UnitForm from "@/components/forms/UnitForm";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditUnitPage() {
    const params = useParams();
    const router = useRouter();
    const [unit, setUnit] = useState<any>(null);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [unitData, propertiesData] = await Promise.all([
                    unitAPI.getById(params.id),
                    propertyAPI.getAll()
                ]);
                setUnit(unitData);
                setProperties(Array.isArray(propertiesData) ? propertiesData : (propertiesData?.data || []));
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast.error("Failed to load unit details");
                router.push("/units");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id, router]);

    const handleSubmit = async (payload: any) => {
        setSubmitting(true);
        try {
            await unitAPI.update(params.id, payload);
            toast.success("Unit updated successfully");
            router.push(`/units/${params.id}`);
            router.refresh();
        } catch (error: any) {
            console.error("Update failed:", error);
            toast.error(error.response?.data?.message || "Failed to update unit");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!unit) {
        return <div className="p-8 text-center text-slate-500">Unit not found.</div>;
    }

    return (
        <div className="min-h-screen bg-muted/40 p-6 transition-colors duration-300">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push(`/units/${params.id}`)}
                        className="bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#2A3242] text-slate-600 dark:text-[#CBD5E1]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F9FAFB] font-outfit">Edit Unit {unit.unit_number}</h1>
                        <p className="text-slate-500 dark:text-[#9CA3AF] font-medium">Update unit information and manage gallery images.</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-sm dark:shadow-[0_12px_28px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-[#2A3242] p-8 transition-all">
                    <UnitForm
                        initialData={unit}
                        onSubmit={handleSubmit}
                        isSubmitting={submitting}
                        properties={properties}
                    />
                </div>
            </div>
        </div>
    );
}
