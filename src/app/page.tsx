'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing-navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from "next/navigation"
import { propertyAPI, publicAPI } from "@/data/apis"

// Import all Lucide icons used
import {
    Search,
    MapPin,
    BedDouble,
    Bath,
    Car,
    Wifi,
    Shield,
    Zap,
    Star,
    Phone,
    Mail,
    ArrowRight,
    CheckCircle2,
    Building2,
    Bell,
    PenTool as Tool
} from 'lucide-react';
import { LandingFooter } from '@/components/landing-footer';
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

export default function LandingPage() {
    const router = useRouter();
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    // Filter states
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
        try {
            const response = await publicAPI.getProperties();

            // Handle different response structures - ensure we always get an array
            let propertiesData: Property[] = [];

            if (Array.isArray(response)) {
                propertiesData = response;
            } else if (response && typeof response === 'object') {
                // Check common property names where the array might be nested
                propertiesData = response.data || response.properties || response.results || [];
            }

            // Final safety check
            if (!Array.isArray(propertiesData)) {
                console.warn('Properties data is not an array:', propertiesData);
                propertiesData = [];
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

            // Handle different response structures
            let propertiesData: Property[] = [];
            if (Array.isArray(response)) {
                propertiesData = response;
            } else if (response && typeof response === 'object') {
                propertiesData = response.data || response.properties || response.results || [];
            }

            setFilteredProperties(propertiesData);

            // Scroll to featured section
            const featuredSection = document.getElementById('featured');
            if (featuredSection) {
                featuredSection.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <LandingNavbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-slate-900">
                    {/* Video Background with Fallback */}
                    {!imageError ? (
                        <div className="absolute inset-0">
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover opacity-90"
                                onError={() => setImageError(true)}
                            >
                                <source
                                    src="/video/grok-hero.mp4"
                                    type="video/mp4"
                                />
                                {/* Fallback to image if video fails */}
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ) : (
                        /* Image Fallback */
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-100"
                            style={{
                                backgroundImage: 'url(https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop)'
                            }}
                        />
                    )}

                    <div className="absolute inset-0 bg-slate-900/70" />
                </div>

                <div className="container relative mx-auto px-4 text-center z-10">
                    <Badge variant="outline" className="mb-6 border-white/20 text-white px-4 py-1.5 backdrop-blur-md" style={{ background: 'transparent' }}>
                        Simplify Your Living Experience
                    </Badge>
                    <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
                        Find Your Next Home <br />
                        <span className="text-blue-400">
                            With Ease & Style
                        </span>
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
                        Browse premium available units and receive instant rent/payment links directly via SMS. No hassle, just comfort.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-5xl mx-auto bg-white p-4 rounded-2xl shadow-2xl shadow-blue-900/20 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                            <select
                                value={searchLocation}
                                onChange={(e) => setSearchLocation(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-blue-100 outline-none font-medium appearance-none text-gray-600 cursor-pointer"
                            >
                                <option value="">Select Location</option>
                                {locationOptions.map((loc, i) => (
                                    <option key={i} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
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
                            </select>
                        </div>
                        <div className="flex-1 relative flex gap-2">
                            <input
                                type="number"
                                placeholder="Min Price"
                                value={searchMinPrice}
                                onChange={(e) => setSearchMinPrice(e.target.value)}
                                className="w-1/2 pl-4 pr-2 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-gray-600"
                            />
                            <input
                                type="number"
                                placeholder="Max Price"
                                value={searchMaxPrice}
                                onChange={(e) => setSearchMaxPrice(e.target.value)}
                                className="w-1/2 pl-4 pr-2 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-gray-600"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-lg shadow-lg shadow-blue-600/25 transition-all active:scale-95"
                        >
                            Search Now
                        </Button>
                    </div>
                </div>
            </section>

            {/* Featured Properties Section */}
            <section id="featured" className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            {searchLocation || searchType !== 'Property Type' ? 'Search Results' : 'Featured Properties'}
                        </h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            {filteredProperties.length > 0
                                ? `Found ${filteredProperties.length} premium properties for you.`
                                : "No properties found matching your criteria. Try adjustment your filters."}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-96 bg-white rounded-3xl animate-pulse"></div>
                            ))
                        ) : filteredProperties.length > 0 ? (
                            filteredProperties.slice(0, 6).map((property) => {
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
                                            <Badge className="absolute top-4 left-4 bg-white/90 text-blue-800 hover:bg-white border-0 shadow-sm">
                                                {availableUnits > 0 ? `${availableUnits} Available` : 'Fully Occupied'}
                                            </Badge>
                                            {(() => {
                                                const unitPrices = property.units?.map(u => Number(u.price)).filter(p => !isNaN(p)) || [];
                                                const minRent = unitPrices.length > 0 ? Math.min(...unitPrices) : (property.min_rent || 0);
                                                const maxRent = unitPrices.length > 0 ? Math.max(...unitPrices) : (property.max_rent || 0);

                                                if (minRent || maxRent) {
                                                    return (
                                                        <div className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 px-3 py-1.5 rounded-lg shadow-sm flex items-baseline gap-1">
                                                            <span className="font-bold text-sm">KES {formatCurrency(String(minRent))}</span>
                                                            {maxRent > minRent ? <span className="font-bold text-sm"> - {formatCurrency(String(maxRent))}</span> : ''}
                                                            <span className="text-[10px] font-medium text-slate-300">/mo</span>
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
                                <div className="p-6 bg-white rounded-2xl shadow-sm inline-block mb-4">
                                    <Search className="h-12 w-12 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No Properties Found</h3>
                                <p className="text-slate-500">Try searching for a different location or property type.</p>
                                <Button
                                    variant="outline"
                                    className="mt-6"
                                    onClick={() => {
                                        setSearchLocation('');
                                        setSearchType('Property Type');
                                        setFilteredProperties(allProperties);
                                    }}
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        )}
                    </div>

                    {(filteredProperties.length > 0 && !loading) && (
                        <div className="text-center mt-12">
                            <Link href="/property">
                                <Button className="h-12 px-8 bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 text-lg shadow-sm font-semibold">
                                    Browse All Listings
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            <LandingFooter />
        </div>
    );
}