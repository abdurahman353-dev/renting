"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { propertyAPI, unitAPI, uploadAPI } from "@/data/apis";
import { Building2, Home, DollarSign, Loader2, Hash, ListOrdered, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUpload from "@/components/ui/image-upload";
import MultiImageUpload from "@/components/ui/multi-image-upload";



// Unified Schema with Refinement
const formSchema = z.object({
    mode: z.enum(["single", "bulk"]),
    property_id: z.string().min(1, "Please select a property."),
    type: z.string().min(1, "Please select a unit type."),
    price: z.string().min(1, "Price is required."),
    deposit_1: z.string().optional(),
    deposit_2: z.string().optional(),
    status: z.string().min(1, "Status is required."),
    image: z.string().optional(),
    images: z.array(z.union([z.string(), z.instanceof(File)])).optional(),

    // Single mode specific
    unit_number: z.string().optional(),

    // Bulk mode specific
    unit_prefix: z.string().optional(),
    start_number: z.coerce.number().optional(),
    count: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
    if (data.mode === "single") {
        if (!data.unit_number || data.unit_number.length < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Unit number is required.",
                path: ["unit_number"],
            });
        }
    } else {
        if (!data.start_number || data.start_number < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Start number must be at least 1.",
                path: ["start_number"],
            });
        }
        if (!data.count || data.count < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Must create at least 1 unit.",
                path: ["count"],
            });
        }
        if (data.count && data.count > 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Maximum 100 units at a time.",
                path: ["count"],
            });
        }
    }
});

type FormValues = z.infer<typeof formSchema>;

