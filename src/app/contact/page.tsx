'use client';

import { useState, useEffect } from 'react';
import { LandingNavbar } from '@/components/landing-navbar';
import { LandingFooter } from '@/components/landing-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
    Mail,
    Phone,
    MapPin,
    MessageSquare,
    Send,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { publicAPI } from '@/data/apis';
import { toast } from 'sonner';

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [settings, setSettings] = useState<any>({
        company_phone: '',
        company_email: '',
        company_address: '',
        company_office_hours: '',
        company_response_time: ""
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await publicAPI.getSettings();
                if (data) setSettings((prev: any) => ({ ...prev, ...data }));
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate phone number length specifically
        if (formData.phone.length !== 10) {
            toast.error('Phone number must be exactly 10 digits');
            return;
        }

        setIsSubmitting(true);
        try {
            await publicAPI.submitContactForm(formData);
            setIsSubmitted(true);
            toast.success('Message sent successfully! We will get back to you soon.');
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        } catch (error) {
            toast.error('Failed to send message. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;

        if (id === 'phone') {
            // Only allow numbers
            const numericValue = value.replace(/\D/g, '');

            // Limit to 10 digits
            if (numericValue.length > 10) return;

            setFormData(prev => ({ ...prev, [id]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <LandingNavbar />

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4">
                    {/* Header Section */}
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                            Get in <span className="text-blue-600">Touch</span>
                        </h1>
                        <p className="text-lg text-slate-600 font-medium">
                            Have questions about our properties or services? Our team is here to help you find the perfect rental solution.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
                        {/* Contact Info Cards */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                                <CardContent className="p-8">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                            <Phone className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">Call Us</h3>
                                            <p className="text-slate-600 font-medium">{settings.company_phone}</p>
                                            <p className="text-slate-500 text-sm mt-1">{settings.company_office_hours}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                                <CardContent className="p-8">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                                            <Mail className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">Email Us</h3>
                                            <p className="text-slate-600 font-medium">{settings.company_email}</p>
                                            <p className="text-slate-500 text-sm mt-1">{settings.company_response_time}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                                <CardContent className="p-8">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">Our Office</h3>
                                            <p className="text-slate-600 font-medium">{settings.company_address}</p>
                                            <p className="text-slate-500 text-sm mt-1">Contact for directions</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <Card className="border-slate-100 shadow-xl rounded-3xl overflow-hidden">
                                <CardContent className="p-8 md:p-12">
                                    {isSubmitted ? (
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <CheckCircle2 className="w-10 h-10" />
                                            </div>
                                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Message Sent!</h2>
                                            <p className="text-slate-600 text-lg mb-8">
                                                Thank you for reaching out. A member of our team will contact you shortly.
                                            </p>
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsSubmitted(false)}
                                                className="rounded-xl px-8"
                                            >
                                                Send Another Message
                                            </Button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name" className="text-slate-700 font-bold">Full Name</Label>
                                                    <Input
                                                        id="name"
                                                        placeholder="John Doe"
                                                        className="h-12 rounded-xl border-slate-200 focus:ring-blue-500"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-slate-700 font-bold">Email Address</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        placeholder="john@example.com"
                                                        className="h-12 rounded-xl border-slate-200 focus:ring-blue-500"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="text-slate-700 font-bold">Phone Number (Required for WhatsApp)</Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="07XX or 01XX XXX XXX"
                                                    className="h-12 rounded-xl border-slate-200 focus:ring-blue-500"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="subject" className="text-slate-700 font-bold">Subject</Label>
                                                <Input
                                                    id="subject"
                                                    placeholder="How can we help?"
                                                    className="h-12 rounded-xl border-slate-200 focus:ring-blue-500"
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="message" className="text-slate-700 font-bold">Message</Label>
                                                <Textarea
                                                    id="message"
                                                    placeholder="Tell us more about your inquiry..."
                                                    className="min-h-[150px] rounded-xl border-slate-200 focus:ring-blue-500 py-4"
                                                    value={formData.message}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Clock className="w-5 h-5 mr-2 animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5 mr-2" />
                                                        Send Message
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}
