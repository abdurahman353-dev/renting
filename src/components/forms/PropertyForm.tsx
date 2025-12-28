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

interface ImageItem {
    id: string; // Unique ID for key
    file?: File; // Only for new uploads
    url: string; // Preview URL or Remote URL
    isFeatured: boolean;
    isExisting: boolean; // Track if it's from DB
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

    // Form State
    const [formData, setFormData] = useState({
        name: "", location: "", full_address: "", city: "",
        state: "", postal_code: "", property_type: "", year_built: "",
        floors: "", parking_spaces: "", pet_policy: "",
        description: "", property_manager: "", status: "active",
        min_lease_period: "", payment_frequency_options: [] as string[],
        utilities_included: [] as string[], furnishing_options: "",
        owner_name: "", owner_contact: "", owner_email: "", owner_id: "",
        notes: "", amenities: [] as string[], custom_amenity: ""
    });

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
            if (initialData.images && Array.isArray(initialData.images)) {
                const formattedImages = initialData.images.map((imgUrl: string, index: number) => ({
                    id: `existing-${index}`,
                    url: imgUrl,
                    isFeatured: initialData.featured_image === imgUrl,
                    isExisting: true
                }));
                // If getting objects like {image_path: '...'} adapt here, but usually it's array of strings based on implementation plan analysis
                // Actually wait, in AddPropertyModal we sent `images` as array of strings. 
                // But PropertyController stores them in PropertyImage model. 
                // So `initialData.images` might be relation array like [{image_path: '...'}, ...].
                // Let's safe-guard this.

                let processedImages: ImageItem[] = [];
                if (initialData.images.length > 0) {
                    // Check if first item is string or object
                    if (typeof initialData.images[0] === 'string') {
                        processedImages = initialData.images.map((img: string, i: number) => ({
                            id: `existing-${i}`,
                            url: img,
                            isFeatured: initialData.featured_image === img || i === 0, // Fallback feature
                            isExisting: true
                        }));
                    } else if (typeof initialData.images[0] === 'object' && initialData.images[0].image_path) {
                        processedImages = initialData.images.map((img: any, i: number) => ({
                            id: `existing-${img.id || i}`,
                            url: img.image_path,
                            isFeatured: !!img.is_featured,
                            isExisting: true
                        }));
                    }
                }
                setImages(processedImages);
            } else if (initialData.featured_image) {
                // Fallback if images array missing but featured image exists
                setImages([{
                    id: 'existing-featured',
                    url: initialData.featured_image,
                    isFeatured: true,
                    isExisting: true
                }]);
            }
        }
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleCheckboxChange = (name: string, value: string) => {
        setFormData(prev => {
            const currentValues = prev[name as keyof typeof prev] as string[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [name]: newValues };
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newImages = files.map(file => ({
            id: `new-${Date.now()}-${Math.random()}`,
            file,
            url: URL.createObjectURL(file),
            isFeatured: images.length === 0,
            isExisting: false
        }));
        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (id: string, index: number) => {
        setImages(prev => {
            const newImages = prev.filter(img => img.id !== id);
            // If removed featured, set new featured
            if (prev[index]?.isFeatured && newImages.length > 0) {
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
        setLoading(true);

        try {
            // 1. Upload new images
            const finalImagePaths: string[] = [];
            let featuredImagePath = "";

            /* 
               Strategy: 
               - Keep existing URLs (isExisting: true)
               - Upload new files (isExisting: false) -> get URLs
               - Combine all into one array
            */

            // Process sequencially to maintain somewhat order, or parallel upload then merge

            // First, separate them
            const existingImages = images.filter(img => img.isExisting);
            const newImages = images.filter(img => !img.isExisting);

            // Upload new
            const uploadPromises = newImages.map(async (img) => {
                if (!img.file) return null;
                const response = await mediaAPI.upload(img.file);
                return { ...img, url: response.path }; // Update url to cloud path
            });

            const uploadedImages = (await Promise.all(uploadPromises)).filter(Boolean) as ImageItem[];

            // Reconstruct final list in order (not strictly necessary but nice) is hard if we split.
            // Simpler: Just concat Existing + Uploaded. 
            // BUT: modifying `images` state directly is tricky during submit.
            // Let's just build the payload.

            const allProcessedImages = [
                ...existingImages.map(img => ({ path: img.url, isFeatured: img.isFeatured })),
                ...uploadedImages.map(img => ({ path: img.url, isFeatured: img.isFeatured }))
            ];

            const imagePathList = allProcessedImages.map(img => img.path);
            const featuredItem = allProcessedImages.find(img => img.isFeatured) || allProcessedImages[0];
            const featuredPath = featuredItem?.path || "";

            // 2. Prepare Payload
            const payload = {
                ...formData,
                year_built: formData.year_built ? parseInt(formData.year_built) : null,
                floors: formData.floors ? parseInt(formData.floors) : null,
                parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
                images: imagePathList,
                featured_image_url: featuredPath
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
            router.refresh();

        } catch (error: any) {
            console.error("Submission failed:", error);
            toast.error(error.response?.data?.message || "Failed to save property");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button type="button" variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEditMode ? `Edit ${initialData?.name || 'Property'}` : "Add New Property"}
                    </h1>
                    <p className="text-muted-foreground">
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
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Location/Area *</Label>
                        <Input
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="e.g. Westlands"
                            required
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
                    <div className="md:col-span-2 space-y-2">
                        <Label>Full Address</Label>
                        <Input name="full_address" value={formData.full_address} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>City</Label>
                        <Input name="city" value={formData.city} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>State/County</Label>
                        <Input name="state" value={formData.state} onChange={handleInputChange} />
                    </div>
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
                    <div className="space-y-2">
                        <Label>Property Type</Label>
                        <Select name="property_type" value={formData.property_type} onValueChange={(val) => handleSelectChange("property_type", val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {PROPERTY_TYPES.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                            onClick={() => removeImage(img.id, index)}
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
                    <CardTitle>Description & Amenities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Property Description</Label>
                        <Textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Describe the property..."
                        />
                    </div>
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
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading} className="min-w-[120px]">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditMode ? "Update Property" : "Create Property"}
                </Button>
            </div>
        </form >
    );
}
