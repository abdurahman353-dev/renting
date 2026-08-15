'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orgSettingsAPI } from '@/data/apis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Building2, Phone, Mail, MapPin, Clock, Timer, Lock, Loader2 } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';

import { Textarea } from '@/components/ui/textarea';

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<{
        company_name?: string;
        company_email?: string;
        company_phone?: string;
        company_whatsapp?: string;
        company_office_hours?: string;
        company_address?: string;
        company_response_time?: string;
    }>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await orgSettingsAPI.getSettings();
            setSettings(data || {});
        } catch (error) {
            console.error("Failed to load agency settings:", error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Phone and WhatsApp validation (only validate if filled)
        const phone = settings.company_phone || '';
        if (phone && (phone.length !== 10 || (!phone.startsWith('07') && !phone.startsWith('01')))) {
            toast.error('Phone number must be exactly 10 digits and start with 07 or 01');
            return;
        }

        const whatsapp = settings.company_whatsapp || '';
        if (whatsapp && (whatsapp.length !== 10 || (!whatsapp.startsWith('07') && !whatsapp.startsWith('01')))) {
            toast.error('WhatsApp number must be exactly 10 digits and start with 07 or 01');
            return;
        }

        setSaving(true);
        try {
            await orgSettingsAPI.updateSettings(settings);
            toast.success('Agency settings updated successfully');
            fetchSettings();
        } catch (error) {
            console.error("Failed to update settings:", error);
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        if (key === 'company_phone' || key === 'company_whatsapp') {
            const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
            setSettings((prev: any) => ({ ...prev, [key]: digitsOnly }));
            return;
        }
        setSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Loading agency settings...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 bg-muted/40 min-h-screen w-full max-w-none">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Agency Settings</h1>
                        <p className="text-muted-foreground font-medium">Manage your agency contact info displayed on your public property listings.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    <Card className="border-border shadow-xl shadow-black/5 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-muted/50 border-b border-border p-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold text-foreground">Company Information</CardTitle>
                                    <CardDescription className="text-muted-foreground font-medium mt-1">
                                        These details are displayed on your public agency profile and property contact widgets.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label htmlFor="company_name" className="text-sm font-bold text-foreground flex items-center gap-2">
                                        Company Name <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Label>
                                    <Input
                                        id="company_name"
                                        value={settings.company_name || ''}
                                        disabled={true}
                                        readOnly={true}
                                        className="h-12 rounded-2xl border-input bg-muted/60 cursor-not-allowed opacity-80 font-semibold px-4"
                                    />
                                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                                        <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                                        Managed & verified by SaaS Super Admin
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="company_phone" className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-muted-foreground" /> Phone Number
                                    </Label>
                                    <Input
                                        id="company_phone"
                                        value={settings.company_phone || ''}
                                        onChange={(e) => handleChange('company_phone', e.target.value)}
                                        className="h-12 rounded-2xl border-input focus:ring-2 focus:ring-primary px-4 transition-all"
                                        placeholder="07XXXXXXXX"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="company_email" className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" /> Email Address
                                    </Label>
                                    <Input
                                        id="company_email"
                                        type="email"
                                        value={settings.company_email || ''}
                                        onChange={(e) => handleChange('company_email', e.target.value)}
                                        className="h-12 rounded-2xl border-input focus:ring-2 focus:ring-primary px-4 transition-all"
                                        placeholder="agency@example.com"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="company_whatsapp" className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <WhatsAppIcon className="w-4 h-4 text-emerald-500" /> WhatsApp Number
                                    </Label>
                                    <Input
                                        id="company_whatsapp"
                                        value={settings.company_whatsapp || ''}
                                        onChange={(e) => handleChange('company_whatsapp', e.target.value)}
                                        className="h-12 rounded-2xl border-input focus:ring-2 focus:ring-primary px-4 transition-all"
                                        placeholder="07XXXXXXXX"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border">
                                <div className="space-y-3">
                                    <Label htmlFor="company_office_hours" className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" /> Office Hours
                                    </Label>
                                    <Textarea
                                        id="company_office_hours"
                                        rows={3}
                                        value={settings.company_office_hours || ''}
                                        onChange={(e) => handleChange('company_office_hours', e.target.value)}
                                        className="rounded-2xl border-input focus:ring-2 focus:ring-primary px-4 py-3 transition-all min-h-[90px] font-medium resize-y"
                                        placeholder={"e.g.\nMon-Fri: 8:00 AM - 8:00 PM\nSat: 9:00 AM - 4:00 PM\nSun: Closed"}
                                    />
                                    <p className="text-[11px] text-muted-foreground font-medium">
                                        Press Enter to add additional schedule lines.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="company_response_time" className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Timer className="w-4 h-4 text-muted-foreground" /> Response Time Note
                                    </Label>
                                    <Input
                                        id="company_response_time"
                                        value={settings.company_response_time || ''}
                                        onChange={(e) => handleChange('company_response_time', e.target.value)}
                                        className="h-12 rounded-2xl border-input focus:ring-2 focus:ring-primary px-4 transition-all"
                                        placeholder="e.g. Responds within 1 hour"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="company_address" className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground" /> Office Address
                                </Label>
                                <Input
                                    id="company_address"
                                    value={settings.company_address || ''}
                                    onChange={(e) => handleChange('company_address', e.target.value)}
                                    className="h-12 rounded-2xl border-input focus:ring-2 focus:ring-primary px-4 transition-all"
                                    placeholder="e.g. Plaza Building, 3rd Floor, Mombasa, Kenya"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end items-center gap-4 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.push('/dashboard')}
                            className="h-11 px-6 bg-muted hover:bg-muted/80 text-muted-foreground font-semibold text-sm rounded-xl transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save className="w-4 h-4" />
                                    Save Agency Settings
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
