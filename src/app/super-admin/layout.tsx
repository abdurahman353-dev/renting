"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { Loader2 } from "lucide-react";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated || !user) {
                window.location.href = '/login';
                return;
            }
            // 1. Mandatory password change check MUST take precedence
            if (user?.must_change_password) {
                router.replace('/profile?change_password=true');
                return;
            }

            // 2. Only super_admin can access this portal
            if (user?.role !== 'super_admin') {
                router.replace('/login?error=unauthorized');
                return;
            }
        }
    }, [isAuthenticated, loading, router, user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
        );
    }

    if (!isAuthenticated || !user || user?.role !== 'super_admin' || user?.must_change_password) {
        if (typeof window !== 'undefined') {
            if (!isAuthenticated || !user) {
                window.location.href = '/login';
            } else if (user?.must_change_password) {
                window.location.href = '/profile?change_password=true';
            } else if (user?.role !== 'super_admin') {
                window.location.href = '/login?error=unauthorized';
            }
        }
        return null;
    }

    return (
        <div className="h-full relative">
            {/* Desktop Sidebar — uses pureSuperAdminRoutes auto-detected from sidebar.tsx */}
            <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-80 bg-slate-900">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isExpanded={true} />
            </div>

            {/* Mobile Sidebar */}
            <div className="md:hidden">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isExpanded={true} />
            </div>

            {/* Main Content Area */}
            <div className="md:pl-64">
                {/* Sticky Top Nav */}
                <div className="sticky top-0 z-50">
                    <TopNav onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
                </div>

                {/* Main Content */}
                <main className="bg-slate-50 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
