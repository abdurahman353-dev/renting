"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export function LandingNavbar() {
    return (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600 rounded-lg text-white">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        RentSys
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                    <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
                    <Link href="/property" className="hover:text-blue-600 transition-colors">Properties</Link>
                    <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/login">
                        <Button className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold px-6 shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 border-0">
                            Admin Login
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
