"use client"

import { Bell, Menu, LogOut, Settings, User, Check, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"

interface TopNavProps {
    onSidebarToggle: () => void
}

interface Notification {
    id: number;
    type: string;
    title: string | null;
    message: string;
    read_at: string | null;
    created_at: string;
}

export function TopNav({ onSidebarToggle }: TopNavProps) {
    const { logout, user } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isNotifOpen, setIsNotifOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    const dropdownRef = useRef<HTMLDivElement>(null)
    const notifRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await api.get('/user/notifications');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unread_count || 0);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [user]);

    const markAsRead = async (id?: number) => {
        try {
            const payload = id ? { id } : {};
            await api.post('/user/notifications/read', payload);
            fetchNotifications(); // Refresh list
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleNotifClick = () => {
        setIsNotifOpen(!isNotifOpen);
        if (!isNotifOpen) {
            fetchNotifications();
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6 z-40 relative">
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
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={handleNotifClick}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors relative"
                    >
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card" />
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-50 flex flex-col">
                            <div className="p-3 border-b flex justify-between items-center bg-muted/50">
                                <span className="font-semibold text-sm">Notifications</span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAsRead()}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" /> Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="divide-y">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No notifications
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            className={`p-3 text-sm hover:bg-muted/50 transition-colors ${!notif.read_at ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => markAsRead(notif.id)}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-0.5">
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    {notif.title && (
                                                        <p className="font-medium text-foreground">{notif.title}</p>
                                                    )}
                                                    <p className="text-muted-foreground whitespace-pre-wrap text-xs leading-relaxed">{notif.message}</p>
                                                    <p className="text-[10px] text-slate-400">{formatDate(notif.created_at)}</p>
                                                </div>
                                                {!notif.read_at && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        className="w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <span className="text-sm font-semibold text-primary-foreground">
                            {user ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                        </span>
                    </div>

                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                            <div className="p-2">
                                <Link
                                    href="/profile"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-sm text-foreground transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    Profile
                                </Link>
                                <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-sm text-foreground transition-colors">
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </button>
                                <div className="h-px bg-border my-1" />
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 text-red-600 rounded-lg text-sm transition-colors"
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