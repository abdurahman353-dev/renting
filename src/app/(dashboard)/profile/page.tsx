"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User as UserIcon, Mail, Shield, Hash, Edit, Check, X, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        current_password: "",
        password: "",
        password_confirmation: ""
    });

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
            if (!formData.current_password) {
                setError("Current password is required to save changes.");
                setIsLoading(false);
                return;
            }

            if (formData.password && formData.password !== formData.password_confirmation) {
                setError("New passwords do not match.");
                setIsLoading(false);
                return;
            }

            const payload = {
                name: formData.name,
                email: formData.email,
                current_password: formData.current_password,
                ...(formData.password ? { password: formData.password, password_confirmation: formData.password_confirmation } : {})
            };

            const res = await api.put('/user/profile', payload);

            setSuccess("Profile updated successfully!");
            updateUser(res.data.user); // Refresh user data
            setIsEditing(false);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

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
                    Manage your account settings and update your password securely.
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
                        {!isEditing && (
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
                    {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md flex items-center gap-2 text-sm"><Check className="w-4 h-4" /> {success}</div>}
                    {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md flex items-center gap-2 text-sm"><X className="w-4 h-4" /> {error}</div>}

                    {/* View Mode */}
                    {!isEditing ? (
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
                        /* Edit Mode Form */
                        <form onSubmit={handleSave} className="space-y-6 mt-6 max-w-xl">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                                        required
                                    />
                                </div>

                                <div className="pt-4 border-t">
                                    <h3 className="text-sm font-semibold mb-4">Change Password (Optional)</h3>
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">New Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Leave blank to keep current"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                            <Input
                                                id="password_confirmation"
                                                type="password"
                                                placeholder="Confirm new password"
                                                value={formData.password_confirmation}
                                                onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t bg-yellow-50/50 p-4 rounded-lg border border-yellow-100">
                                    <h3 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                        <Lock className="w-4 h-4" /> Security Check
                                    </h3>
                                    <div className="grid gap-2">
                                        <Label htmlFor="current_password">Current Password (Required to save)</Label>
                                        <Input
                                            id="current_password"
                                            type="password"
                                            placeholder="Enter your current password"
                                            value={formData.current_password}
                                            onChange={e => setFormData({ ...formData, current_password: e.target.value })}
                                            required
                                            className="bg-white"
                                        />
                                        <p className="text-xs text-muted-foreground">For your security, you must enter your current password to make changes.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                                </Button>
                                <Button type="button" variant="ghost" onClick={cancelEditing} disabled={isLoading}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}


