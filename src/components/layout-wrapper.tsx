"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { usePreventBack } from "@/hooks/usePreventBack";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent back button navigation
    usePreventBack();

    if (!mounted) {
        return <div className="h-full relative font-inter bg-slate-50 dark:bg-slate-900 min-h-screen">{children}</div>;
    }

    // Mandatory Password Change Screen Layout (No Sidebar, No TopNav background API calls)
    if (user?.must_change_password) {
        return (
            <div className="h-full relative font-inter bg-slate-50 dark:bg-slate-900 min-h-screen">
                <main className="w-full min-h-screen flex items-center justify-center p-4">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="h-full relative font-inter">
            {/* Desktop Sidebar */}
            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    "hidden md:flex md:flex-col md:fixed md:inset-y-0 z-[60] bg-slate-900 transition-all duration-300 ease-in-out shadow-2xl overflow-hidden",
                    (isExpanded || isHovered) ? "md:w-64" : "md:w-20"
                )}
            >
                <Sidebar isExpanded={isExpanded || isHovered} isOpen={true} setIsOpen={() => { }} />
            </div>

            {/* Mobile Sidebar */}
            <div className="md:hidden">
                <Sidebar isExpanded={true} isOpen={mobileOpen} setIsOpen={setMobileOpen} />
            </div>

            {/* Main Content Area */}
            <div
                className={cn(
                    "transition-all duration-300 ease-in-out",
                    (isExpanded || isHovered) ? "md:pl-64" : "md:pl-20"
                )}
            >
                {/* Sticky Top Nav */}
                <div className="sticky top-0 z-[50]">
                    <TopNav onSidebarToggle={() => {
                        setIsExpanded(!isExpanded);
                        setMobileOpen(!mobileOpen);
                    }} />
                </div>

                {/* Main Content */}
                <main className="bg-background min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
