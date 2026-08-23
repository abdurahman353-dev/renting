"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Star, Check, ArrowLeft, Loader2 } from "lucide-react";
import { mediaAPI, propertyAPI } from "@/data/apis";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this, otherwise standard textarea
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MOMBASA_LOCATIONS } from "@/data/mombasaLocations";

interface ImageItem {
    id: string; // Unique ID for key
    file?: File; // Only for new uploads
    url: string; // Preview URL or Remote URL
    isFeatured: boolean;
    isExisting: boolean; // Track if it's from DB
}

// Fast client-side image compression (< 50ms) to make uploads finish in 1-2 seconds
async function compressImageFile(file: File, maxWidth = 1600, quality = 0.82): Promise<File> {
    if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.size < 200 * 1024) {
        return file;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob || blob.size >= file.size) {
                            resolve(file);
                        } else {
                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}

interface PropertyFormProps {
    initialData?: any;
    isEditMode?: boolean;
}

const AMENITIES_LIST = [
    "High-Speed WiFi", "Covered Parking", "Fitness Center", "Modern Kitchen",
    "Spacious Layouts", "Pet Friendly", "Rooftop Pool", "24/7 Concierge Service",
    "Security", "Generator/Backup Power", "Elevator", "Laundry Facilities",
    "Air Conditioning", "Balcony/Terrace", "Garden/Green Space"
];

const PROPERTY_TYPES = ["Apartment Building", "Condominium", "Townhouse Complex", "Villa/House", "Commercial"];
const PET_POLICIES = ["Pet Friendly", "No Pets", "Cats Only", "Dogs Only", "With Restrictions"];
const PAYMENT_FREQUENCIES = ["Monthly", "Quarterly", "Annually"];

