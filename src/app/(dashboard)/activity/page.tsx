'use client';

import { useState, useEffect } from 'react';
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
import { Search, Filter, Calendar, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { superAdminAPI } from '@/data/apis';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Log = {
    id: string;
    admin: string;
    action: string;
    details: string;
    severity: 'Normal' | 'Warning' | 'Critical';
    timestamp: string;
};

export default function ActivityLogsPage() {
    const { isSuperAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [activityLogs, setActivityLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (!authLoading && !isSuperAdmin()) {
            router.replace('/dashboard');
        }
    }, [isSuperAdmin, authLoading, router]);

    const fetchActivityLogs = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const data = await superAdminAPI.getActivityLogs(params);
            if (Array.isArray(data)) {
                setActivityLogs(data);
            }
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isSuperAdmin()) {
            fetchActivityLogs();
        }
    }, [isSuperAdmin, startDate, endDate]);

    if (authLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!isSuperAdmin()) return null;

    const filteredLogs = activityLogs.filter(log => {
        const matchesSearch =
            log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;

        return matchesSearch && matchesSeverity;
    });

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">System Activity Logs</h2>
                    <p className="text-muted-foreground mt-1">Monitor administrator actions and system events.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        setSearchTerm('');
                        setSeverityFilter('all');
                    }} title="Clear all filters">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-4">
                <div className="relative flex-1 w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-slate-50 border-slate-200"
                    />
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <Input
                            type="date"
                            className="border-0 bg-transparent h-8 focus-visible:ring-0 p-0 text-sm w-[130px]"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-slate-300">to</span>
                        <Input
                            type="date"
                            className="border-0 bg-transparent h-8 focus-visible:ring-0 p-0 text-sm w-[130px]"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                        <SelectTrigger className="bg-slate-50 border-slate-200 w-[140px]">
                            <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Severities</SelectItem>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Warning">Warning</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-lg">Audit Trail</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                <TableHead className="font-semibold w-[180px]">Timestamp</TableHead>
                                <TableHead className="font-semibold w-[150px]">Admin</TableHead>
                                <TableHead className="font-semibold w-[150px]">Action</TableHead>
                                <TableHead className="font-semibold">Details</TableHead>
                                <TableHead className="font-semibold w-[120px]">Severity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Loading activities...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No logs found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                                            {log.timestamp}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">{log.admin}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium uppercase tracking-wider">
                                                {log.action}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-600 max-w-md truncate" title={log.details}>
                                            {log.details}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                log.severity === 'Critical' ? 'destructive' :
                                                    log.severity === 'Warning' ? 'secondary' : 'outline'
                                            }
                                                className={
                                                    log.severity === 'Warning' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' :
                                                        log.severity === 'Normal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : ''
                                                }
                                            >
                                                {log.severity}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
