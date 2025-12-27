'use client';

import { useState, useEffect } from 'react';
import { LandingNavbar } from '@/components/landing-navbar';
import { LandingFooter } from '@/components/landing-footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from "next/navigation"
import { publicAPI } from "@/data/apis"
import {
    Search,
    MapPin,
    Wifi,
    Shield,
    ArrowRight,
    Building2,
    Loader2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Property {
    id: number;
    name: string;
    location: string;
    total_units: number;
    occupied_units: number;
    image?: string;
    property?: string;
    units?: any[];
    featured_image_url?: string;
    images?: string;
    path?: string;
    min_rent?: number;
    max_rent?: number;
    category?: string;
}

export default function AllPropertiesPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await publicAPI.getProperties();

            let data: Property[] = [];
            if (Array.isArray(response)) {
                data = response;
            } else if (response && typeof response === 'object') {
                data = response.data || response.properties || [];
            }

            setProperties(data);
        } catch (error) {
            console.error("Failed to fetch properties:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProperties = properties.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white">
            <LandingNavbar />

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            All Available Properties
                        </h1>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Discover our full range of premium residential and commercial spaces.
                        </p>
                    </div>

                    {/* Search/Filter Bar */}
                    <div className="max-w-2xl mx-auto mb-16 relative">
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-slate-900 shadow-sm"
                        />
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                            <p className="text-gray-500 font-medium">Loading properties...</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredProperties.length > 0 ? (
                                filteredProperties.map((property) => {
                                    const availableUnits = (property.total_units || property.units?.length || 0) - (property.occupied_units || 0);
                                    const displayImage = property.featured_image_url || property.image || property.images || 'https://images.unsplash.com/photo-1600596542815-e32c8cc13bc9?q=80&w=2070&auto=format&fit=crop';

                                    return (
                                        <div key={property.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                                            <div className="relative h-64 overflow-hidden">
                                                <img
                                                    src={displayImage}
                                                    alt={property.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <Badge className="absolute top-4 left-4 bg-white/90 text-blue-800 hover:bg-white border-0 shadow-sm font-semibold">
                                                    {availableUnits > 0 ? `${availableUnits} Available` : 'Fully Occupied'}
                                                </Badge>
                                                {(() => {
                                                    const unitPrices = property.units?.map(u => Number(u.price)).filter(p => !isNaN(p)) || [];
                                                    const minRent = unitPrices.length > 0 ? Math.min(...unitPrices) : (property.min_rent || 0);
                                                    const maxRent = unitPrices.length > 0 ? Math.max(...unitPrices) : (property.max_rent || 0);

                                                    if (minRent || maxRent) {
                                                        return (
                                                            <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
                                                                KES {formatCurrency(String(minRent))}
                                                                {maxRent > minRent ? ` - ${formatCurrency(String(maxRent))}` : ''}
                                                                <span className="text-sm font-normal opacity-90">/mo</span>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{property.name}</h3>
                                                <div className="flex items-center text-gray-500 mb-4 text-sm">
                                                    <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                                                    {property.location}
                                                </div>
                                                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                                    <div className="flex gap-3">
                                                        <Wifi className="h-5 w-5 text-gray-300" />
                                                        <Shield className="h-5 w-5 text-gray-300" />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        className="text-blue-600 hover:bg-blue-50 font-bold"
                                                        onClick={() => router.push(`/property/${property.id}`)}
                                                    >
                                                        Details <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full py-20 text-center">
                                    <div className="p-6 bg-gray-50 rounded-full inline-block mb-4">
                                        <Building2 className="h-12 w-12 text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No matching properties</h3>
                                    <p className="text-gray-500">Try adjusting your search terms to find what you're looking for.</p>
                                    <Button
                                        variant="outline"
                                        className="mt-6"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        Clear Search
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}