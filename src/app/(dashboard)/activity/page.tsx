'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { superAdminAPI } from '@/data/apis';

type Log = {
    id: string;
    admin: string;
    action: string;
    details: string;
    severity: 'Normal' | 'Warning' | 'Critical';
    timestamp: string;
};

const mockLogs: Log[] = [
    { id: '1', admin: "Alice Smith", action: "Login", details: "Successful login from IP 192.168.1.1", severity: "Normal", timestamp: "2024-03-15 09:30 AM" },
    { id: '2', admin: "Bob Jones", action: "Delete Tenant", details: "Deleted tenant record ID #4421", severity: "Warning", timestamp: "2024-03-15 10:15 AM" },
    { id: '3', admin: "Charlie Day", action: "Failed Login", details: "3 failed attempts detected", severity: "Critical", timestamp: "2024-03-14 11:20 PM" },
    { id: '4', admin: "Alice Smith", action: "Update Property", details: "Changed rent price for Unit 4B", severity: "Normal", timestamp: "2024-03-14 04:45 PM" },
    { id: '5', admin: "System", action: "Database Backup", details: "Automated daily backup completed", severity: "Normal", timestamp: "2024-03-14 02:00 AM" },
];

export default function ActivityLogsPage() {
    const { isSuperAdmin, loading } = useAuth();
    const router = useRouter();
    const [activityLogs, setActivityLogs] = useState<Log[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!loading && !isSuperAdmin()) {
            router.replace('/dashboard');
        }
    }, [isSuperAdmin, loading, router]);

    const fetchActivityLogs = async () => {
        try {
            const response = await superAdminAPI.getActivityLogs()
            // Ensure response is an array before setting state
            if (Array.isArray(response)) {
                setActivityLogs(response);
            } else {
                console.error('Expected array for activity logs, got:', response);
                setActivityLogs([]);
            }
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
            setActivityLogs([]);
        }
    };

    useEffect(() => {
        if (isSuperAdmin()) {
            fetchActivityLogs();
        }
    }, [isSuperAdmin]);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!isSuperAdmin()) return null;

    const filteredLogs = activityLogs.filter(log =>
        log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">System Activity Logs</h2>
                    <p className="text-muted-foreground mt-2">Monitor administrator actions and system events.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline">
                        <Calendar className="mr-2 h-4 w-4" /> Date Range
                    </Button>
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search logs by admin or action..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 max-w-sm"
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Audit Trail</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Admin</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Severity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{log.timestamp}</TableCell>
                                    <TableCell className="font-medium">{log.admin}</TableCell>
                                    <TableCell>{log.action}</TableCell>
                                    <TableCell className="text-muted-foreground">{log.details}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            log.severity === 'Critical' ? 'destructive' :
                                                log.severity === 'Warning' ? 'secondary' : 'outline'
                                        }
                                            className={log.severity === 'Warning' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : ''}
                                        >
                                            {log.severity}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
