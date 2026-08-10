"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { tenantAPI, publicAPI } from "@/data/apis";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Printer, Download } from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export default function TenantAgreementPage() {
    const params = useParams();
    const router = useRouter();
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const documentRef = useRef<HTMLDivElement>(null);
    const [companyName, setCompanyName] = useState('RentSys');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await publicAPI.getSettings();
                if (data && data.company_name) setCompanyName(data.company_name);
            } catch (err) {
                console.error('Failed to load agreement settings:', err);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const res = await tenantAPI.getById(params.id as string);
                setTenant(res);
            } catch (error) {
                console.error("Failed to fetch tenant:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchTenant();
        }
    }, [params.id]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!documentRef.current) return;
        setDownloading(true);

        try {
            const element = documentRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
            pdf.save(`Agreement_${tenant?.name || 'Tenant'}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("Failed to generate PDF.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading agreement...</div>;
    if (!tenant) return <div className="p-8 text-center text-red-500">Tenant not found</div>;

    const lease = tenant.leases?.[0];
    const propertyName = tenant.property?.name || "The Property Management";
    const unitNumber = tenant.unit?.unit_number || "Unassigned";
    const rentAmount = lease?.rent_amount || 0;
    // Format date: "14th day of February, 2026"
    const startDate = lease?.start_date ? new Date(lease.start_date) : new Date();
    const formattedDate = startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Actions Header */}
                <div className="flex items-center justify-between print:hidden">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" /> Print
                        </Button>
                        <Button onClick={handleDownloadPDF} disabled={downloading}>
                            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Download PDF
                        </Button>
                    </div>
                </div>

                {/* Agreement Document */}
                <div ref={documentRef} className="bg-white p-12 shadow-lg min-h-[1123px] text-slate-900 print:shadow-none print:p-0">
                    {/* Header */}
                    <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
                        <h1 className="text-3xl font-serif font-bold uppercase tracking-wider mb-2">Residential Tenancy Agreement</h1>
                        <p className="text-slate-500 font-serif italic">This agreement is legally binding</p>
                    </div>

                    {/* Parties */}
                    <div className="space-y-6 mb-8 font-serif">
                        <p className="leading-relaxed">
                            This Tenancy Agreement is made on this <strong>{formattedDate}</strong> between:
                        </p>

                        <div className="pl-6 border-l-4 border-slate-200 space-y-4">
                            <div>
                                <h3 className="text-sm font-bold uppercase text-slate-500 mb-1">Landlord / Property Manager</h3>
                                <p className="text-lg font-semibold">{propertyName}</p>
                                <p>P.O. BOX 1234, Nairobi, Kenya</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold uppercase text-slate-500 mb-1">Tenant</h3>
                                <p className="text-lg font-semibold">{tenant.name}</p>
                                <p>ID Number: {tenant.id_number || '____________________'}</p>
                                <p>Phone: {tenant.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Premises */}
                    <div className="mb-8 font-serif">
                        <h2 className="text-xl font-bold uppercase border-b border-slate-300 pb-2 mb-4">1. The Premises</h2>
                        <p className="leading-relaxed">
                            The Landlord agrees to let and the Tenant agrees to take specifically
                            <strong> Unit {unitNumber}</strong> located at <strong>{propertyName}</strong>
                            (hereinafter referred to as "the Premises").
                        </p>
                    </div>

                    {/* Rent & Payments */}
                    <div className="mb-8 font-serif">
                        <h2 className="text-xl font-bold uppercase border-b border-slate-300 pb-2 mb-4">2. Rent and Payments</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>The monthly rent is <strong>KES {Number(rentAmount).toLocaleString()}</strong>.</li>
                            <li>Rent is due on or before the <strong>5th day</strong> of every month.</li>
                            <li>Payments should be made via M-PESA or Bank Deposit as directed by the management.</li>
                            {tenant.agreement_amount > 0 && (
                                <li>An Agreement/Lease Fee of <strong>KES {Number(tenant.agreement_amount).toLocaleString()}</strong> is payable prior to occupation.</li>
                            )}
                        </ul>
                    </div>

                    {/* Terms */}
                    <div className="mb-8 font-serif">
                        <h2 className="text-xl font-bold uppercase border-b border-slate-300 pb-2 mb-4">3. Terms and Conditions</h2>
                        <ol className="list-decimal pl-6 space-y-2 text-sm text-justify">
                            <li>The Tenant shall keep the premises in good tenable repair and condition.</li>
                            <li>No structural alterations shall be made to the premises without prior written consent.</li>
                            <li>The Tenant shall not sublet the premises or any part thereof.</li>
                            <li>The Tenant shall not use the premises for any illegal or immoral purposes.</li>
                            <li>One month's written notice is required before vacating the premises. Failure to provide notice may result in forfeiture of deposit.</li>
                            <li>The Landlord reserves the right to inspect the premises with prior notice.</li>
                        </ol>
                    </div>

                    {/* Signatures */}
                    <div className="mt-16 pt-8 font-serif">
                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <div className="border-t border-slate-400 pt-2 mb-1"></div>
                                <p className="font-bold">Landlord / Agent Signature</p>
                                <p className="text-xs text-slate-500">For and on behalf of {propertyName}</p>
                            </div>
                            <div>
                                <div className="border-t border-slate-400 pt-2 mb-1"></div>
                                <p className="font-bold">Tenant Signature</p>
                                <p className="text-xs text-slate-500">{tenant.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-20 text-center text-xs text-slate-400 border-t pt-4">
                        <p>Generated by {companyName} System | {new Date().toISOString().split('T')[0]}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
