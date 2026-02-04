"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Upload,
    Trash2,
    Star,
    Loader2,
    X,
    Plus
} from "lucide-react";
import { mediaAPI } from "@/data/apis";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UnitFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    isSubmitting: boolean;
    properties: any[];
}

export default function UnitForm({ initialData, onSubmit, isSubmitting, properties }: UnitFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        unit_number: "",
        property_id: "",
        type: "",
        price: "",
        deposit_1: "",
        deposit_2: "",
        status: "Available",
        features: "",
        size: "",
        floor: "",
    });

    const [images, setImages] = useState<any[]>([]);
    const [localSubmitting, setLocalSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            // Normalize unit type
            let normalizedType = initialData.type || "";
            const t = normalizedType.toLowerCase();
            if (t.includes('one') || t === '1 bedroom') normalizedType = "1 Bedroom";
            else if (t.includes('two') || t === '2 bedroom') normalizedType = "2 Bedroom";
            else if (t.includes('three') || t === '3 bedroom') normalizedType = "3 Bedroom";
            else if (t.includes('shop')) normalizedType = "Shop";
            else if (t.includes('office')) normalizedType = "Office";
            else if (t === 'studio' || t === 'bedsitter') normalizedType = "1 Bedroom";
            else if (t === 'penthouse') normalizedType = "3 Bedroom";

            setFormData({
                unit_number: initialData.unit_number || "",
                property_id: initialData.property_id || "",
                type: normalizedType,
                price: initialData.price ?? "",
                deposit_1: initialData.deposit_1 ?? "",
                deposit_2: initialData.deposit_2 ?? "",
                status: initialData.status || "Available",
                features: initialData.features || "",
                size: initialData.size || "",
                floor: initialData.floor || "",
            });

            if (initialData.images) {
                setImages(initialData.images.map((img: any) => ({
                    id: img.id,
                    url: img.image_path,
                    isExisting: true,
                    isFeatured: !!img.is_featured
                })));
            } else if (initialData.image) {
                setImages([{
                    id: Date.now(),
                    url: initialData.image,
                    isExisting: true,
                    isFeatured: true
                }]);
            }
        }
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages = [...images];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            await new Promise((resolve) => {
                reader.onload = (re: any) => {
                    newImages.push({
                        id: `temp-${Date.now()}-${i}`,
                        url: re.target.result,
                        file: file,
                        isExisting: false,
                        isFeatured: newImages.length === 0
                    });
                    resolve(null);
                };
                reader.readAsDataURL(file);
            });
        }
        setImages(newImages);
    };

    const removeImage = (id: string | number) => {
        setImages(prev => {
            const newImages = prev.filter(img => img.id !== id);
            // If we removed the featured image, set the first one as featured
            if (prev.find(img => img.id === id)?.isFeatured && newImages.length > 0) {
                newImages[0].isFeatured = true;
            }
            return newImages;
        });
    };

    const setFeaturedImage = (id: string | number) => {
        setImages(prev => prev.map(img => ({
            ...img,
            isFeatured: img.id === id
        })));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalSubmitting(true);

        try {
            // 1. Upload new images
            const uploadPromises = images.map(async (img) => {
                if (img.isExisting) return img.url;
                const response = await mediaAPI.upload(img.file);
                return response.path;
            });

            const uploadedPaths = await Promise.all(uploadPromises);
            const featuredPath = uploadedPaths[images.findIndex(img => img.isFeatured)] || uploadedPaths[0];

            // 2. Prepare payload
            const payload = {
                ...formData,
                images: uploadedPaths,
                image: featuredPath // Compatibility with older schema
            };

            await onSubmit(payload);
        } catch (error) {
            console.error("Form submission error:", error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setLocalSubmitting(false);
        }
    };

    const storageBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') + '/storage/';

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="property_id" className="dark:text-[#CBD5E1]">Property</Label>
                        <select
                            name="property_id"
                            id="property_id"
                            className="flex h-10 w-full rounded-md border border-input dark:border-[#2A3242] bg-background dark:bg-[#1F2633] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#F9FAFB]"
                            value={formData.property_id}
                            onChange={handleInputChange}
                            disabled
                            required
                        >
                            <option value="">Select Property</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="unit_number" className="dark:text-[#CBD5E1]">Unit Number</Label>
                            <Input
                                id="unit_number"
                                name="unit_number"
                                value={formData.unit_number}
                                onChange={handleInputChange}
                                placeholder="e.g. A1, 102"
                                required
                                className="dark:bg-[#1F2633] dark:border-[#2A3242] dark:text-[#F9FAFB] dark:placeholder:text-[#9CA3AF]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type" className="dark:text-[#CBD5E1]">Unit Type</Label>
                            <select
                                id="type"
                                name="type"
                                className="flex h-10 w-full rounded-md border border-input dark:border-[#2A3242] bg-background dark:bg-[#1F2633] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:text-[#F9FAFB]"
                                value={formData.type}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Type</option>
                                <option value="1 Bedroom">1 Bedroom</option>
                                <option value="2 Bedroom">2 Bedroom</option>
                                <option value="3 Bedroom">3 Bedroom</option>
                                <option value="Shop">Shop</option>
                                <option value="Office">Office</option>
                                <option value="Shop & 1 Bedroom">Shop & 1 Bedroom</option>
                                <option value="Shop & Shop">Shop & Shop</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price" className="dark:text-[#CBD5E1]">Monthly Rent (KES)</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleInputChange}
                                placeholder="e.g. 25000"
                                required
                                className="dark:bg-[#1F2633] dark:border-[#2A3242] dark:text-[#F9FAFB] dark:placeholder:text-[#9CA3AF]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deposit_1" className="dark:text-[#CBD5E1]">Deposit 1 (KES)</Label>
                            <Input
                                id="deposit_1"
                                name="deposit_1"
                                type="number"
                                value={formData.deposit_1}
                                onChange={handleInputChange}
                                placeholder="e.g. 10000"
                                required
                                className="dark:bg-[#1F2633] dark:border-[#2A3242] dark:text-[#F9FAFB] dark:placeholder:text-[#9CA3AF]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deposit_2" className="dark:text-[#CBD5E1]">Deposit 2 (KES)</Label>
                            <Input
                                id="deposit_2"
                                name="deposit_2"
                                type="number"
                                value={formData.deposit_2}
                                onChange={handleInputChange}
                                placeholder="e.g. 25000"
                                className="dark:bg-[#1F2633] dark:border-[#2A3242] dark:text-[#F9FAFB] dark:placeholder:text-[#9CA3AF]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status" className="dark:text-[#CBD5E1]">Status</Label>
                            <select
                                id="status"
                                name="status"
                                className="flex h-10 w-full rounded-md border border-input dark:border-[#2A3242] bg-background dark:bg-[#1F2633] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted dark:disabled:bg-[#161B22]/50 dark:text-[#F9FAFB]"
                                value={formData.status}
                                onChange={handleInputChange}
                                disabled={initialData?.status === 'occupied' && (initialData?.active_lease || initialData?.activeLease)}
                                required
                            >
                                <option value="available">Vacant</option>
                                {formData.status === 'occupied' && <option value="occupied">Occupied</option>}
                                <option value="maintenance">Maintenance</option>
                            </select>
                            {initialData?.status === 'occupied' && (initialData?.active_lease || initialData?.activeLease) && (
                                <p className="text-[0.8rem] text-muted-foreground dark:text-[#9CA3AF]">
                                    Status is locked because the unit is currently occupied by a tenant.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="size" className="dark:text-[#CBD5E1]">Size (sqft)</Label>
                            <Input
                                id="size"
                                name="size"
                                value={formData.size}
                                onChange={handleInputChange}
                                placeholder="e.g. 600"
                                className="dark:bg-[#1F2633] dark:border-[#2A3242] dark:text-[#F9FAFB] dark:placeholder:text-[#9CA3AF]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="floor" className="dark:text-[#CBD5E1]">Floor Number</Label>
                            <Input
                                id="floor"
                                name="floor"
                                value={formData.floor}
                                onChange={handleInputChange}
                                placeholder="e.g. 2nd"
                                className="dark:bg-[#1F2633] dark:border-[#2A3242] dark:text-[#F9FAFB] dark:placeholder:text-[#9CA3AF]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="features" className="dark:text-[#CBD5E1]">Features/Amenities</Label>
                        <Textarea
                            id="features"
                            name="features"
                            className="min-h-[100px] dark:bg-[#1F2633] dark:border-[#2A3242] dark:text-[#F9FAFB] dark:placeholder:text-[#9CA3AF]"
                            value={formData.features}
                            onChange={handleInputChange}
                            placeholder="e.g. Balcony, High Ceiling, Built-in wardrobes..."
                        />
                    </div>
                </div>
            </div>

            {/* Image Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-bold dark:text-[#F9FAFB]">Unit Photographs</Label>
                    <Label
                        htmlFor="image-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-[#2563EB] rounded-lg cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors text-sm font-semibold border border-transparent dark:border-[#2563EB]/30"
                    >
                        <Plus className="w-4 h-4" /> Add Photos
                        <input
                            id="image-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </Label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((img) => (
                        <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted">
                            <img
                                src={img.isExisting && !img.url.startsWith('http') ? storageBaseUrl + img.url : img.url}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        className="h-8 w-8 rounded-full shadow-lg"
                                        onClick={() => removeImage(img.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex justify-center mb-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={img.isFeatured ? "default" : "secondary"}
                                        className={`gap-1 h-8 px-3 rounded-full shadow-lg ${img.isFeatured ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-background/90 hover:bg-background text-foreground'}`}
                                        onClick={() => setFeaturedImage(img.id)}
                                    >
                                        <Star className={`w-3.5 h-3.5 ${img.isFeatured ? 'fill-current' : ''}`} />
                                        {img.isFeatured ? "Featured" : "Set Main"}
                                    </Button>
                                </div>
                            </div>

                            {img.isFeatured && (
                                <div className="absolute top-2 left-2 bg-yellow-500 text-white p-1 rounded-full shadow-md">
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                </div>
                            )}
                        </div>
                    ))}

                    {images.length === 0 && (
                        <label
                            htmlFor="image-upload-empty"
                            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                        >
                            <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary mb-2" />
                            <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary">Upload Photos</span>
                            <input
                                id="image-upload-empty"
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </label>
                    )}
                </div>
                <p className="text-xs text-slate-500">
                    The first image or the one marked as "Featured" will be used as the primary display photo for the unit.
                </p>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border dark:border-[#2A3242]">
                <Button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="min-w-[150px] bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all active:scale-95"
                    disabled={isSubmitting || localSubmitting}
                >
                    {(isSubmitting || localSubmitting) ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        initialData ? "Update Unit" : "Create Unit"
                    )}
                </Button>
            </div>
        </form>
    );
}
