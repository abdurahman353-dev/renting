"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Shield, Hash, Edit } from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) {
        return null; // Or a loading spinner if preferred, but AuthContext handles initial loading
    }

    // Helper to get initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and view your profile information.
                </p>
            </div>

            {/* Main Profile Card */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {/* Banner/Header Background */}
                <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5 w-full relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 rounded-full bg-primary border-4 border-card flex items-center justify-center shadow-md">
                            <span className="text-3xl font-bold text-primary-foreground">
                                {getInitials(user.name)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">{user.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                                    {user.role.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                        <button
                            disabled
                            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors opacity-50 cursor-not-allowed"
                            title="Edit functionality coming soon"
                        >
                            <Edit className="w-4 h-4" />
                            Edit Profile
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        {/* Email Section */}
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                            <div className="p-2 bg-background rounded-md shadow-sm">
                                <Mail className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                                <p className="text-sm font-semibold mt-1">{user.email}</p>
                            </div>
                        </div>

                        {/* Role Section */}
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                            <div className="p-2 bg-background rounded-md shadow-sm">
                                <Shield className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Role</p>
                                <p className="text-sm font-semibold mt-1 capitalize">{user.role.replace('_', ' ')}</p>
                            </div>
                        </div>

                        {/* User ID Section */}
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                            <div className="p-2 bg-background rounded-md shadow-sm">
                                <Hash className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                                <p className="text-sm font-semibold mt-1">#{user.id}</p>
                            </div>
                        </div>

                        {/* Account Type Section (Placeholder) */}
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                            <div className="p-2 bg-background rounded-md shadow-sm">
                                <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                                <p className="text-sm font-semibold mt-1 text-green-600 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                                    Active
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
