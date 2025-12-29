"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    BedDouble,
    Bath,
    Maximize,
    Home,
    User,
    History,
    FileText,
    Wrench,
    DollarSign,
    Calendar,
    Edit,
    Loader2,
    Sparkles,
    TrendingUp,
    ArrowLeft,
    Phone,
    EyeIcon
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { publicAPI, unitAPI } from "@/data/apis";
import { toast } from "sonner";
import { ImageGalleryModal } from "@/components/ImageGalleryModal";

export default function UnitDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [unit, setUnit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [openEdit, setOpenEdit] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        unit_number: "",
        price: "",
        type: "",
        status: "",
        features: ""
    });

    useEffect(() => {
        fetchUnit();
    }, [params.id]);

    const fetchUnit = async () => {
        try {
            const data = await publicAPI.getUnit(params.id);
            setUnit(data);
            setEditForm({
                unit_number: data.unit_number || "",
                price: data.price || "",
                type: data.type || "",
                status: data.status || "Available",
                features: data.features || ""
            });
        } catch (error) {
            console.error("Failed to fetch unit:", error);
            toast.error("Failed to load unit details");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setSubmitting(true);
        try {
            await unitAPI.update(params.id, editForm);
            toast.success("Unit updated successfully");
            setOpenEdit(false);
            fetchUnit(); // Refresh data
        } catch (error) {
            console.error("Failed to update unit:", error);
            toast.error("Failed to update unit");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    if (!unit) return <div className="p-8">Unit not found</div>;

    const lease = unit.active_lease;
    const tenant = lease?.tenant;
    const isOccupied = unit.status?.toUpperCase() === 'OCCUPIED';
    const isAvailable = unit.status?.toUpperCase() === 'AVAILABLE';

    // Image Handling
    const images = unit.images && unit.images.length > 0
        ? unit.images.map((img: any) => img.url || img.image_path)
        : unit.image
            ? [unit.image]
            : ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop"];

    const statusColorClass = isAvailable
        ? "bg-green-100 text-green-700 hover:bg-green-200 border-0"
        : isOccupied
            ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-0"
            : "bg-slate-100 text-slate-700";

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                </div>
                {/* Hero Section with Images */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[550px]">
                        <div className="md:col-span-2 h-full relative group">
                            <img
                                src={images[0]}
                                alt={`Unit ${unit.unit_number}`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer"
                                onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                    <span className="text-yellow-400 font-semibold text-sm">Premium Listing</span>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="bg-white/90 backdrop-blur-sm hover:bg-white"
                                    onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
                                >
                                    View All {images.length} Photos
                                </Button>
                            </div>
                        </div>
                        {images.length > 1 && (
                            <>
                                <div className="hidden md:grid grid-rows-2 gap-3">
                                    <div className="relative group overflow-hidden rounded-xl cursor-pointer" onClick={() => { setGalleryIndex(1); setGalleryOpen(true); }}>
                                        <img src={images[1]} alt="View 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    </div>
                                    {images.length > 2 && (
                                        <div className="relative group overflow-hidden rounded-xl cursor-pointer" onClick={() => { setGalleryIndex(2); setGalleryOpen(true); }}>
                                            <img src={images[2]} alt="View 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        </div>
                                    )}
                                </div>
                                {images.length > 3 && (
                                    <div className="hidden md:grid grid-rows-2 gap-3">
                                        <div className="relative group overflow-hidden rounded-xl cursor-pointer" onClick={() => { setGalleryIndex(3); setGalleryOpen(true); }}>
                                            <img src={images[3]} alt="View 4" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        </div>
                                        {images.length > 4 && (
                                            <div
                                                className="relative bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all duration-300 rounded-xl group"
                                                onClick={() => { setGalleryIndex(4); setGalleryOpen(true); }}
                                            >
                                                <div className="text-center text-white">
                                                    <p className="text-4xl font-bold mb-2">+{images.length - 4}</p>
                                                    <p className="text-sm font-medium">More Photos</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-slate-900 mb-3">
                                Unit {unit.unit_number} - {unit.property?.name}
                            </h1>
                            <div className="flex items-center text-slate-600 gap-4">
                                <span className="flex items-center text-lg"><Home className="w-5 h-5 mr-2 text-slate-500" /> {unit.type}</span>
                                {unit.size && <span className="flex items-center text-lg"><Maximize className="w-5 h-5 mr-2 text-slate-500" /> {unit.size} sqft</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge className={`text-base px-6 py-2 font-semibold shadow-sm ${statusColorClass}`}>
                                {unit.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-white shadow-sm border border-slate-200">
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-xl font-bold text-slate-800">Unit Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 grid grid-cols-2 gap-6">
                                <div className="flex justify-between items-center py-4 px-4 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600 font-medium">Monthly Rent</span>
                                    <span className="font-bold text-slate-900 text-lg">{Number(unit.price).toLocaleString()} KES</span>
                                </div>
                                <div className="flex justify-between items-center py-4 px-4 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600 font-medium">Property</span>
                                    <span className="font-semibold text-slate-900">{unit.property?.name || "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center py-4 px-4 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600 font-medium">Deposit 1</span>
                                    <span className="font-bold text-slate-900 text-lg">{Number(unit.deposit_1 || 0).toLocaleString()} KES</span>
                                </div>
                                <div className="flex justify-between items-center py-4 px-4 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600 font-medium">Deposit 2</span>
                                    <span className="font-bold text-slate-900 text-lg">{Number(unit.deposit_2 || 0).toLocaleString()} KES</span>
                                </div>
                                {unit.features && (
                                    <div className="col-span-2 py-4 px-4 bg-slate-50 rounded-lg">
                                        <span className="block text-slate-600 font-medium mb-2">Features</span>
                                        <p className="text-slate-900 font-medium flex items-center"><Sparkles className="w-4 h-4 mr-2 text-yellow-500" /> {unit.features}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* History */}
                        {/* <Card className="bg-white shadow-sm border border-slate-200">
                            <CardHeader className="bg-slate-50 border-b border-slate-100">
                                <CardTitle className="text-xl font-bold text-slate-800">History & Activity</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {lease ? (
                                    <div className="flex gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                                        <div className="mt-1">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <History className="w-5 h-5 text-blue-600" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Active Lease</p>
                                            <p className="text-slate-600">
                                                Occupied by <span className="font-semibold text-blue-700">{tenant?.name}</span> since {new Date(lease.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">No recent activity found.</p>
                                )}
                            </CardContent>
                        </Card> */}
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card className="bg-white shadow-sm border border-slate-200">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                                <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                                    <TrendingUp className="w-5 h-5 text-slate-500" /> Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-6">
                                {/* <Button className="w-full justify-start text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm" variant="outline">
                                    <EyeIcon className="w-4 h-4 mr-2" /> Request Viewing
                                </Button> */}
                                {/* <Button className="w-full justify-start text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm" variant="outline">
                                    <Wrench className="w-4 h-4 mr-2" /> Schedule Maintenance
                                </Button> */}
                                <Button className="w-full justify-start text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm" variant="outline">
                                    <Phone className="w-4 h-4 mr-2" /> Contact Agent
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <ImageGalleryModal
                images={images}
                isOpen={galleryOpen}
                onClose={() => setGalleryOpen(false)}
                initialIndex={galleryIndex}
            />
        </div>
    );
}
