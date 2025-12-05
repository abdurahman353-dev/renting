"use client"

import { Bell, Menu, LogOut, Settings, User } from "lucide-react"
import Link from "next/link"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"

interface TopNavProps {
    onSidebarToggle: () => void
}

export function TopNav({ onSidebarToggle }: TopNavProps) {
    return (
        <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
            {/* Left */}
            <div className="flex items-center gap-4">
                <button onClick={onSidebarToggle} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                    <Menu className="w-5 h-5" />
                </button>

                <div className="hidden md:flex">
                    <DynamicBreadcrumb />
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
                <button className="p-1.5 hover:bg-muted rounded-lg transition-colors relative">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
                </button>

                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer group relative">
                    <span className="text-sm font-semibold text-primary-foreground">JD</span>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-12 w-48 bg-card border border-border rounded-lg shadow-lg hidden group-hover:block z-50">
                        <div className="p-2">
                            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-sm text-foreground transition-colors">
                                <User className="w-4 h-4" />
                                Profile
                            </button>
                            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-sm text-foreground transition-colors">
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>
                            <Link
                                href="/login"
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-sm text-foreground transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
