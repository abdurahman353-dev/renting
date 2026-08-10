"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, ChevronDown, Menu, X } from "lucide-react";
import { publicAPI } from "@/data/apis";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LandingNavbar() {
    const [companyName, setCompanyName] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await publicAPI.getSettings();
                if (data) {
                    setCompanyName(data.company_name || '');
                }
            } catch (error) {
                console.error("Failed to fetch navbar settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600 rounded-lg text-white">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold text-blue-600">
                        {companyName}
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                    <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
                    <Link href="/property" className="hover:text-blue-600 transition-colors">Properties</Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                            Service
                            <ChevronDown className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem asChild>
                                <Link href="/login" className="cursor-pointer">
                                    Agency
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                Inquiry
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                        onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                        className="hover:text-blue-600 transition-colors"
                    >
                        Contact
                    </button>
                    
                    <div className="flex items-center gap-3 ml-4">
                        <Link href="/login">
                            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 font-medium">
                                Landlord Login
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 shadow-sm shadow-blue-600/30">
                                Start Free Trial
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    onClick={toggleMenu}
                >
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-b border-gray-100 py-4 px-4 space-y-4 shadow-xl">
                    <Link
                        href="/"
                        className="block text-gray-600 font-medium hover:text-blue-600 py-2"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Home
                    </Link>
                    <Link
                        href="/property"
                        className="block text-gray-600 font-medium hover:text-blue-600 py-2"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Properties
                    </Link>
                    <div className="space-y-2 py-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Services</p>
                        <Link
                            href="/login"
                            className="block text-gray-600 font-medium hover:text-blue-600 pl-4 border-l-2 border-transparent hover:border-blue-600"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Agency
                        </Link>
                        <button
                            className="block text-gray-600 font-medium hover:text-blue-600 pl-4 border-l-2 border-transparent hover:border-blue-600 w-full text-left"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Inquiry
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                            setIsMenuOpen(false);
                        }}
                        className="block text-gray-600 font-medium hover:text-blue-600 py-2 w-full text-left"
                    >
                        Contact
                    </button>
                    <div className="pt-3 border-t border-gray-100 space-y-2">
                        <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                            <Button variant="outline" className="w-full border-blue-600 text-blue-600 font-bold py-5">
                                Landlord Login
                            </Button>
                        </Link>
                        <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5">
                                Start 14-Day Free Trial
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
