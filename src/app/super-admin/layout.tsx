"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { ShieldCheck, Users, Activity, Settings, LayoutDashboard } from "lucide-react";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const superAdminRoutes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/super-admin",
            color: "text-sky-500",
        },
        {
            label: "Admins",
            icon: Users,
            href: "/super-admin/admins",
            color: "text-violet-500",
        },
        {
            label: "Activity Logs",
            icon: Activity,
            href: "/super-admin/activity",
            color: "text-pink-700",
        },
        {
            label: "Settings",
            icon: Settings,
            href: "/super-admin/settings",
            color: "text-gray-500",
        },
    ];

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
