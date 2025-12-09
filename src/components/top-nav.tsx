"use client"

import { Bell, Menu, LogOut, Settings, User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import { useAuth } from "@/contexts/AuthContext"

interface TopNavProps {
    onSidebarToggle: () => void
}

export function TopNav({ onSidebarToggle }: TopNavProps) {
    const { logout, user } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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

                <div
                    className="relative"
                    onMouseEnter={() => setIsDropdownOpen(true)}
                    onMouseLeave={() => setIsDropdownOpen(false)}
                >
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer">
                        <span className="text-sm font-semibold text-primary-foreground">
                            {user ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                        </span>
                    </div>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                            <div className="p-2">
                                <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-sm text-foreground transition-colors">
                                    <User className="w-4 h-4" />
                                    Profile
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-sm text-foreground transition-colors">
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </button>
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-sm text-foreground transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}