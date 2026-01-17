"use client";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { usePreventBack } from "@/hooks/usePreventBack";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Prevent back button navigation
    usePreventBack();

    return (
        <div className="h-full relative">
            {/* Desktop Sidebar */}
            <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-80 bg-slate-900">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            </div>

            {/* Mobile Sidebar */}
            <div className="md:hidden">
                <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            </div>

            {/* Main Content Area */}
            <div className="md:pl-64">
                {/* Sticky Top Nav */}
                <div className="sticky top-0 z-50">
                    <TopNav onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
                </div>

                {/* Main Content */}
                <main className="bg-background min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