export default function PropertyForm({ initialData, isEditMode = false }: PropertyFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<ImageItem[]>([]);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Form State
    const [formData, setFormData] = useState({
        name: "", location: "", full_address: "", city: "",
        state: "Mombasa", postal_code: "", property_type: "", year_built: "",
        floors: "", parking_spaces: "", pet_policy: "",
        description: "", property_manager: "", status: "active",
        min_lease_period: "", payment_frequency_options: [] as string[],
        utilities_included: [] as string[], furnishing_options: "",
        owner_name: "", owner_contact: "", owner_email: "", owner_id: "",
        notes: "", amenities: [] as string[], custom_amenity: ""
    });

    // Location State
    const [selectedSubcounty, setSelectedSubcounty] = useState("");
    const [selectedWard, setSelectedWard] = useState("");
    const [selectedSubward, setSelectedSubward] = useState("");

    // Load Initial Data
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                location: initialData.location || "",
                full_address: initialData.full_address || "",
                city: initialData.city || "",
                state: initialData.state || "",
                postal_code: initialData.postal_code || "",
                property_type: initialData.property_type || "",
                year_built: initialData.year_built?.toString() || "",
                floors: initialData.floors?.toString() || "",
                parking_spaces: initialData.parking_spaces?.toString() || "",
                pet_policy: initialData.pet_policy || "",
                description: initialData.description || "",
                property_manager: initialData.property_manager || "",
                status: initialData.status || "active",
                min_lease_period: initialData.min_lease_period || "",
                payment_frequency_options: initialData.payment_frequency_options || [],
                utilities_included: initialData.utilities_included || [],
                furnishing_options: initialData.furnishing_options || "",
                owner_name: initialData.owner_name || "",
                owner_contact: initialData.owner_contact || "",
                owner_email: initialData.owner_email || "",
                owner_id: initialData.owner_id || "",
                notes: initialData.notes || "",
                amenities: initialData.amenities ? initialData.amenities.map((a: any) => a.amenity_name || a.name || a.amenities).filter(Boolean) : [],
                custom_amenity: ""
            });

            // Handle existing images
            const rawImages = initialData.property_images || initialData.propertyImages || initialData.images || initialData.image_urls || [];
            let processedImages: ImageItem[] = [];

            if (Array.isArray(rawImages) && rawImages.length > 0) {
                processedImages = rawImages.map((img: any, i: number) => {
                    const imgUrl = typeof img === 'string' ? img : (img.image_path || img.url || '');
                    const isFeat = typeof img === 'object' ? !!img.is_featured : (initialData.featured_image === imgUrl || i === 0);
                    return {
                        id: `existing-${typeof img === 'object' && img.id ? img.id : i}`,
                        url: imgUrl,
                        isFeatured: isFeat,
                        isExisting: true
                    };
                }).filter(img => Boolean(img.url));
            } else if (initialData.featured_image || initialData.featured_image_url) {
                const feat = initialData.featured_image_url || initialData.featured_image;
                processedImages = [{
                    id: 'existing-featured',
                    url: feat,
                    isFeatured: true,
                    isExisting: true
                }];
            }
            setImages(processedImages);

            // Restore location dropdowns from saved location string e.g. "Tudor, Mvita, Kisauni"
            if (initialData.location) {
                const parts = initialData.location.split(',').map((s: string) => s.trim());
                if (parts.length === 3) {
                    setSelectedSubcounty(parts[2]);
                    setSelectedWard(parts[1]);
                    setSelectedSubward(parts[0]);
                } else if (parts.length === 2) {
                    setSelectedSubcounty(parts[1]);
                    setSelectedWard(parts[0]);
                } else if (parts.length === 1) {
                    setSelectedSubcounty(parts[0]);
                }
            }
        }
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear inline error as user types
        if (formErrors[name]) setFormErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }

    const handleLocationChange = (type: 'subcounty' | 'ward' | 'subward', value: string) => {
        // Clear location error whenever user interacts with location selects
        setFormErrors(prev => { const n = { ...prev }; delete n['location']; return n; });

        if (type === 'subcounty') {
            setSelectedSubcounty(value);
            setSelectedWard("");
            setSelectedSubward("");
            // Set a base location immediately so even Sub-County alone satisfies the required field
            setFormData(prev => ({ ...prev, city: value, state: "Mombasa", location: value }));
        } else if (type === 'ward') {
            setSelectedWard(value);
            setSelectedSubward("");
            // More specific: Ward, Sub-County
            setFormData(prev => ({ ...prev, location: `${value}, ${selectedSubcounty}` }));
        } else if (type === 'subward') {
            setSelectedSubward(value);
            // Most specific: Sub-Ward, Ward, Sub-County
            setFormData(prev => ({ ...prev, location: `${value}, ${selectedWard}, ${selectedSubcounty}` }));
        }
    };

    const handleCheckboxChange = (name: string, value: string) => {
        setFormData(prev => {
            const currentValues = prev[name as keyof typeof prev] as string[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [name]: newValues };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Instant visual preview
        const newImages = files.map(file => ({
            id: `new-${Date.now()}-${Math.random()}`,
            file,
            url: URL.createObjectURL(file),
            isFeatured: images.length === 0,
            isExisting: false
        }));
        setImages(prev => [...prev, ...newImages]);

        // Compress files in background right away
        const compressedResults = await Promise.all(
            newImages.map(async (item) => {
                if (!item.file) return item;
                const compressed = await compressImageFile(item.file);
                return { ...item, file: compressed };
            })
        );

        setImages(prev => prev.map(img => {
            const matched = compressedResults.find(c => c.id === img.id);
            return matched ? matched : img;
        }));
    };

    const removeImage = (id: string) => {
        setImages(prev => {
            const target = prev.find(img => img.id === id);
            const newImages = prev.filter(img => img.id !== id);
            if (target?.isFeatured && newImages.length > 0) {
                newImages[0].isFeatured = true;
            }
            return newImages;
        });
    };

    const setFeaturedImage = (id: string) => {
        setImages(prev => prev.map(img => ({ ...img, isFeatured: img.id === id })));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // --- Client-side validation ---
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = "Property name is required.";
        if (!formData.location.trim()) errors.location = "Please select a Sub-County, Ward, or Sub-Ward to set the location.";
        if (!formData.property_type.trim()) errors.property_type = "Property type is required.";
        if (!formData.status.trim()) errors.status = "Status is required.";

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            // Scroll to first error field
            const firstErrorKey = Object.keys(errors)[0];
            const el = document.querySelector(`[name="${firstErrorKey}"], [data-field="${firstErrorKey}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            toast.error("Please fix the highlighted fields before submitting.");
            return;
        }

        setFormErrors({});
        setLoading(true);

        try {
            // 1. Upload compressed files in parallel (takes ~1-2 seconds)
            const uploadPromises = images.map(async (img) => {
                if (img.isExisting && img.url) {
                    return img.url;
                }
                if (!img.file) return null;
                const fileToUpload = await compressImageFile(img.file);
                const response = await mediaAPI.upload(fileToUpload);
                return response.url || response.path;
            });

            const uploadedPaths = (await Promise.all(uploadPromises)).filter(Boolean) as string[];
            const featuredIndex = images.findIndex(img => img.isFeatured);
            const featuredPath = uploadedPaths[featuredIndex >= 0 ? featuredIndex : 0] || (uploadedPaths[0] ?? "");

            // 2. Prepare Payload — exclude UI-only fields
            const { custom_amenity, ...restFormData } = formData;
            const payload = {
                ...restFormData,
                year_built: formData.year_built ? parseInt(formData.year_built) : null,
                floors: formData.floors ? parseInt(formData.floors) : null,
                parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
                images: uploadedPaths,
                featured_image_url: featuredPath,
                featured_image_index: featuredIndex >= 0 ? featuredIndex : 0
            };

            // 3. API Call
            if (isEditMode && initialData?.id) {
                await propertyAPI.update(initialData.id, payload);
                toast.success("Property updated successfully");
            } else {
                await propertyAPI.create(payload);
                toast.success("Property created successfully");
            }

            router.push('/properties');

        } catch (error: any) {
            console.error("Submission failed:", error);
            const errData = error.response?.data;

            // ── Plan limit hit ─────────────────────────────────────────────────
            if (errData?.error_code === 'PROPERTY_LIMIT_EXCEEDED') {
                toast.error(
                    `🔒 ${errData.message || `Property limit reached (${errData.current_count}/${errData.limit}). Upgrade your plan to add more properties.`}`,
                    { duration: 6000 }
                );
            // ── Laravel field-level 422 validation errors ──────────────────────
            } else if (error.response?.status === 422 && errData?.errors) {
                const backendErrors: Record<string, string> = {};
                Object.entries(errData.errors).forEach(([field, msgs]: [string, any]) => {
                    backendErrors[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
                });
                setFormErrors(backendErrors);
                const firstField = Object.keys(backendErrors)[0];
                const el = document.querySelector(`[name="${firstField}"], [data-field="${firstField}"]`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                toast.error("Validation failed. Please check the highlighted fields.");
            } else {
                toast.error(errData?.message || "Failed to save property. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-transparent text-black transition-none hover:bg-transparent hover:text-black hover:opacity-100 focus:outline-none focus:ring-0 cursor-pointer dark:border-slate-600 dark:text-white dark:hover:bg-transparent dark:hover:text-white"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
                        {isEditMode ? `Edit ${initialData?.name || 'Property'}` : "Add New Property"}
                    </h1>
                    <p className="text-base text-black font-medium dark:text-white">
                        {isEditMode ? "Update property details and images." : "Fill in the details to create a new property."}
                    </p>
                </div>
            </div>

            {/* Basic Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <Label>Property Name *</Label>
                        <Input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g. Sunset Apartments"
                            className={formErrors.name ? "border-red-500 focus-visible:ring-red-400" : ""}
                        />
                        {formErrors.name && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <span>⚠</span> {formErrors.name}
                            </p>
                        )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <Label>Property Description</Label>
                        <Textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Describe the property..."
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Address */}
            <Card>
                <CardHeader>
                    <CardTitle>Address Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="space-y-2">
                            <Label>Sub-County *</Label>
                            <Select value={selectedSubcounty} onValueChange={(val) => handleLocationChange('subcounty', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Sub-County" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MOMBASA_LOCATIONS.map(sc => (
                                        <SelectItem key={sc.name} value={sc.name}>{sc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Ward *</Label>
                            <Select
                                key={`ward-${selectedSubcounty}`}
                                value={selectedWard}
                                onValueChange={(val) => handleLocationChange('ward', val)}
                                disabled={!selectedSubcounty}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Ward" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MOMBASA_LOCATIONS.find(sc => sc.name === selectedSubcounty)?.wards.map(w => (
                                        <SelectItem key={w.name} value={w.name}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Sub-Ward (Location) *</Label>
                            <Select
                                key={`subward-${selectedSubcounty}-${selectedWard}`}
                                value={selectedSubward}
                                onValueChange={(val) => handleLocationChange('subward', val)}
                                disabled={!selectedWard}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Sub-Ward" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MOMBASA_LOCATIONS.find(sc => sc.name === selectedSubcounty)?.wards.find(w => w.name === selectedWard)?.subLocations.map(sw => (
                                        <SelectItem key={sw.name} value={sw.name}>{sw.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {formErrors.location && (
                        <p data-field="location" className="md:col-span-2 text-xs text-red-500 mt-1 flex items-center gap-1">
                            <span>⚠</span> {formErrors.location}
                        </p>
                    )}
                    {/* <div className="md:col-span-2 space-y-2">
                        <Label>Full Address</Label>
                        <Input name="full_address" value={formData.full_address} onChange={handleInputChange} />
                    </div> */}
                    {/* <div className="space-y-2">
                        <Label>City</Label>
                        <Input name="city" value={formData.city} onChange={handleInputChange} />
                    </div> */}
                    {/* <div className="space-y-2">
                        <Label>State/County</Label>
                        <Input name="state" value={formData.state} onChange={handleInputChange} />
                    </div> */}
                    <div className="space-y-2">
                        <Label>Postal Code</Label>
                        <Input name="postal_code" value={formData.postal_code} onChange={handleInputChange} />
                    </div>
                </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2" data-field="property_type">
                        <Label>Property Type *</Label>
                        <Select name="property_type" value={formData.property_type} onValueChange={(val) => handleSelectChange("property_type", val)}>
                            <SelectTrigger className={formErrors.property_type ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {PROPERTY_TYPES.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formErrors.property_type && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <span>⚠</span> {formErrors.property_type}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Year Built</Label>
                        <Input type="number" name="year_built" value={formData.year_built} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Floors</Label>
                        <Input type="number" name="floors" value={formData.floors} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Parking Spaces</Label>
                        <Input type="number" name="parking_spaces" value={formData.parking_spaces} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Pet Policy</Label>
                        <Select name="pet_policy" value={formData.pet_policy} onValueChange={(val) => handleSelectChange("pet_policy", val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Policy" />
                            </SelectTrigger>
                            <SelectContent>
                                {PET_POLICIES.map(policy => (
                                    <SelectItem key={policy} value={policy}>{policy}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Images */}
            <Card>
                <CardHeader>
                    <CardTitle>Property Images</CardTitle>
                    <CardDescription>Upload photos of the property. The first image or the starred one will be featured.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors bg-slate-50 cursor-pointer relative">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                            <Upload className="h-8 w-8 text-slate-400" />
                            <p className="font-medium text-slate-600">Click to upload images</p>
                            <p className="text-sm text-slate-400">JPG, PNG, WEBP up to 5MB</p>
                        </div>
                    </div>

                    {/* Image List */}
                    {images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {images.map((img, index) => (
                                <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                    <img src={img.url} alt="Property" className="w-full h-full object-cover" />

                                    {/* Actions Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant={img.isFeatured ? "default" : "secondary"}
                                            className={img.isFeatured ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                                            onClick={() => setFeaturedImage(img.id)}
                                            title="Set as featured"
                                        >
                                            <Star className={`h-4 w-4 ${img.isFeatured ? 'fill-white' : ''}`} />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="destructive"
                                            onClick={() => removeImage(img.id)}
                                            title="Remove image"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Featured Badge */}
                                    {img.isFeatured && (
                                        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
                                            Featured
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Description & Amenities */}
            <Card>
                <CardHeader>
                    <CardTitle>Amenities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Label>Amenities</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {AMENITIES_LIST.map(amenity => (
                                <div key={amenity} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={`amenity-${amenity}`}
                                        checked={formData.amenities.includes(amenity)}
                                        onChange={() => handleCheckboxChange('amenities', amenity)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor={`amenity-${amenity}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                        {amenity}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 items-center max-w-sm mt-2">
                            <Input
                                name="custom_amenity"
                                value={formData.custom_amenity}
                                onChange={handleInputChange}
                                placeholder="Add custom amenity..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (formData.custom_amenity.trim()) {
                                            setFormData(prev => ({
                                                ...prev,
                                                amenities: [...prev.amenities, prev.custom_amenity.trim()],
                                                custom_amenity: ""
                                            }));
                                        }
                                    }
                                }}
                            />
                            <Button type="button" size="sm" onClick={() => {
                                if (formData.custom_amenity.trim()) {
                                    setFormData(prev => ({
                                        ...prev,
                                        amenities: [...prev.amenities, prev.custom_amenity.trim()],
                                        custom_amenity: ""
                                    }));
                                }
                            }}>Add</Button>
                        </div>

                        {/* Selected Amenities Tags */}
                        {formData.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                                {formData.amenities.map((amenity, index) => (
                                    <div key={`${amenity}-${index}`} className="flex items-center gap-1 bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-medium">
                                        <span>{amenity}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    amenities: prev.amenities.filter((_, i) => i !== index)
                                                }));
                                            }}
                                            className="hover:text-destructive transition-colors ml-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>


            {/* Management & Owner */}
            <Card>
                <CardHeader>
                    <CardTitle>Management & Owner</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Property Manager</Label>
                        <Input name="property_manager" value={formData.property_manager} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select name="status" value={formData.status} onValueChange={(val) => handleSelectChange("status", val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Owner Name</Label>
                        <Input name="owner_name" value={formData.owner_name} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Owner Contact</Label>
                        <Input name="owner_contact" value={formData.owner_contact} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Owner Email</Label>
                        <Input name="owner_email" value={formData.owner_email} onChange={handleInputChange} />
                    </div>
                </CardContent>
            </Card>

            {/* Footer Actions */}
            <div className="flex justify-end gap-4">
                <Button type="button" onClick={() => router.back()} className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm">Cancel</Button>
                <Button type="submit" disabled={loading} className="min-w-[120px] bg-green-600 hover:bg-green-700 text-white" variant="default">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditMode ? "Update Property" : "Create Property"}
                </Button>
            </div>
        </form >
    );
}
