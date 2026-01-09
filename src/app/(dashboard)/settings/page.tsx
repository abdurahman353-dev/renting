'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminAPI } from '@/data/apis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Building2, Phone, Mail, MapPin, Clock, Timer } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await superAdminAPI.getSettings();
            // Transform grouped settings into simple key-value for the form
            const companySettings = data.company || [];
            const flatSettings: any = {};
            companySettings.forEach((s: any) => {
                flatSettings[s.key] = s.value;
            });
            setSettings(flatSettings);
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final validation for phone
        const phone = settings.company_phone || '';
        if (phone.length !== 10 || !phone.startsWith('07')) {
            toast.error('Phone number must be exactly 10 digits and start with 07');
            return;
        }

        setSaving(true);
        try {
            const payload = Object.keys(settings).map(key => ({
                key,
                value: settings[key]
            }));
            await superAdminAPI.updateSettings({ settings: payload });
            toast.success('Settings updated successfully');
            // Instant redirect to Contact page as requested
            router.push('/contact');
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        if (key === 'company_phone') {
            // Only allow digits and limit to 10
            const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
            setSettings((prev: any) => ({ ...prev, [key]: digitsOnly }));
            return;
        }
        setSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Settings</h1>
                    <p className="text-slate-500 font-medium">Configure company information and global application settings.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold text-slate-900">Company Information</CardTitle>
                                <CardDescription className="text-slate-500 font-medium mt-1">
                                    These details are displayed on the public landing and contact pages.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label htmlFor="company_name" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    Company Name
                                </Label>
                                <Input
                                    id="company_name"
                                    value={settings.company_name || ''}
                                    onChange={(e) => handleChange('company_name', e.target.value)}
                                    className="h-12 rounded-2xl border-slate-200 focus:ring-2 focus:ring-indigo-500 px-4 transition-all"
                                    placeholder="e.g. RentSys Real Estate"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="company_phone" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-slate-400" /> Phone Number
                                </Label>
                                <Input
                                    id="company_phone"
                                    value={settings.company_phone || ''}
                                    onChange={(e) => handleChange('company_phone', e.target.value)}
                                    className="h-12 rounded-2xl border-slate-200 focus:ring-2 focus:ring-indigo-500 px-4 transition-all"
                                    placeholder="+254 700 000 000"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="company_email" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-400" /> Email Address
                                </Label>
                                <Input
                                    id="company_email"
                                    type="email"
                                    value={settings.company_email || ''}
                                    onChange={(e) => handleChange('company_email', e.target.value)}
                                    className="h-12 rounded-2xl border-slate-200 focus:ring-2 focus:ring-indigo-500 px-4 transition-all"
                                    placeholder="hello@rentsys.com"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="company_office_hours" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" /> Office Hours
                                </Label>
                                <Input
                                    id="company_office_hours"
                                    value={settings.company_office_hours || ''}
                                    onChange={(e) => handleChange('company_office_hours', e.target.value)}
                                    className="h-12 rounded-2xl border-slate-200 focus:ring-2 focus:ring-indigo-500 px-4 transition-all"
                                    placeholder="Mon-Fri from 8am to 6pm"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="company_address" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" /> Office Address
                            </Label>
                            <Input
                                id="company_address"
                                value={settings.company_address || ''}
                                onChange={(e) => handleChange('company_address', e.target.value)}
                                className="h-12 rounded-2xl border-slate-200 focus:ring-2 focus:ring-indigo-500 px-4 transition-all"
                                placeholder="RentSys Plaza, 4th Floor, Nairobi, Kenya"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="company_response_time" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Timer className="w-4 h-4 text-slate-400" /> Response Time Note
                            </Label>
                            <Input
                                id="company_response_time"
                                value={settings.company_response_time || ''}
                                onChange={(e) => handleChange('company_response_time', e.target.value)}
                                className="h-12 rounded-2xl border-slate-200 focus:ring-2 focus:ring-indigo-500 px-4 transition-all"
                                placeholder="We'll respond within 24 hours"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end items-center gap-4 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.push('/dashboard')}
                        className="h-11 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition-all"
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
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                Save All Settings
                            </div>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
