'use client';

import Link from 'next/link';
import { LandingNavbar } from '@/components/landing-navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            <LandingNavbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-slate-900">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-e32c8cc13bc9?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-white" />
                </div>

                <div className="container relative mx-auto px-4 text-center z-10">
                    <Badge variant="outline" className="mb-6 border-white/20 text-white px-4 py-1.5 backdrop-blur-md">
                        ✨ Simplify Your Living Experience
                    </Badge>
                    <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
                        Find Your Next Home <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            Ease & Style
                        </span>
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
                        Browse premium available units and receive instant rent/payment links directly via SMS. No hassle, just comfort.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-4xl mx-auto bg-white p-4 rounded-2xl shadow-2xl shadow-blue-900/20 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Location (e.g. Westlands)"
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-blue-100 outline-none font-medium"
                            />
                        </div>
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <select className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-blue-100 outline-none font-medium appearance-none text-gray-600">
                                <option>Property Type</option>
                                <option>Apartment</option>
                                <option>Bedsitter</option>
                                <option>Villa</option>
                            </select>
                        </div>
                        <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-lg shadow-lg shadow-blue-600/25">
                            Search Now
                        </Button>
                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            <section id="featured" className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Featured Properties</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">Explore our hand-picked selection of premium properties available for rent right now.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Property Card 1 */}
                        <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop"
                                    alt="Property"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <Badge className="absolute top-4 left-4 bg-white/90 text-blue-800 hover:bg-white">
                                    5 Units Available
                                </Badge>
                                <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
                                    KES 45,000<span className="text-sm font-normal opacity-90">/mo</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Sunrise Apartments</h3>
                                <div className="flex items-center text-gray-500 mb-4">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Kilimani, Nairobi
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <BedDouble className="h-4 w-4 mr-1 stroke-2" /> 2 BD
                                    </div>
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <Bath className="h-4 w-4 mr-1 stroke-2" /> 2 BA
                                    </div>
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <Car className="h-4 w-4 mr-1 stroke-2" /> 1 Parking
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <Wifi className="h-5 w-5 text-gray-400" />
                                        <Shield className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Button variant="ghost" className="text-blue-600 hover:bg-blue-50 font-medium">
                                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Property Card 2 */}
                        <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop"
                                    alt="Property"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <Badge className="absolute top-4 left-4 bg-white/90 text-blue-800 hover:bg-white">
                                    2 Units Available
                                </Badge>
                                <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
                                    KES 85,000<span className="text-sm font-normal opacity-90">/mo</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Ocean View Residency</h3>
                                <div className="flex items-center text-gray-500 mb-4">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Nyali, Mombasa
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <BedDouble className="h-4 w-4 mr-1 stroke-2" /> 3 BD
                                    </div>
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <Bath className="h-4 w-4 mr-1 stroke-2" /> 3 BA
                                    </div>
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <Car className="h-4 w-4 mr-1 stroke-2" /> 2 Parking
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <Wifi className="h-5 w-5 text-gray-400" />
                                        <Shield className="h-5 w-5 text-gray-400" />
                                        <Zap className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Button variant="ghost" className="text-blue-600 hover:bg-blue-50 font-medium">
                                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Property Card 3 */}
                        <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop"
                                    alt="Property"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <Badge className="absolute top-4 left-4 bg-white/90 text-blue-800 hover:bg-white">
                                    8 Units Available
                                </Badge>
                                <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
                                    KES 25,000<span className="text-sm font-normal opacity-90">/mo</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Green Valley Estate</h3>
                                <div className="flex items-center text-gray-500 mb-4">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Kileleshwa, Nairobi
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <BedDouble className="h-4 w-4 mr-1 stroke-2" /> 1 BD
                                    </div>
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <Bath className="h-4 w-4 mr-1 stroke-2" /> 1 BA
                                    </div>
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <Car className="h-4 w-4 mr-1 stroke-2" /> 1 Parking
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <Wifi className="h-5 w-5 text-gray-400" />
                                        <Shield className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Button variant="ghost" className="text-blue-600 hover:bg-blue-50 font-medium">
                                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <Button className="h-12 px-8 bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 text-lg shadow-sm">
                            View All Properties
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="bg-[#0B1120] text-gray-400 py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="space-y-4">
                            <Link href="/" className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-blue-600 rounded-lg text-white">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <span className="text-xl font-bold text-white">RentSys</span>
                            </Link>
                            <p className="leading-relaxed">The complete solution for modern property management. Making renting simple, transparent, and secure for everyone.</p>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Quick Links</h4>
                            <ul className="space-y-4">
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Find a Home</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">List Your Property</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-blue-500 transition-colors">Contact Support</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Contact Us</h4>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-blue-500" />
                                    +254 700 000 000
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-blue-500" />
                                    support@rentsys.com
                                </li>
                                <li className="flex items-center gap-3">
                                    <MapPin className="h-5 w-5 text-blue-500" />
                                    Nairobi, Kenya
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6">Newsletter</h4>
                            <p className="mb-4 text-sm">Subscribe to get notified about new premium listings.</p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="bg-gray-800 border-none rounded-lg px-4 py-2 w-full focus:ring-1 focus:ring-blue-600 outline-none text-white"
                                />
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p>© {new Date().getFullYear()} RentSys. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
