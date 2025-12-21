"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PropertyForm from "@/components/forms/PropertyForm";
import { propertyAPI } from "@/data/apis";
import { Loader2 } from "lucide-react";

export default function EditPropertyPage() {
    const params = useParams();
    const router = useRouter();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Unwrap params in newer Next.js or just access directly if safe? 
    // Next.js 15+ params is async promise? Check package.json: "next": "16.0.10".
    // Next 15+ changes params to Promise. Wait, user is on Next 16? Or 15 canary?
    // "next": "16.0.10" in package.json (from Step 174). THAT IS VERY NEW. 
    // Assuming standard client component behavior where params might be usable or need React.use()?
    // Let's stick to standard `useParams` from `next/navigation` which typically returns the object directly in client components in Next 13/14.
    // However, if creating for Next 15, `params` prop in page is a Promise, but `useParams` hook is sync or sync-like?
    // Docs say useParams() returns Params.

    // In property details (previous conversations), I might have seen how they do it.
    // I'll stick to standard `useParams()`.

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                // useParams returns string or array of strings. 
                const id = params?.id;
                if (!id) return;

                const data = await propertyAPI.getById(id.toString());
                setProperty(data);
            } catch (err: any) {
                console.error("Failed to fetch property:", err);
                setError("Failed to load property details. " + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };

        if (params?.id) {
            fetchProperty();
        }
    }, [params]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
                <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <PropertyForm initialData={property} isEditMode={true} />
        </div>
    );
}
