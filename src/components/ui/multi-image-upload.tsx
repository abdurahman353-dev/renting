"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MultiImageUploadProps {
    value: (string | File)[];
    onChange: (value: (string | File)[]) => void;
    onRemove: (value: string | File) => void;
    label?: string;
    maxFiles?: number;
}

function ImagePreview({
    item,
    onRemove
}: {
    item: string | File;
    onRemove: () => void;
}) {
    const [previewUrl, setPreviewUrl] = useState<string>("");

    useEffect(() => {
        if (typeof item === 'string') {
            setPreviewUrl(item);
            return;
        }

        const url = URL.createObjectURL(item);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [item]);

    if (!previewUrl) {
        return (
            <div className="aspect-square rounded-lg border border-slate-200 flex items-center justify-center bg-slate-50">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
            <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onRemove}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export default function MultiImageUpload({
    value = [],
    onChange,
    onRemove,
    label = "Images",
    maxFiles = 5
}: MultiImageUploadProps) {
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (value.length + files.length > maxFiles) {
            alert(`You can only upload up to ${maxFiles} images.`);
            return;
        }

        const newFiles = Array.from(files);
        onChange([...value, ...newFiles]);

        // Reset input value
        e.target.value = "";
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">{label}</label>
                <span className="text-xs text-muted-foreground">
                    {value.length} / {maxFiles} images
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {value.map((item, index) => (
                    <ImagePreview
                        key={index}
                        item={item}
                        onRemove={() => onRemove(item)}
                    />
                ))}

                {value.length < maxFiles && (
                    <div className="relative aspect-square rounded-lg border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors flex flex-col items-center justify-center cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="h-6 w-6 text-slate-400 mb-2" />
                        <span className="text-xs font-medium text-slate-500">Select Files</span>
                    </div>
                )}
            </div>
        </div>
    );
}
