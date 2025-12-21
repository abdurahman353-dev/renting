"use client";

import { useState, useEffect } from "react";
import { X, Upload, Trash2, Star, Check } from "lucide-react";
import { uploadMultipleToCloudinary } from "@/lib/cloudinary"; // Keeping for reference if needed, or remove
import api from "@/lib/api";
import apiClient, { propertyAPI, mediaAPI } from "@/data/apis";

interface ImageFile {
    file: File;
    preview: string;
    isFeatured: boolean;
}

interface AddPropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editMode?: boolean;
    propertyData?: any;
}

const AMENITIES_LIST = [
    "High-Speed WiFi",
    "Covered Parking",
    "Fitness Center",
    "Modern Kitchen",
    "Spacious Layouts",
    "Pet Friendly",
    "Rooftop Pool",
    "24/7 Concierge Service",
    "Security",
    "Generator/Backup Power",
    "Elevator",
    "Laundry Facilities",
    "Air Conditioning",
    "Balcony/Terrace",
    "Garden/Green Space"
];

const PROPERTY_TYPES = [
    "Apartment Building",
    "Condominium",
    "Townhouse Complex",
    "Villa/House",
    "Commercial"
];

const PET_POLICIES = [
    "Pet Friendly",
    "No Pets",
    "Cats Only",
    "Dogs Only",
    "With Restrictions"
];

const LEASE_PERIODS = [
    "6 months",
    "1 year",
    "2 years",
    "Month-to-month"
];

const UTILITIES = [
    "Water",
    "Electricity",
    "Internet",
    "Gas",
    "Trash Collection"
];

const PAYMENT_FREQUENCIES = [
    "Monthly",
    "Quarterly",
    "Annually"
];

const FURNISHING_OPTIONS = [
    "Furnished",
    "Unfurnished",
    "Semi-furnished"
];

