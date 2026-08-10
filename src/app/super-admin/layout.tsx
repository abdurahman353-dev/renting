"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { ShieldCheck, Users, Activity, Settings, LayoutDashboard, Building2 } from "lucide-react";
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
            if (!isAuthenticated) {
                router.replace('/login');
                return;
            }
            // Only super_admin can access this portal
            if (user?.role !== 'super_admin') {
                router.replace('/login?error=unauthorized');
                return;
            }
        }
    }, [isAuthenticated, loading, router, user]);

    const superAdminRoutes = [
        {
            label: "SaaS Master Control",
            icon: LayoutDashboard,
            href: "/super-admin",
            color: "text-amber-400 font-bold",
        },
        {
            label: "Landing & Settings",
            icon: Settings,
            href: "/settings",
            color: "text-indigo-400",
        },
        {
            label: "Platform Activity",
            icon: Activity,
            href: "/activity",
            color: "text-emerald-400",
        },
        {
            label: "System Admins",
            icon: Users,
            href: "/admins",
            color: "text-pink-400",
        },
        {
            label: "Landlord Demo View",
            icon: Building2,
            href: "/dashboard",
            color: "text-slate-400",
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
        );
    }

    if (!isAuthenticated || user?.role !== 'super_admin') {
        return null;
    }

    return (
        <div className="h-full relative">
            {/* Desktop Sidebar */}
            <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-80 bg-slate-900">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} routes={superAdminRoutes} isExpanded={true} />
            </div>

            {/* Mobile Sidebar */}
            <div className="md:hidden">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} routes={superAdminRoutes} isExpanded={true} />
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
