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
            setFormData({
                unit_number: initialData.unit_number || "",
                property_id: initialData.property_id || "",
                type: initialData.type || "",
                price: initialData.price || "",
                deposit_1: initialData.deposit_1 || "",
                deposit_2: initialData.deposit_2 || "",
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
                        <Label htmlFor="property_id">Property</Label>
                        <select
                            name="property_id"
                            id="property_id"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                            <Label htmlFor="unit_number">Unit Number</Label>
                            <Input
                                id="unit_number"
                                name="unit_number"
                                value={formData.unit_number}
                                onChange={handleInputChange}
                                placeholder="e.g. A1, 102"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Unit Type</Label>
                            <select
                                id="type"
                                name="type"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.type}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Type</option>
                                <option value="Bedsitter">Bedsitter</option>
                                <option value="Studio">Studio</option>
                                <option value="1 Bedroom">1 Bedroom</option>
                                <option value="2 Bedroom">2 Bedroom</option>
                                <option value="3 Bedroom">3 Bedroom</option>
                                <option value="4 Bedroom">4 Bedroom</option>
                                <option value="Penthouse">Penthouse</option>
                                <option value="Shop">Shop</option>
                                <option value="Office">Office</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Monthly Rent (KES)</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleInputChange}
                                placeholder="e.g. 25000"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deposit_1">Deposit 1</Label>
                            <Input
                                id="deposit_1"
                                name="deposit_1"
                                type="number"
                                value={formData.deposit_1}
                                onChange={handleInputChange}
                                placeholder="e.g. 10000"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deposit_2">Deposit 2</Label>
                            <Input
                                id="deposit_2"
                                name="deposit_2"
                                type="number"
                                value={formData.deposit_2}
                                onChange={handleInputChange}
                                placeholder="e.g. 25000"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                name="status"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.status}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="Available">Vacant</option>
                                {/* <option value="Reserved">Reserved</option> */}
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="size">Size (sqft)</Label>
                            <Input
                                id="size"
                                name="size"
                                value={formData.size}
                                onChange={handleInputChange}
                                placeholder="e.g. 600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="floor">Floor Number</Label>
                            <Input
                                id="floor"
                                name="floor"
                                value={formData.floor}
                                onChange={handleInputChange}
                                placeholder="e.g. 2nd"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="features">Features/Amenities</Label>
                        <Textarea
                            id="features"
                            name="features"
                            className="min-h-[100px]"
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
                    <Label className="text-base font-bold">Unit Photographs</Label>
                    <Label
                        htmlFor="image-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors text-sm font-semibold"
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
                        <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
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
                                        className={`gap-1 h-8 px-3 rounded-full shadow-lg ${img.isFeatured ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-white/90 hover:bg-white text-slate-700'}`}
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
                            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                        >
                            <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 mb-2" />
                            <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-500">Upload Photos</span>
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

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 min-w-[150px]"
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
