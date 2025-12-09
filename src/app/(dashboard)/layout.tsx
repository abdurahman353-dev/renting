"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, hasRole, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            // Check if user is authenticated
            if (!isAuthenticated) {
                router.replace('/login');
                return;
            }

            // Check if user has admin or super_admin role
            if (!hasRole(['admin', 'super_admin'])) {
                router.replace('/login?error=unauthorized');
                return;
            }
        }
    }, [isAuthenticated, hasRole, loading, router]);

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                    <p className="mt-4 text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render dashboard if not authenticated or unauthorized
    if (!isAuthenticated || !hasRole(['admin', 'super_admin'])) {
        return null;
    }

    return <LayoutWrapper>{children}</LayoutWrapper>;
}
