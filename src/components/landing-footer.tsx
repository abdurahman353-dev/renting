'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';
import { publicAPI } from '@/data/apis';

export function LandingFooter() {
    const [settings, setSettings] = useState({
        company_name: 'RentSys',
        company_phone: '0729671617',
        company_email: 'hello@rentsys.com',
        company_address: 'Nairobi, Kenya'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await publicAPI.getSettings();
                if (data) {
                    setSettings(prev => ({ ...prev, ...data }));
                }
            } catch (error) {
                console.error("Failed to fetch footer settings:", error);
            }
        };
        fetchSettings();
    }, []);

    return (
        <footer id="contact" className="bg-[#0B1120] text-gray-400 py-16 mt-20">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-12 mb-12">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-blue-600 rounded-lg text-white">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <span className="text-xl font-bold text-white">{settings.company_name}</span>
                        </Link>
                        <p className="leading-relaxed">The complete solution for modern property management. Making renting simple, transparent, and secure for everyone.</p>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Quick Links</h4>
                        <ul className="space-y-4">
                            <li><Link href="/" className="hover:text-blue-500 transition-colors">Home</Link></li>
                            <li><Link href="/property" className="hover:text-blue-500 transition-colors">All Properties</Link></li>
                            <li><Link href="/contact" className="hover:text-blue-500 transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Contact Us</h4>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-blue-500" />
                                {settings.company_phone}
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-blue-500" />
                                {settings.company_email}
                            </li>
                            <li className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-blue-500" />
                                {settings.company_address}
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm">© {new Date().getFullYear()} {settings.company_name}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
