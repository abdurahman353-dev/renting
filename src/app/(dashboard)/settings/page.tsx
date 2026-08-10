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
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';

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
            const payload = Object.keys(settings).map(key => ({
                key,
                value: settings[key]
            }));
            await superAdminAPI.updateSettings({ settings: payload });
            toast.success('Settings updated successfully');
            // Instant redirect to Home page as requested
            router.push('/');
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        if (key === 'company_phone' || key === 'company_whatsapp') {
            // Only allow digits and limit to 10
            const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
            setSettings((prev: any) => ({ ...prev, [key]: digitsOnly }));
            return;
        }
        setSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 bg-muted/40 min-h-screen w-full max-w-none">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">System Settings</h1>
                        <p className="text-muted-foreground font-medium">Configure company information and global application settings.</p>
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
                                        These details are displayed on the public landing and contact pages.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label htmlFor="company_name" className="text-sm font-bold text-foreground flex items-center gap-2">
                                        Company Name
                                    </Label>
                                    <Input
                                        id="company_name"
                                        value={settings.company_name || ''}
                                        onChange={(e) => handleChange('company_name', e.target.value)}
                                        className="h-12 rounded-2xl border-input focus:ring-2 focus:ring-primary px-4 transition-all"
                                        placeholder="e.g. RentSys Real Estate"
                                    />
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
                                        placeholder="+254 700 000 000"
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
                                        placeholder="hello@rentsys.com"
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
                                        placeholder="e.g. 07XXXXXXXX"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="company_office_hours" className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" /> Office Hours
                                    </Label>
                                    <Input
                                        id="company_office_hours"
                                        value={settings.company_office_hours || ''}
                                        onChange={(e) => handleChange('company_office_hours', e.target.value)}
                                        className="h-12 rounded-2xl border-input focus:ring-2 focus:ring-primary px-4 transition-all"
                                        placeholder="Mon-Fri from 8am to 6pm"
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
                                    placeholder="RentSys Plaza, 4th Floor, Nairobi, Kenya"
                                />
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
                                    placeholder="We'll respond within 24 hours"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border">
                                <div className="space-y-3">
                                    <Label htmlFor="hero_media_url" className="text-sm font-bold text-foreground flex items-center gap-2">
                                        Hero Background Video / Image URL
                                    </Label>
                                    <Input
                                        id="hero_media_url"
                                        value={settings.hero_media_url || ''}
                                        onChange={(e) => handleChange('hero_media_url', e.target.value)}
                                        className="h-12 rounded-2xl border-input focus:ring-2 focus:ring-primary px-4 transition-all"
                                        placeholder="/video/grok-hero.mp4"
                                    />
                                    <p className="text-xs text-muted-foreground">Default video: /video/grok-hero.mp4 (or paste MP4 / Cloudinary URL)</p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="company_footer_tagline" className="text-sm font-bold text-foreground flex items-center gap-2">
                                        Footer Tagline & Description
                                    </Label>
                                    <Input
                                        id="company_footer_tagline"
                                        value={settings.company_footer_tagline || ''}
                                        onChange={(e) => handleChange('company_footer_tagline', e.target.value)}
                                        className="h-12 rounded-2xl border-input focus:ring-2 focus:ring-primary px-4 transition-all"
                                        placeholder="The complete SaaS solution for modern property management..."
                                    />
                                </div>
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
        </div>
    );
}
