"use client";

import { useState } from "react";
import Image from "next/image";
// import axios from "axios";
// import Cookies from "js-cookie";
import { uploadAPI } from "@/data/apis";

interface ImageUploadProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export default function ImageUpload({ value, onChange, label = "Image" }: ImageUploadProps) {
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            // const token = Cookies.get("token");
            // const res = await axios.post("http://localhost:8000/api/upload", formData, {
            //     headers: {
            //         "Content-Type": "multipart/form-data",
            //         Authorization: `Bearer ${token}`,
            //     },
            // });
            const res = await uploadAPI.upload(formData);

            onChange(res.data.url);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Image upload failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            <div className="flex items-center gap-4">
                {value && (
                    <div className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200">
                        <Image
                            src={value}
                            alt="Preview"
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                <div className="flex-1">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={loading}
                        className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-emerald-50 file:text-emerald-700
              hover:file:bg-emerald-100
            "
                    />
                    {loading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                </div>
            </div>
        </div>
    );
}
