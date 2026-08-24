'use client';

import { useState, useEffect } from 'react';
import { LandingNavbar } from '@/components/landing-navbar';
import { LandingFooter } from '@/components/landing-footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from "next/navigation";
import { publicAPI } from "@/data/apis";
import {
    Search,
    MapPin,
    Wifi,
    Shield,
    ArrowRight,
    Building2,
    Loader2,
    Home,
    Phone,
    Mail,
    Building,
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
    featured_image?: string;
    property?: string;
    units?: any[];
    featured_image_url?: string;
    images?: string;
    path?: string;
    min_rent?: number;
    max_rent?: number;
    category?: string;
}

interface Agency {
    id: number;
    name: string;
    email: string;
    phone: string;
    logo_path?: string;
    properties_count: number;
    units_count: number;
    vacant_units_count: number;
}

export default function AllPropertiesPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'agencies' | 'properties'>('agencies');
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);

    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [agenciesLoading, setAgenciesLoading] = useState(true);

    // Filter states
    const [searchLocation, setSearchLocation] = useState('');
    const [searchType, setSearchType] = useState('Property Type');
    const [searchMinPrice, setSearchMinPrice] = useState('');
    const [searchMaxPrice, setSearchMaxPrice] = useState('');

    // Dynamic Filter Options
    const [locationOptions, setLocationOptions] = useState<string[]>([]);

    useEffect(() => {
        fetchAgencies();
        fetchProperties();
        fetchSearchOptions();
    }, []);

    const fetchAgencies = async () => {
        setAgenciesLoading(true);
        try {
            const data = await publicAPI.getAgencies();
            if (Array.isArray(data)) setAgencies(data);
        } catch (err) {
            console.error("Failed to fetch agencies:", err);
        } finally {
            setAgenciesLoading(false);
        }
    };

    const fetchSearchOptions = async () => {
        try {
            const options = await publicAPI.getSearchOptions();
            if (options && options.locations) {
                setLocationOptions(options.locations);
            }
        } catch (error) {
            console.error("Failed to fetch search options", error);
        }
    };

    const fetchProperties = async (agencyId?: number) => {
        setLoading(true);
        try {
            let response;
            if (agencyId) {
                const res = await publicAPI.getAgencyProperties(agencyId);
                response = res.properties || [];
            } else {
                response = await publicAPI.getProperties();
            }

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

    const handleSelectAgency = (agency: Agency) => {
        setSelectedAgency(agency);
        setAllProperties([]);
        setFilteredProperties([]);
        setLoading(true);
        setViewMode('properties');
        fetchProperties(agency.id);
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
        setSelectedAgency(null);
        fetchProperties();
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
            <LandingNavbar />

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Header Banner */}
                    <div className="text-center mb-10 space-y-3">
                        <Badge className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 px-3.5 py-1 text-xs uppercase font-bold tracking-wider">
                            Multi-Tenant House Finder
                        </Badge>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {selectedAgency ? `${selectedAgency.name} Portfolio` : "Registered Agencies & Available Houses"}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base">
                            Select a registered real estate management agency or search available vacant units directly.
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex justify-center mb-10">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setViewMode('agencies');
                                    setSelectedAgency(null);
                                    fetchProperties();
                                }}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                    viewMode === 'agencies'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Building className="w-4 h-4" />
                                Registered Agencies ({agencies.length})
                            </button>

                            <button
                                onClick={() => setViewMode('properties')}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                    viewMode === 'properties'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Home className="w-4 h-4" />
                                All Properties & Units ({filteredProperties.length})
                            </button>
                        </div>
                    </div>

                    {/* View 1: Registered Agencies Grid */}
                    {viewMode === 'agencies' && (
                        <div className="space-y-6">
                            {agenciesLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div
                                            key={i}
                                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-pulse flex flex-col justify-between space-y-6 min-h-[290px]"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                                                    <div className="space-y-2 flex-1">
                                                        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                                                        <div className="h-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-full w-1/2" />
                                                    </div>
                                                </div>

                                                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                    <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                                                    <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-4/5" />
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                    <div className="h-14 bg-slate-100 dark:bg-slate-800/80 rounded-xl" />
                                                    <div className="h-14 bg-slate-100 dark:bg-slate-800/80 rounded-xl" />
                                                </div>
                                            </div>

                                            <div className="h-11 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {agencies.length > 0 ? (
                                        agencies.map((agency) => (
                                            <div
                                                key={agency.id}
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                                            >
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                                                            <Building2 className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                                                                {agency.name}
                                                            </h3>
                                                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 font-semibold px-2 py-0">
                                                                Verified Landlord Account
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                                                        {agency.phone && (
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span>{agency.phone}</span>
                                                            </div>
                                                        )}
                                                        {agency.email && (
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                                                <span className="truncate">{agency.email}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 pt-2 text-center">
                                                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5">
                                                            <div className="text-base font-black text-slate-900 dark:text-white">{agency.properties_count}</div>
                                                            <div className="text-[10px] text-slate-500 font-medium">Properties</div>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5">
                                                            <div className="text-base font-black text-emerald-600 dark:text-emerald-400">{agency.vacant_units_count}</div>
                                                            <div className="text-[10px] text-slate-500 font-medium">Vacant Units</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => handleSelectAgency(agency)}
                                                    className="mt-6 w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                                                >
                                                    View Agency Properties <ArrowRight className="w-4 h-4 ml-1.5" />
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-16 text-center text-slate-500">
                                            No registered agencies available yet.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* View 2: Properties & Vacant Units Grid */}
                    {viewMode === 'properties' && (
                        <div className="space-y-8">
                            {/* Advanced Search Bar Component */}
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-end md:items-center">
                                <div className="flex-1 w-full relative">
                                    <label className="text-xs font-bold text-slate-400 mb-1.5 ml-2 block uppercase tracking-wider">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <select
                                            value={searchLocation}
                                            onChange={(e) => setSearchLocation(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-indigo-100 outline-none font-medium appearance-none text-slate-700 dark:text-slate-200 cursor-pointer"
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
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-indigo-100 outline-none font-medium appearance-none text-slate-700 dark:text-slate-200 cursor-pointer"
                                        >
                                            <option>Property Type</option>
                                            <option value="1 Bedroom">1 Bedroom</option>
                                            <option value="2 Bedroom">2 Bedroom</option>
                                            <option value="3 Bedroom">3 Bedroom</option>
                                            <option value="Shop">Shop</option>
                                            <option value="Office">Office</option>
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
                                            className="w-1/2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-slate-700 dark:text-slate-200"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={searchMaxPrice}
                                            onChange={(e) => setSearchMaxPrice(e.target.value)}
                                            className="w-1/2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-slate-700 dark:text-slate-200"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSearch}
                                    className="w-full md:w-auto h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                                >
                                    Search
                                </Button>
                            </div>

                            {/* Agency Banner - shown when viewing a specific agency */}
                            {selectedAgency && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/60 rounded-xl">
                                            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold uppercase tracking-wider">Viewing Portfolio</p>
                                            <p className="text-base font-black text-indigo-900 dark:text-indigo-100">{selectedAgency.name}</p>
                                            {selectedAgency.phone && <p className="text-xs text-indigo-600 dark:text-indigo-400">{selectedAgency.phone}</p>}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setViewMode('agencies');
                                            setSelectedAgency(null);
                                            fetchProperties();
                                        }}
                                        className="text-xs font-bold border-indigo-300 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/40 rounded-xl shrink-0"
                                    >
                                        ← Back to All Agencies
                                    </Button>
                                </div>
                            )}


                            {loading ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div
                                            key={i}
                                            className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="h-64 bg-slate-200 dark:bg-slate-800 w-full relative" />
                                                <div className="p-6 space-y-4">
                                                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                                                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2" />
                                                </div>
                                            </div>
                                            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between mt-4">
                                                <div className="flex gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
                                                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
                                                </div>
                                                <div className="h-10 bg-indigo-100 dark:bg-indigo-950/60 rounded-xl w-40" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredProperties.length > 0 ? (
                                        filteredProperties.map((property) => {
                                            const totalUnitsCount = property.units ? property.units.length : (property.total_units || 0);
                                            const vacantUnitsCount = property.units && property.units.length > 0
                                                ? property.units.filter((u: any) => {
                                                    const st = (u.status || '').toUpperCase();
                                                    return st === 'VACANT' || st === 'AVAILABLE';
                                                }).length
                                                : Math.max(0, totalUnitsCount - (property.occupied_units || 0));

                                            let badgeText = '';
                                            let badgeClass = '';

                                            if (totalUnitsCount === 0) {
                                                badgeText = 'No Units Added';
                                                badgeClass = 'bg-slate-900/80 text-white dark:bg-slate-950/80 border-0';
                                            } else if (vacantUnitsCount > 0) {
                                                badgeText = `${vacantUnitsCount} Vacant Unit${vacantUnitsCount > 1 ? 's' : ''}`;
                                                badgeClass = 'bg-emerald-600 text-white font-bold border-0 shadow-md';
                                            } else {
                                                badgeText = 'Fully Occupied';
                                                badgeClass = 'bg-amber-600 text-white font-bold border-0 shadow-md';
                                            }

                                            const displayImage = property.featured_image_url
                                                || (typeof property.featured_image === 'string' && property.featured_image ? property.featured_image : null)
                                                || (typeof property.image === 'string' && property.image ? property.image : null)
                                                || 'https://images.unsplash.com/photo-1600596542815-e32c8cc13bc9?q=80&w=2070&auto=format&fit=crop';

                                            return (
                                                <div key={property.id} className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-200 dark:border-slate-800">
                                                    <div className="relative h-64 overflow-hidden">
                                                        <img
                                                            src={displayImage}
                                                            alt={property.name}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600596542815-e32c8cc13bc9?q=80&w=2070&auto=format&fit=crop';
                                                            }}
                                                        />
                                                        <Badge className={`absolute top-4 left-4 ${badgeClass}`}>
                                                            {badgeText}
                                                        </Badge>
                                                        {(() => {
                                                            const unitPrices = property.units?.map(u => Number(u.price)).filter(p => !isNaN(p)) || [];
                                                            const minRent = unitPrices.length > 0 ? Math.min(...unitPrices) : (property.min_rent || 0);
                                                            const maxRent = unitPrices.length > 0 ? Math.max(...unitPrices) : (property.max_rent || 0);

                                                            if (minRent || maxRent) {
                                                                return (
                                                                    <div className="absolute bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg">
                                                                        KES {formatCurrency(String(minRent))}
                                                                        {maxRent > minRent ? ` - ${formatCurrency(String(maxRent))}` : ''}
                                                                        <span className="text-xs font-normal opacity-90">/mo</span>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                    <div className="p-6">
                                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 truncate">{property.name}</h3>
                                                        <div className="flex items-center text-slate-500 mb-4 text-sm font-medium">
                                                            <MapPin className="h-4 w-4 mr-2 text-indigo-500" />
                                                            {property.location}
                                                        </div>
                                                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                            <div className="flex gap-3">
                                                                <Wifi className="h-5 w-5 text-slate-300" />
                                                                <Shield className="h-5 w-5 text-slate-300" />
                                                            </div>
                                                            <Button
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                                                                onClick={() => router.push(`/property/${property.id}`)}
                                                            >
                                                                Details & Vacant Units <ArrowRight className="ml-2 h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-full py-20 text-center">
                                            <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-3xl inline-block mb-4">
                                                <Search className="h-12 w-12 text-indigo-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Matching Properties</h3>
                                            <p className="text-slate-500">We couldn't find any properties matching your search criteria.</p>
                                            <Button
                                                variant="outline"
                                                className="mt-6 border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-11 px-8 font-semibold rounded-xl"
                                                onClick={clearFilters}
                                            >
                                                Reset All Filters
                                            </Button>
                                        </div>
                                    )}
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
