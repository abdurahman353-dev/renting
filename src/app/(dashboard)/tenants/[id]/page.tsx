"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/data/apis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2, Home, CreditCard, FileText } from "lucide-react";

export default function TenantDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [tenant, setTenant] = useState<any>(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                // Fetch tenant details
                const tenantRes = await api.get(`/tenants/${params.id}`);
                setTenant(tenantRes.data);

                // Fetch payment history (using existing endpoint if available or statement)
                try {
                    const historyRes = await api.get(`/tenants/${params.id}/payment-history`);
                    setPaymentHistory(historyRes.data);
                } catch (e) {
                    console.warn("Could not fetch payment history");
                }
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

    if (loading) return <div className="p-8">Loading tenant details...</div>;
    if (!tenant) return <div className="p-8">Tenant not found</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
                <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {tenant.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contact Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                            <FileText className="h-4 w-4 mr-2" /> Contact Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="text-muted-foreground text-sm">Email:</span>
                            <p>{tenant.email || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground text-sm">Phone:</span>
                            <p>{tenant.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground text-sm">ID Number:</span>
                            <p>{tenant.id_number}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Lease Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                            <Home className="h-4 w-4 mr-2" /> Current Unit
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {tenant.unit ? (
                            <>
                                <div>
                                    <span className="text-muted-foreground text-sm">Unit Number:</span>
                                    <p className="font-medium text-xl">{tenant.unit.unit_number}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-sm">Property:</span>
                                    <p>{tenant.unit.property?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-sm">Rent:</span>
                                    <p>KES {Number(tenant.unit.price).toLocaleString()}</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-muted-foreground italic">No unit assigned</p>
                        )}
                    </CardContent>
                </Card>

                {/* Balance Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" /> Financials
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="text-muted-foreground text-sm">Current Balance:</span>
                            <p className={`text-2xl font-bold ${Number(tenant.balance) < 0 ? 'text-red-600' : Number(tenant.balance) > 0 ? 'text-green-600' : ''}`}>
                                KES {Number(tenant.balance).toLocaleString()}
                            </p>
                            <span className="text-xs text-muted-foreground">
                                {Number(tenant.balance) < 0 ? 'Outstanding Debt' : Number(tenant.balance) > 0 ? 'Credit Balance' : 'Balanced'}
                            </span>
                        </div>
                        <Button className="w-full mt-4" variant="outline" onClick={() => router.push(`/tenants/${tenant.id}/statement`)}>
                            View Statement
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
