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
    Zap,
    Star,
    Mail,
    ArrowRight,
    Building2,
    Loader2,
    CheckCircle2
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
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchLocation, setSearchLocation] = useState('');
    const [searchType, setSearchType] = useState('Property Type');
    const [searchMinPrice, setSearchMinPrice] = useState('');
    const [searchMaxPrice, setSearchMaxPrice] = useState('');

    // Dynamic Filter Options
    const [locationOptions, setLocationOptions] = useState<string[]>([]);
    const [typeOptions, setTypeOptions] = useState<string[]>([]);

    useEffect(() => {
        fetchProperties();
        fetchSearchOptions();
    }, []);

    const fetchSearchOptions = async () => {
        try {
            const options = await publicAPI.getSearchOptions();
            if (options) {
                if (options.locations) setLocationOptions(options.locations);
                if (options.types) setTypeOptions(options.types);
            }
        } catch (error) {
            console.error("Failed to fetch search options", error);
        }
    };

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const response = await publicAPI.getProperties();

            let propertiesData: Property[] = [];
            if (Array.isArray(response)) {
                propertiesData = response;
            } else if (response && typeof response === 'object') {
                propertiesData = response.data || response.properties || response.results || [];
            }

            setAllProperties(propertiesData);
            setFilteredProperties(propertiesData);
        } catch (error) {
            console.error("Failed to fetch properties:", error);
            setAllProperties([]);
            setFilteredProperties([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (searchLocation) filters.location = searchLocation;
            if (searchType !== 'Property Type') filters.type = searchType;
            if (searchMinPrice) filters.min_price = searchMinPrice;
            if (searchMaxPrice) filters.max_price = searchMaxPrice;

            const response = await publicAPI.getProperties(filters);

            let propertiesData: Property[] = [];
            if (Array.isArray(response)) {
                propertiesData = response;
            } else if (response && typeof response === 'object') {
                propertiesData = response.data || response.properties || response.results || [];
            }

            setFilteredProperties(propertiesData);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setSearchLocation('');
        setSearchType('Property Type');
        setSearchMinPrice('');
        setSearchMaxPrice('');
        setFilteredProperties(allProperties);
    };

    return (
        <div className="min-h-screen bg-white">
            <LandingNavbar />

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                            Find Your Perfect <br />
                            <span className="text-blue-600">
                                Available Home
                            </span>
                        </h1>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Discover our full range of premium residential and commercial spaces with advanced search tools.
                        </p>
                    </div>

                    {/* Advanced Search Bar Component */}
                    <div className="max-w-5xl mx-auto bg-white p-4 rounded-2xl shadow-xl border border-gray-100 mb-20 flex flex-col md:flex-row gap-4 items-end md:items-center">
                        <div className="flex-1 w-full relative">
                            <label className="text-xs font-bold text-slate-400 mb-1.5 ml-2 block uppercase tracking-wider">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <select
                                    value={searchLocation}
                                    onChange={(e) => setSearchLocation(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-blue-100 outline-none font-medium appearance-none text-gray-600 cursor-pointer"
                                >
                                    <option value="">Any Location</option>
                                    {locationOptions.map((loc, i) => (
                                        <option key={i} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex-1 w-full relative">
                            <label className="text-xs font-bold text-slate-400 mb-1.5 ml-2 block uppercase tracking-wider">Property Type</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <select
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-blue-100 outline-none font-medium appearance-none text-gray-600 cursor-pointer"
                                >
                                    <option>Property Type</option>
                                    <option value="1 Bedroom">1 Bedroom</option>
                                    <option value="2 Bedroom">2 Bedroom</option>
                                    <option value="3 Bedroom">3 Bedroom</option>
                                    <option value="Shop">Shop</option>
                                    <option value="Office">Office</option>
                                    <option value="Shop & 1 Bedroom">Shop & 1 Bedroom</option>
                                    <option value="Shop & Shop">Shop & Shop</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex-1 w-full relative">
                            <label className="text-xs font-bold text-slate-400 mb-1.5 ml-2 block uppercase tracking-wider">Price Range (KES)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={searchMinPrice}
                                    onChange={(e) => setSearchMinPrice(e.target.value)}
                                    className="w-1/2 px-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-gray-600"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={searchMaxPrice}
                                    onChange={(e) => setSearchMaxPrice(e.target.value)}
                                    className="w-1/2 px-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-gray-600"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleSearch}
                            className="w-full md:w-auto h-12 px-8 bg-blue-600 hover:bg-blue-700 text-lg shadow-lg shadow-blue-600/25 transition-all active:scale-95 mt-4 md:mt-6"
                        >
                            Search
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                            <p className="text-gray-500 font-medium">Updating listings...</p>
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
                                    <div className="p-6 bg-gray-50 rounded-3xl inline-block mb-4">
                                        <Search className="h-12 w-12 text-blue-200" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Matching Properties</h3>
                                    <p className="text-gray-500">We couldn't find any properties matching your search criteria.</p>
                                    <Button
                                        variant="outline"
                                        className="mt-6 border-blue-200 text-blue-600 hover:bg-blue-50 h-11 px-8 font-semibold rounded-xl"
                                        onClick={clearFilters}
                                    >
                                        Reset All Filters
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
