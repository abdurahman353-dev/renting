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
    const { isAuthenticated, hasRole, loading, user } = useAuth();
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

            // Force password change if required
            if (user?.must_change_password && window.location.pathname !== '/profile') {
                router.replace('/profile?change_password=true');
                return;
            }
        }
    }, [isAuthenticated, hasRole, loading, router, user]);

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
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p className="text-gray-600 mb-6">
                        {!isAuthenticated
                            ? "You need to be logged in to view this page."
                            : "You do not have the required permissions to view this dashboard."
                        }
                    </p>
                    <button
                        onClick={() => {
                            // Clear possibly stale data
                            sessionStorage.clear();
                            document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                            window.location.href = '/login';
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return <LayoutWrapper>{children}</LayoutWrapper>;
}
