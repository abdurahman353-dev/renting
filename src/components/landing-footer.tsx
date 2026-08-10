'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { publicAPI } from '@/data/apis';

export function LandingFooter() {
    const [settings, setSettings] = useState({
        company_name: '',
        company_phone: '',
        company_whatsapp: '',
        company_email: '',
        company_address: '',
        company_footer_tagline: ''
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await publicAPI.getSettings();
                if (data) {
                    setSettings({
                        company_name: data.company_name || '',
                        company_phone: data.company_phone || '',
                        company_whatsapp: data.company_whatsapp || '',
                        company_email: data.company_email || '',
                        company_address: data.company_address || '',
                        company_footer_tagline: data.company_footer_tagline || ''
                    });
                }
            } catch (error) {
                console.error("Failed to fetch footer settings:", error);
            }
        };
        fetchSettings();
    }, []);

    return (
        <footer id="contact" className="bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-16 border-t border-slate-200 dark:border-slate-800">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid md:grid-cols-3 gap-12 mb-12">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
                                <Building2 className="h-5 w-5" />
                            </div>
                            {settings.company_name && (
                                <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {settings.company_name}
                                </span>
                            )}
                        </Link>
                        {settings.company_footer_tagline && (
                            <p className="leading-relaxed text-sm text-slate-600 dark:text-slate-400">
                                {settings.company_footer_tagline}
                            </p>
                        )}
                    </div>

                    <div>
                        <h4 className="text-slate-900 dark:text-white font-bold text-base mb-5 tracking-tight">Quick Links</h4>
                        <ul className="space-y-3 font-medium text-sm">
                            <li><Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link></li>
                            <li><Link href="/property" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">All Properties & Units</Link></li>
                            <li><Link href="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Landlord Registration</Link></li>
                            <li><Link href="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Landlord Login</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-slate-900 dark:text-white font-bold text-base mb-5 tracking-tight">Contact Us</h4>
                        <ul className="space-y-3 font-medium text-sm">
                            {settings.company_phone && (
                                <li className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <a href={`tel:${settings.company_phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                        {settings.company_phone}
                                    </a>
                                </li>
                            )}
                            {settings.company_email && (
                                <li className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <a href={`mailto:${settings.company_email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                        {settings.company_email}
                                    </a>
                                </li>
                            )}
                            {settings.company_whatsapp && (
                                <li className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                        <WhatsAppIcon className="h-4 w-4" />
                                    </div>
                                    <a
                                        href={`https://wa.me/${settings.company_whatsapp.startsWith('0') ? '254' + settings.company_whatsapp.slice(1) : settings.company_whatsapp}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                    >
                                        {settings.company_whatsapp}
                                    </a>
                                </li>
                            )}
                            {settings.company_address && (
                                <li className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <span>{settings.company_address}</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
                    <p>© {new Date().getFullYear()} {settings.company_name}. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/register" className="hover:text-indigo-600 transition-colors">Landlord Terms</Link>
                        <Link href="/" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