export default function AddPropertyModal({ isOpen, onClose, onSuccess, editMode = false, propertyData }: AddPropertyModalProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [images, setImages] = useState<ImageFile[]>([]);

    // Form data
    const [formData, setFormData] = useState({
        // Basic Information
        name: "",
        location: "",

        // Address Details
        full_address: "",
        city: "",
        state: "",
        postal_code: "",

        // Property Details
        property_type: "",
        year_built: "",
        floors: "",
        parking_spaces: "",
        pet_policy: "",

        // Financial
        min_rent: "",
        max_rent: "",
        security_deposit: "",
        service_charge: "",
        base_price: "",

        // Description
        description: "",

        // Management
        property_manager: "",
        status: "active",

        // Lease Terms
        min_lease_period: "",
        payment_frequency_options: [] as string[],
        utilities_included: [] as string[],
        furnishing_options: "",

        // Owner Information
        owner_name: "",
        owner_contact: "",
        owner_email: "",
        owner_id: "",

        // Additional
        notes: "",

        // Amenities
        amenities: [] as string[],
        custom_amenity: ""
    });

    const totalSteps = 8;

    // Pre-fill form data when in edit mode
    useEffect(() => {
        if (editMode && propertyData) {
            setFormData({
                name: propertyData.name || "",
                full_address: propertyData.full_address || "",
                city: propertyData.city || "",
                state: propertyData.state || "",
                postal_code: propertyData.postal_code || "",
                location: propertyData.location || "",
                property_type: propertyData.property_type || "",
                year_built: propertyData.year_built?.toString() || "",
                floors: propertyData.floors?.toString() || "",
                parking_spaces: propertyData.parking_spaces?.toString() || "",
                pet_policy: propertyData.pet_policy || "",
                description: propertyData.description || "",
                amenities: propertyData.amenities ? propertyData.amenities.map((a: any) => a.name) : [],
                custom_amenity: "",
                min_rent: propertyData.min_rent?.toString() || "",
                max_rent: propertyData.max_rent?.toString() || "",
                security_deposit: propertyData.security_deposit?.toString() || "",
                service_charge: propertyData.service_charge?.toString() || "",
                base_price: propertyData.base_price?.toString() || "",
                property_manager: propertyData.property_manager || "",
                status: propertyData.status || "active",
                min_lease_period: propertyData.min_lease_period || "",
                payment_frequency_options: propertyData.payment_frequency_options || [],
                utilities_included: propertyData.utilities_included || [],
                furnishing_options: propertyData.furnishing_options || "",
                owner_name: propertyData.owner_name || "",
                owner_contact: propertyData.owner_contact || "",
                owner_email: propertyData.owner_email || "",
                owner_id: propertyData.owner_id || "",
                notes: propertyData.notes || "",
            });
        }
    }, [editMode, propertyData]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            isFeatured: images.length === 0 // First image is featured by default
        }));
        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const newImages = prev.filter((_, i) => i !== index);
            // If removed image was featured, make first image featured
            if (prev[index].isFeatured && newImages.length > 0) {
                newImages[0].isFeatured = true;
            }
            return newImages;
        });
    };

    const setFeaturedImage = (index: number) => {
        setImages(prev => prev.map((img, i) => ({
            ...img,
            isFeatured: i === index
        })));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setUploadProgress(0);

        try {
            // Step 1: Upload images to Cloudinary
            let uploadedImageUrls: string[] = [];
            let featuredImageUrl = '';

            if (images.length > 0) {
                // Upload images to local backend
                const uploadPromises = images.map(async (img, index) => {
                    try {
                        const response = await mediaAPI.upload(img.file);

                        // Update progress - crude approximation since we do parallel uploads
                        setUploadProgress(prev => Math.min(prev + (100 / images.length), 100));

                        return {
                            url: response.url, // Keep for preview/featured check if needed
                            path: response.path, // Use for storage
                            isFeatured: img.isFeatured
                        };
                    } catch (err) {
                        console.error("Failed to upload image:", err);
                        throw new Error(`Failed to upload image ${index + 1}`);
                    }
                });

                const uploadedResults = await Promise.all(uploadPromises);
                uploadedImageUrls = uploadedResults.map((res: any) => res.path); // Send paths to backend

                // Get featured image URL (or path)
                const featuredResult = uploadedResults.find((res: any) => res.isFeatured);
                featuredImageUrl = featuredResult ? featuredResult.path : (uploadedResults[0]?.path || '');
            }

            // Step 2: Prepare property data with Cloudinary URLs
            const propertyDataPayload: any = {
                // Basic Information
                name: formData.name,
                location: formData.location,

                // Address Details
                full_address: formData.full_address,
                city: formData.city,
                state: formData.state,
                postal_code: formData.postal_code,

                // Property Details
                property_type: formData.property_type,
                year_built: formData.year_built ? parseInt(formData.year_built) : null,
                floors: formData.floors ? parseInt(formData.floors) : null,
                parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
                pet_policy: formData.pet_policy,

                // Financial
                min_rent: formData.min_rent ? parseFloat(formData.min_rent) : null,
                max_rent: formData.max_rent ? parseFloat(formData.max_rent) : null,
                security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : null,
                service_charge: formData.service_charge ? parseFloat(formData.service_charge) : null,
                base_price: formData.base_price ? parseFloat(formData.base_price) : null,

                // Description
                description: formData.description,

                // Management
                property_manager: formData.property_manager,
                status: formData.status,

                // Lease Terms
                min_lease_period: formData.min_lease_period,
                payment_frequency_options: formData.payment_frequency_options,
                utilities_included: formData.utilities_included,
                furnishing_options: formData.furnishing_options,

                // Owner Information
                owner_name: formData.owner_name,
                owner_contact: formData.owner_contact,
                owner_email: formData.owner_email,
                owner_id: formData.owner_id,

                // Additional
                notes: formData.notes,


                // Amenities
                amenities: formData.amenities,

                // Images from Cloudinary
                images: uploadedImageUrls,
                featured_image_url: featuredImageUrl,
            };

            // Add featured image index if images were uploaded
            if (images.length > 0) {
                // Note: We need a way to reference the results again if we want findIndex
                // Let's just track the index during the upload or recalculate
                const featuredIndex = images.findIndex(img => img.isFeatured);
                propertyDataPayload.featured_image_index = featuredIndex >= 0 ? featuredIndex : 0;
            } else {
                propertyDataPayload.featured_image_index = -1;
            }


            // Step 3: Submit to your backend
            if (editMode && propertyData) {
                await propertyAPI.update(propertyData.id, propertyDataPayload);

            } else {
                await propertyAPI.create(propertyDataPayload);
            }

            onSuccess();
            onClose();
            if (!editMode) {
                resetForm();
            }
        } catch (error) {
            console.error(`Error ${editMode ? 'updating' : 'creating'} property:`, error);
            alert(`Failed to ${editMode ? 'update' : 'create'} property. ${error instanceof Error ? error.message : 'Please try again.'}`);
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "", location: "", full_address: "", city: "", state: "",
            postal_code: "", property_type: "", year_built: "", floors: "", parking_spaces: "",
            pet_policy: "", min_rent: "", max_rent: "", security_deposit: "", service_charge: "",
            base_price: "", description: "", property_manager: "", status: "active",
            min_lease_period: "", payment_frequency_options: [], utilities_included: [],
            furnishing_options: "", owner_name: "", owner_contact: "", owner_email: "",
            owner_id: "", notes: "", amenities: [], custom_amenity: ""
        });
        setImages([]);
        setCurrentStep(1);
    };

    const validateCurrentStep = (): boolean => {
        switch (currentStep) {
            case 1: // Basic Information
                if (!formData.name.trim()) {
                    alert('Please enter a property name');
                    return false;
                }
                if (!formData.location.trim()) {
                    alert('Please enter a location/area');
                    return false;
                }
                return true;

            case 2: // Property Details - all optional
                return true;

            case 3: // Images - optional
                return true;

            case 4: // Description & Amenities - optional
                return true;

            case 5: // Financial - optional
                return true;

            case 6: // Management & Lease Terms - optional
                return true;

            case 7: // Owner Information - optional
                return true;

            case 8: // Review - optional
                return true;

            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-90 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">{editMode ? 'Edit Property' : 'Add New Property'}</h2>
                        <p className="text-blue-100 text-sm mt-1">Step {currentStep} of {totalSteps}</p>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="bg-gray-100 h-2">
                    <div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300"
                        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Sunset Heights Apartments"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Address *</label>
                                    <input
                                        type="text"
                                        name="full_address"
                                        value={formData.full_address}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="123 Main Street"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Nairobi"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">State/County</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Nairobi County"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                                    <input
                                        type="text"
                                        name="postal_code"
                                        value={formData.postal_code}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="00100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location/Area *</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Westlands"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Property Details */}
                    {currentStep === 2 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Property Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                                    <select
                                        name="property_type"
                                        value={formData.property_type}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select Type</option>
                                        {PROPERTY_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Year Built</label>
                                    <input
                                        type="number"
                                        name="year_built"
                                        value={formData.year_built}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="2020"
                                        min="1800"
                                        max={new Date().getFullYear() + 5}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Floors</label>
                                    <input
                                        type="number"
                                        name="floors"
                                        value={formData.floors}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="5"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Parking Spaces</label>
                                    <input
                                        type="number"
                                        name="parking_spaces"
                                        value={formData.parking_spaces}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="20"
                                        min="0"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pet Policy</label>
                                    <select
                                        name="pet_policy"
                                        value={formData.pet_policy}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select Policy</option>
                                        {PET_POLICIES.map(policy => (
                                            <option key={policy} value={policy}>{policy}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Images */}
                    {currentStep === 3 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Property Images</h3>

                            {/* Upload Zone */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                                <input
                                    type="file"
                                    id="image-upload"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <label htmlFor="image-upload" className="cursor-pointer">
                                    <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                                    <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                                    <p className="text-gray-400 text-sm mt-2">PNG, JPG, WEBP up to 5MB</p>
                                </label>
                            </div>

                            {/* Image Previews */}
                            {images.length > 0 && (
                                <div className="grid grid-cols-3 gap-4 mt-6">
                                    {images.map((img, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={img.preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setFeaturedImage(index)}
                                                    className={`p-2 rounded-lg ${img.isFeatured ? 'bg-yellow-500' : 'bg-white/20 hover:bg-white/30'}`}
                                                    title="Set as featured"
                                                >
                                                    <Star size={20} fill={img.isFeatured ? 'white' : 'none'} color="white" />
                                                </button>
                                                <button
                                                    onClick={() => removeImage(index)}
                                                    className="p-2 bg-red-500 hover:bg-red-600 rounded-lg"
                                                    title="Delete image"
                                                >
                                                    <Trash2 size={20} color="white" />
                                                </button>
                                            </div>
                                            {img.isFeatured && (
                                                <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                                    Featured
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Description & Amenities */}
                    {currentStep === 4 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Description & Amenities</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Property Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Experience luxury living at..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {AMENITIES_LIST.map(amenity => (
                                        <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.amenities.includes(amenity)}
                                                onChange={() => handleCheckboxChange('amenities', amenity)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{amenity}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <input
                                        type="text"
                                        name="custom_amenity"
                                        value={formData.custom_amenity}
                                        onChange={handleInputChange}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && formData.custom_amenity.trim()) {
                                                e.preventDefault();
                                                setFormData(prev => ({
                                                    ...prev,
                                                    amenities: [...prev.amenities, prev.custom_amenity.trim()],
                                                    custom_amenity: ''
                                                }));
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Add custom amenity (press Enter)"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Financial Information */}
                    {currentStep === 5 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Financial Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rent (KES)</label>
                                    <input
                                        type="number"
                                        name="min_rent"
                                        value={formData.min_rent}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="25000"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Rent (KES)</label>
                                    <input
                                        type="number"
                                        name="max_rent"
                                        value={formData.max_rent}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="50000"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit (KES)</label>
                                    <input
                                        type="number"
                                        name="security_deposit"
                                        value={formData.security_deposit}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="50000"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Charge (KES)</label>
                                    <input
                                        type="number"
                                        name="service_charge"
                                        value={formData.service_charge}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="5000"
                                        min="0"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Price for Units (KES)</label>
                                    <input
                                        type="number"
                                        name="base_price"
                                        value={formData.base_price}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="30000"
                                        min="0"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">This will be the default rent for auto-generated units</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Management & Lease Terms */}
                    {currentStep === 6 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Management & Lease Terms</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Manager</label>
                                    <input
                                        type="text"
                                        name="property_manager"
                                        value={formData.property_manager}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="under_construction">Under Construction</option>
                                        <option value="under_maintenance">Under Maintenance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Lease Period</label>
                                    <select
                                        name="min_lease_period"
                                        value={formData.min_lease_period}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select Period</option>
                                        {LEASE_PERIODS.map(period => (
                                            <option key={period} value={period}>{period}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Furnishing Options</label>
                                    <select
                                        name="furnishing_options"
                                        value={formData.furnishing_options}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select Option</option>
                                        {FURNISHING_OPTIONS.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Payment Frequency Options</label>
                                    <div className="flex gap-4">
                                        {PAYMENT_FREQUENCIES.map(freq => (
                                            <label key={freq} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.payment_frequency_options.includes(freq)}
                                                    onChange={() => handleCheckboxChange('payment_frequency_options', freq)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">{freq}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Utilities Included</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {UTILITIES.map(utility => (
                                            <label key={utility} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.utilities_included.includes(utility)}
                                                    onChange={() => handleCheckboxChange('utilities_included', utility)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">{utility}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 7: Owner Information */}
                    {currentStep === 7 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Owner Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Owner/Landlord Name</label>
                                    <input
                                        type="text"
                                        name="owner_name"
                                        value={formData.owner_name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Jane Smith"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Owner Contact Number</label>
                                    <input
                                        type="tel"
                                        name="owner_contact"
                                        value={formData.owner_contact}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="+254 700 000000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Owner Email</label>
                                    <input
                                        type="email"
                                        name="owner_email"
                                        value={formData.owner_email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="owner@example.com"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Owner ID/Reference</label>
                                    <input
                                        type="text"
                                        name="owner_id"
                                        value={formData.owner_id}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="ID12345678"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 8: Additional Information & Review */}
                    {currentStep === 8 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes/Special Instructions</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Any additional notes for internal use..."
                                />
                            </div>

                            {/* Summary */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="font-semibold text-blue-900 mb-2">Summary</h4>
                                <div className="text-sm text-blue-800 space-y-1">
                                    <p><strong>Property:</strong> {formData.name || 'Not specified'}</p>
                                    <p><strong>Location:</strong> {formData.city || formData.location || 'Not specified'}</p>
                                    <p><strong>Images:</strong> {images.length} uploaded</p>
                                    <p><strong>Amenities:</strong> {formData.amenities.length} selected</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50 p-6 flex justify-between">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Previous
                    </button>
                    {currentStep < totalSteps ? (
                        <button
                            onClick={nextStep}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition flex items-center gap-2"
                        >
                            {loading ? 'Creating...' : 'Create Property'}
                            {!loading && <Check size={20} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
