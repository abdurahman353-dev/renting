'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    ChevronRight,
    X,
    Maximize2,
    ZoomIn,
    ZoomOut
} from 'lucide-react';

interface ImageGalleryModalProps {
    images: string[];
    isOpen: boolean;
    onClose: () => void;
    initialIndex?: number;
}

export function ImageGalleryModal({ images, isOpen, onClose, initialIndex = 0 }: ImageGalleryModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setZoom(1);
        }
    }, [isOpen, initialIndex]);

    const handlePrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        setZoom(1);
    }, [images.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        setZoom(1);
    }, [images.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowLeft') handlePrevious();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handlePrevious, handleNext, onClose]);

    if (!images || images.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[100vw] w-screen h-screen p-0 bg-black/95 border-0 rounded-none overflow-hidden flex flex-col justify-center items-center z-[100]">
                {/* Header/Controls */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[110] bg-gradient-to-b from-black/50 to-transparent">
                    <div className="text-white font-medium">
                        {currentIndex + 1} / {images.length}
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setZoom(prev => Math.min(prev + 0.5, 3))}
                            className="text-white hover:bg-white/20 rounded-full"
                        >
                            <ZoomIn className="w-6 h-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setZoom(prev => Math.max(prev - 0.5, 1))}
                            className="text-white hover:bg-white/20 rounded-full"
                        >
                            <ZoomOut className="w-6 h-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full h-12 w-12"
                        >
                            <X className="w-8 h-8" />
                        </Button>
                    </div>
                </div>

                {/* Main Image Area */}
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    {/* Navigation Buttons */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevious}
                        className="absolute left-4 md:left-8 z-[110] text-white hover:bg-white/20 rounded-full h-14 w-14 group"
                    >
                        <ChevronLeft className="w-10 h-10 transition-transform group-hover:-translate-x-1" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNext}
                        className="absolute right-4 md:right-8 z-[110] text-white hover:bg-white/20 rounded-full h-14 w-14 group"
                    >
                        <ChevronRight className="w-10 h-10 transition-transform group-hover:translate-x-1" />
                    </Button>

                    {/* Image Container */}
                    <div
                        className="w-full h-full flex items-center justify-center transition-all duration-300"
                        style={{ transform: `scale(${zoom})` }}
                    >
                        <img
                            src={images[currentIndex]}
                            alt={`Gallery image ${currentIndex + 1}`}
                            className="max-w-full max-h-full object-contain select-none shadow-2xl"
                            draggable={false}
                        />
                    </div>
                </div>

                {/* Thumbnails Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-8 h-32 flex justify-center items-center gap-3 bg-gradient-to-t from-black/50 to-transparent z-[110] overflow-x-auto">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setCurrentIndex(idx);
                                setZoom(1);
                            }}
                            className={`relative h-16 w-16 md:h-20 md:w-24 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${idx === currentIndex ? 'border-blue-500 scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'
                                }`}
                        >
                            <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
