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
import { activityAPI, adminAPI } from '@/data/apis';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useDebounce } from "@/hooks/use-debounce";

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
    const [adminFilter, setAdminFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');
    const [admins, setAdmins] = useState<string[]>([]);
    const [actions, setActions] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [perPage] = useState(20);
    const debouncedSearch = useDebounce(searchTerm, 500);

    const fetchActivityLogs = async (page = 1) => {
        setLoading(true);
        try {
            const params: any = {
                page,
                per_page: perPage,
                search: debouncedSearch,
            };
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            if (severityFilter !== 'all') params.severity = severityFilter;

            // Fetch both logs and admins in parallel
            const [response, allAdminsResponse] = await Promise.all([
                activityAPI.getActivityLogs(params),
                adminAPI.getAdmins()
            ]);

            if (response && response.data) {
                setActivityLogs(response.data);
                setCurrentPage(response.current_page);
                setLastPage(response.last_page);
                setTotalItems(response.total);

                // Extract unique action types from logs
                const uniqueActions = Array.from(
                    new Set(
                        response.data
                            .map((log: any) => log?.action)
                            .filter((action: any) => Boolean(action && typeof action === 'string' && action.trim()))
                    )
                ) as string[];
                setActions(uniqueActions.sort());
            }

            const allAdmins = allAdminsResponse?.data || allAdminsResponse || [];
            if (Array.isArray(allAdmins)) {
                const registeredAdminNames = Array.from(
                    new Set(
                        allAdmins
                            .map((admin: any) => admin?.name)
                            .filter((name: any) => Boolean(name && typeof name === 'string' && name.trim()))
                    )
                ) as string[];
                setAdmins(registeredAdminNames.sort());
            }
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        fetchActivityLogs(page);
    };

    useEffect(() => {
        if (!authLoading) {
            fetchActivityLogs(1);
        }
    }, [authLoading, startDate, endDate, debouncedSearch, severityFilter, adminFilter, actionFilter]);

    if (authLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }



    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 bg-muted/40 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">System Activity Logs</h2>
                    <p className="text-muted-foreground mt-1">Monitor administrator actions and system events.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        setSearchTerm('');
                        setSeverityFilter('all');
                        setAdminFilter('all');
                        setActionFilter('all');
                    }} title="Clear all filters">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-background border-input w-full"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full">
                    <div className="flex flex-wrap items-center gap-2 bg-background border border-input rounded-lg px-3 py-1 min-w-0">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                            type="date"
                            className="border-0 bg-transparent h-8 focus-visible:ring-0 p-0 text-sm w-[130px] min-w-[100px]"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-muted-foreground text-sm">to</span>
                        <Input
                            type="date"
                            className="border-0 bg-transparent h-8 focus-visible:ring-0 p-0 text-sm w-[130px] min-w-[100px]"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                        <SelectTrigger className="bg-background border-input w-full sm:w-[140px]">
                            <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Severities</SelectItem>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Warning">Warning</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={adminFilter} onValueChange={setAdminFilter}>
                        <SelectTrigger className="bg-background border-input w-full sm:w-[160px]">
                            <SelectValue placeholder="Admin" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Admins</SelectItem>
                            {admins.map((admin, index) => (
                                <SelectItem key={`admin-${index}-${admin}`} value={admin}>{admin}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="bg-background border-input w-full sm:w-[160px]">
                            <SelectValue placeholder="Action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            {actions.map((action, index) => (
                                <SelectItem key={`action-${index}-${action}`} value={action}>{action}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-border shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/50 border-b border-border">
                    <CardTitle className="text-lg">Audit Trail</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-y-auto overflow-x-auto relative">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
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
                                ) : activityLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No logs found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activityLogs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                                {log.timestamp}
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">{log.admin}</TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium uppercase tracking-wider">
                                                    {log.action}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground max-w-md truncate" title={log.details}>
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
                    </div>
                </CardContent>
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={lastPage}
                    onPageChange={handlePageChange}
                    totalItems={totalItems}
                    itemsPerPage={perPage}
                />
            </Card>
        </div>
    );
}
