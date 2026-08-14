"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { User as UserIcon, Mail, Shield, Hash, Edit, Check, X, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";

export default function ProfilePage() {
    const router = useRouter();
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [success, setSuccess] = useState("");

    const searchParams = useSearchParams();
    const shouldChangePassword = searchParams.get('change_password') === 'true' || user?.must_change_password;

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        current_password: "",
        password: "",
        password_confirmation: ""
    });

    useEffect(() => {
        if (shouldChangePassword && !isEditing) {
            startEditing();
        }
    }, [shouldChangePassword]);

    if (!user) {
        return null;
    }

    const startEditing = () => {
        setFormData({
            name: user.name,
            email: user.email,
            current_password: "", // Always required fresh
            password: "",
            password_confirmation: ""
        });
        setError("");
        setSuccess("");
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setError("");
    };

    // Helper to get initials
    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';
    };

    // Password protocol validation helpers
    const hasMinLen   = formData.password.length >= 8;
    const hasUpper    = /[A-Z]/.test(formData.password);
    const hasLower    = /[a-z]/.test(formData.password);
    const hasNumber   = /[0-9]/.test(formData.password);
    const hasSpecial  = /[^A-Za-z0-9]/.test(formData.password);
    const isDifferent = !formData.current_password || formData.password !== formData.current_password;
    const isMatched   = formData.password.length > 0 && formData.password === formData.password_confirmation;

    const allProtocolsMet = hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial && isDifferent && isMatched;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!formData.current_password) {
            setError("Current temporary password is required.");
            return;
        }

        if (user.must_change_password || formData.password) {
            if (!formData.password) {
                setError("You must enter a new password.");
                return;
            }

            if (formData.password === formData.current_password) {
                setError("Your new password cannot be the same as your initial temporary password. Please create a new password.");
                return;
            }

            if (!hasMinLen || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
                setError("New password does not meet all security protocol requirements.");
                return;
            }

            if (formData.password !== formData.password_confirmation) {
                setError("New password and confirmation do not match.");
                return;
            }
        }

        setIsLoading(true);
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                current_password: formData.current_password,
                ...(formData.password ? { password: formData.password, password_confirmation: formData.password_confirmation } : {})
            };

            const res = await api.put('/user/profile', payload);
            const updatedUser = res.data.user;

            updateUser(updatedUser); // Immediately update context state (clears must_change_password)
            toast.success("Password updated successfully! Welcome to your dashboard.");

            // Immediately redirect to appropriate dashboard with zero delay or flash
            if (updatedUser?.role === 'super_admin') {
                router.replace('/super-admin');
            } else {
                router.replace('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 bg-muted/40 min-h-screen w-full max-w-none">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Profile Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your account settings and update your password securely.
                    </p>
                </div>

                {/* Warning Banner for Forced Password Change */}
                {user.must_change_password && (
                    <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                        <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-600 shrink-0 mt-0.5">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-amber-900 dark:text-amber-300 text-base">🔒 Mandatory Initial Password Change Required</h3>
                            <p className="text-sm text-amber-800 dark:text-amber-400 mt-1 leading-relaxed">
                                You are currently logged in with an initial temporary password. For security, you must create a new custom password before accessing dashboard features.
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Profile Card */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    {/* Banner/Header Background */}
                    <div className="h-32 bg-primary/10 w-full relative">
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
                            {!isEditing && !user.must_change_password && (
                                <Button
                                    onClick={startEditing}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit Profile
                                </Button>
                            )}
                        </div>

                        {/* Feedback Messages */}
                        {success && <div className="mb-4 p-3 bg-green-500/10 text-green-700 dark:text-green-300 rounded-xl border border-green-300 flex items-center gap-2 text-sm font-semibold"><Check className="w-4 h-4 text-green-600" /> {success}</div>}
                        {error && <div className="mb-4 p-3 bg-red-500/10 text-red-700 dark:text-red-300 rounded-xl border border-red-300 flex items-center gap-2 text-sm font-semibold"><X className="w-4 h-4 text-red-600" /> {error}</div>}

                        {/* View Mode */}
                        {!isEditing && !user.must_change_password ? (
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
                                {/* Account Status */}
                                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                                    <div className="p-2 bg-background rounded-md shadow-sm">
                                        <UserIcon className="w-5 h-5 text-muted-foreground" />
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
                        ) : (
                            /* Edit / Change Password Form */
                            <form onSubmit={handleSave} className="space-y-6 mt-6 max-w-xl">
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            disabled={user.must_change_password}
                                            className={user.must_change_password ? "bg-muted/70 cursor-not-allowed opacity-80 font-semibold" : ""}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            disabled={user.must_change_password}
                                            className={user.must_change_password ? "bg-muted/70 cursor-not-allowed opacity-80 font-semibold" : ""}
                                            required
                                        />
                                        {user.must_change_password && (
                                            <p className="text-xs text-muted-foreground italic">Name and Email address are locked during initial password setup.</p>
                                        )}
                                    </div>

                                    {/* Temporary / Current Password Security Field */}
                                    <div className="pt-4 border-t bg-amber-500/5 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-2">
                                        <Label htmlFor="current_password" className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 text-sm">
                                            <Lock className="w-4 h-4 text-amber-600" />
                                            {user.must_change_password ? "Initial Temporary Password *" : "Current Password *"}
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="current_password"
                                                type={showCurrentPassword ? "text" : "password"}
                                                placeholder="Enter current / temporary password"
                                                value={formData.current_password}
                                                onChange={e => setFormData({ ...formData, current_password: e.target.value })}
                                                required
                                                className="bg-background pr-10 font-semibold"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                                            >
                                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {user.must_change_password
                                                ? "Enter the initial password given to you by the platform admin."
                                                : "Required to save changes to your profile."}
                                        </p>
                                    </div>

                                    {/* New Password Fields */}
                                    <div className="pt-4 border-t space-y-4">
                                        <h3 className="text-sm font-bold text-foreground">
                                            {user.must_change_password ? "Set Your Custom New Password *" : "Change Password"}
                                        </h3>
                                        
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">New Password *</Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={showNewPassword ? "text" : "password"}
                                                    placeholder="Enter new strong password"
                                                    value={formData.password}
                                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                    required={user.must_change_password}
                                                    className="pr-10 font-semibold"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                                                >
                                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password_confirmation">Confirm New Password *</Label>
                                            <div className="relative">
                                                <Input
                                                    id="password_confirmation"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Re-enter new password"
                                                    value={formData.password_confirmation}
                                                    onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })}
                                                    required={user.must_change_password}
                                                    className="pr-10 font-semibold"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Security Protocols Checklist */}
                                        {formData.password.length > 0 && (
                                            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2 text-xs">
                                                <p className="font-bold text-slate-700 dark:text-slate-300">Password Protocols Checklist:</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <div className={`flex items-center gap-1.5 font-semibold ${hasMinLen ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {hasMinLen ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} At least 8 characters
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 font-semibold ${hasUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Uppercase letter (A-Z)
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 font-semibold ${hasLower ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Lowercase letter (a-z)
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 font-semibold ${hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} At least 1 number (0-9)
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 font-semibold ${hasSpecial ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Special character (@, $, !, %)
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 font-semibold ${isDifferent ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {isDifferent ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-red-500" />} Not same as initial password
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 font-semibold ${isMatched ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {isMatched ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Passwords match
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isLoading || (user.must_change_password && !allProtocolsMet)}
                                        className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl shadow-md"
                                    >
                                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Password...</> : "Save & Update Password"}
                                    </Button>
                                    {!user.must_change_password && (
                                        <Button type="button" variant="ghost" onClick={cancelEditing} disabled={isLoading} className="rounded-xl font-bold">
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


