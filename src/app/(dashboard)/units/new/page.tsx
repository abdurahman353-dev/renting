"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { propertyAPI, unitAPI } from "@/data/apis";
import { Building2, Home, DollarSign, Loader2, Hash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
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
import ImageUpload from "@/components/ui/image-upload";

const formSchema = z.object({
    unit_number: z.string().min(1, {
        message: "Unit number is required.",
    }),
    property_id: z.string().min(1, {
        message: "Please select a property.",
    }),
    type: z.string().min(1, {
        message: "Please select a unit type.",
    }),
    price: z.string().min(1, {
        message: "Price is required.",
    }),
    status: z.string().min(1, {
        message: "Status is required.",
    }),
    // image: z.string().min(1, {
    //     message: "Image is required.",
    // }),
});

// Mock properties for the select dropdown
const MOCK_PROPERTIES = [
    { id: "1", name: "Sunrise Apartments" },
    { id: "2", name: "Green Valley Estate" },
    { id: "3", name: "Ocean View Residency" },
];

export default function AddUnitPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProperties();
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            unit_number: "",
            property_id: "",
            type: "",
            price: "",
            status: "Available",
            //image: "",
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


    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true);
            console.log('Form values:', values);
            console.log('Property ID being sent:', values.property_id);
            // Use the property_id from the form values
            await unitAPI.create(values, values.property_id);
            router.push("/units");
            router.refresh();
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to create unit";
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Add New Unit</h2>
                <p className="text-muted-foreground mt-2">
                    Add a new unit to an existing property.
                </p>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle>Unit Details</CardTitle>
                    <CardDescription>
                        Enter the details for the new unit.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="grid gap-8 md:grid-cols-2">
                                <div className="space-y-8">
                                    <FormField
                                        control={form.control}
                                        name="property_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Property</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
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
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="unit_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Unit Number</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="e.g. A-101" className="pl-9" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

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
                                                            <SelectItem value="Studio">Studio</SelectItem>
                                                            <SelectItem value="1 Bedroom">1 Bedroom</SelectItem>
                                                            <SelectItem value="2 Bedroom">2 Bedroom</SelectItem>
                                                            <SelectItem value="3 Bedroom">3 Bedroom</SelectItem>
                                                            <SelectItem value="Penthouse">Penthouse</SelectItem>
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
                                                            <SelectItem value="Available">Available</SelectItem>
                                                            <SelectItem value="Occupied">Occupied</SelectItem>
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
                                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="e.g. 2500" className="pl-9" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* <div className="space-y-8">
                                    <FormField
                                        control={form.control}
                                        name="image"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Unit Image</FormLabel>
                                                <FormControl>
                                                    <ImageUpload
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        label="Upload Image"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div> */}
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
                                    {loading ? "Creating..." : "Create Unit"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