export default function AddUnitPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const propertyIdParam = searchParams.get("property_id");

    const [loading, setLoading] = useState(false);
    const [properties, setProperties] = useState<any[]>([]);
    const [existingUnitNumbers, setExistingUnitNumbers] = useState<string[]>([]);
    const [mode, setMode] = useState<"single" | "bulk">("single");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            mode: "single",
            unit_number: "",
            property_id: propertyIdParam || "",
            type: "",
            price: "",
            deposit_1: "",
            deposit_2: "",
            status: "Vacant",
            image: "",
            images: [],
            unit_prefix: "",
            start_number: 1,
            count: 10,
        },
    });


    const fetchProperties = async () => {
        try {
            // const response = await api.get('/properties');
            const response = await propertyAPI.getAll()
            setProperties(response);
        } catch (error) {
            console.error("Failed to fetch properties:", error);
        }
    };



    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const data = await propertyAPI.getAll();
                setProperties(data);
                if (propertyIdParam) {
                    form.setValue("property_id", propertyIdParam);
                }
            } catch (error) {
                console.error("Failed to fetch properties", error);
            }
        };
        fetchProperties();
    }, [propertyIdParam]);

    const selectedPropertyId = form.watch("property_id");

    useEffect(() => {
        if (selectedPropertyId) {
            const property = properties.find(p => p.id.toString() === selectedPropertyId);
            if (property && property.units) {
                setExistingUnitNumbers(property.units.map((u: any) => u.unit_number.toString()));
            } else if (property) {
                // If units not loaded, fetch property detail
                propertyAPI.getById(selectedPropertyId).then(data => {
                    setExistingUnitNumbers(data.units?.map((u: any) => u.unit_number.toString()) || []);
                });
            }
        } else {
            setExistingUnitNumbers([]);
        }
    }, [selectedPropertyId, properties]);

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        try {
            setLoading(true);

            // Handle Image Uploads
            let imageUrls: string[] = [];
            if (values.images && values.images.length > 0) {
                // Upload files sequentially or in parallel
                const uploadPromises = values.images.map(async (img) => {
                    if (img instanceof File) {
                        const formData = new FormData();
                        formData.append("file", img);
                        const res = await uploadAPI.upload(formData);
                        return res.url;
                    }
                    return img; // Already a URL string
                });
                imageUrls = await Promise.all(uploadPromises);
            }

            // Fallback image (use first uploaded image if main image is not set)
            const mainImage = values.image || (imageUrls.length > 0 ? imageUrls[0] : "");

            if (values.mode === "single") {
                // Ensure values are present for single mode
                if (!values.unit_number) return;

                await unitAPI.create(values.property_id, {
                    unit_number: values.unit_number,
                    type: values.type,
                    status: values.status,
                    price: values.price,
                    deposit_1: values.deposit_1 ? parseFloat(values.deposit_1) : 0,
                    deposit_2: values.deposit_2 ? parseFloat(values.deposit_2) : 0,
                    image: mainImage,
                    images: imageUrls,
                });
            } else {
                // Bulk mode
                const start = values.start_number || 1;
                const count = values.count || 1;

                // Generate units for bulk creation
                const units = [];
                for (let i = 0; i < count; i++) {
                    const number = start + i;
                    const unitNumber = values.unit_prefix
                        ? `${values.unit_prefix}${number}`
                        : `${number}`;

                    units.push({
                        unit_number: unitNumber,
                        type: values.type,
                        status: values.status,
                        price: values.price,
                        deposit_1: values.deposit_1 ? parseFloat(values.deposit_1) : 0,
                        deposit_2: values.deposit_2 ? parseFloat(values.deposit_2) : 0,
                        image: mainImage,
                        images: imageUrls,
                    });
                }

                await propertyAPI.bulkAddUnits(values.property_id, { units });
            }

            toast.success("Unit(s) created successfully");
            router.push(`/properties/${values.property_id}`); // Redirect to property page seems better, or units list.
            router.refresh();
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to create unit";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Watch values for preview
    const watchedPrefix = form.watch("unit_prefix");
    const watchedStart = form.watch("start_number");
    const watchedCount = form.watch("count");

    const getPreviewText = () => {
        if (!watchedCount || watchedCount < 1) return "";
        const start = watchedStart || 1;
        const end = start + (watchedCount - 1);
        const prefix = watchedPrefix || "";

        if (watchedCount === 1) return `Will create unit: ${prefix}${start}`;
        return `Will create ${watchedCount} units: ${prefix}${start} ... ${prefix}${end}`;
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Add New Unit</h2>
                <p className="text-muted-foreground mt-2">
                    Add new units to your properties.
                </p>
            </div>

            <Tabs value={mode} onValueChange={(v) => {
                setMode(v as "single" | "bulk");
                form.setValue("mode", v as "single" | "bulk");
            }} className="w-full">
                {/* <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="single">Single Unit</TabsTrigger>
                    <TabsTrigger value="bulk">Bulk Creation</TabsTrigger>
                </TabsList> */}

                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardHeader>
                        <CardTitle>{mode === "single" ? "Single Unit Details" : "Bulk Generation Settings"}</CardTitle>
                        <CardDescription>
                            {mode === "single"
                                ? "Enter details for a single unit."
                                : "Generate multiple units at once with a sequential number pattern."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                <div className="grid gap-8 md:grid-cols-2">
                                    {/* Common Fields */}
                                    <div className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="property_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Property</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={!!propertyIdParam}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className={!!propertyIdParam ? "bg-slate-50 cursor-not-allowed" : ""}>
                                                                <SelectValue placeholder="Select a property" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {properties.map((property) => (
                                                                <SelectItem key={property.id} value={property.id.toString()}>
                                                                    {property.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {propertyIdParam && (
                                                        <FormDescription className="text-blue-600 font-medium">
                                                            Property auto-selected from previous page.
                                                        </FormDescription>
                                                    )}
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {mode === "single" ? (
                                            <FormField
                                                control={form.control}
                                                name="unit_number"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Unit Number</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Hash className={`absolute left-3 top-2.5 h-4 w-4 ${existingUnitNumbers.includes(field.value || '') ? "text-red-500" : "text-muted-foreground"}`} />
                                                                <Input
                                                                    placeholder="e.g. A-101"
                                                                    className={`pl-9 ${existingUnitNumbers.includes(field.value || '') ? "border-red-500 bg-red-50 focus-visible:ring-red-500" : ""}`}
                                                                    {...field}
                                                                    value={field.value || ''}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        {existingUnitNumbers.includes(field.value || '') && (
                                                            <p className="text-xs font-medium text-red-600 mt-1">This unit number already exists in the selected property.</p>
                                                        )}
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ) : (
                                            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <FormField
                                                    control={form.control}
                                                    name="unit_prefix"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Prefix (Optional)</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g. Apt-" {...field} value={field.value || ''} />
                                                            </FormControl>
                                                            <FormDescription>Text to appear before the number</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="start_number"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Start Number</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" {...field} value={field.value || ''} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="count"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Number of Units</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" min={1} max={100} {...field} value={field.value || ''} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {/* Replaced Alert with custom styled div */}
                                                <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">
                                                    <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                                    <div className="space-y-1">
                                                        <h5 className="font-medium leading-none tracking-tight">Preview</h5>
                                                        <div className="text-sm opacity-90">
                                                            {getPreviewText()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="type"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Type</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select type" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="1 Bedroom">1 Bedroom</SelectItem>
                                                                <SelectItem value="2 Bedroom">2 Bedroom</SelectItem>
                                                                <SelectItem value="3 Bedroom">3 Bedroom</SelectItem>
                                                                <SelectItem value="Shop">Shop</SelectItem>
                                                                <SelectItem value="Office">Office</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Status</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select status" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {/* <SelectItem value="Occupied">Occupied</SelectItem> */}
                                                                <SelectItem value="Vacant">Vacant</SelectItem>
                                                                <SelectItem value="Maintenance">Maintenance</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Monthly Rent</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-semibold">Ksh</span>
                                                            <Input type="number" placeholder="0.00" className="pl-12" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="deposit_1"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Security Deposit (1)</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-semibold">Ksh</span>
                                                                <Input type="number" placeholder="0.00" className="pl-12" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="deposit_2"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Additional Deposit (2)</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-semibold">Ksh</span>
                                                                <Input type="number" placeholder="0.00" className="pl-12" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Image Upload */}
                                    <div className="space-y-8">
                                        <FormField
                                            control={form.control}
                                            name="images"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Unit Images</FormLabel>
                                                    <FormControl>
                                                        <MultiImageUpload
                                                            value={field.value || []}
                                                            onChange={field.onChange}
                                                            onRemove={(itemToRemove) => {
                                                                const newValue = (field.value || []).filter((v) => v !== itemToRemove);
                                                                field.onChange(newValue);
                                                            }}
                                                            label="Upload Images"
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Add multiple photos for this unit.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {loading ? "Processing..." : (mode === "single" ? "Create Unit" : `Create ${watchedCount || 0} Units`)}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
}
