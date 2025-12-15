"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Home, AlertCircle } from "lucide-react";
import { dashboardAPI } from "@/data/apis";

interface DashboardStats {
  revenue: number;
  revenueGrowth: number;
  activeTenants: number;
  tenantsGrowth: number;
  occupancyRate: number;
  occupancyGrowth: number;
  pendingIssues: number;
  issuesChange: number;
}

interface ActivityItem {
  id: number;
  title: string;
  description: string;
  amount?: number;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0, revenueGrowth: 0,
    activeTenants: 0, tenantsGrowth: 0,
    occupancyRate: 0, occupancyGrowth: 0,
    pendingIssues: 0, issuesChange: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          // api.get('/dashboard/stats'),
          dashboardAPI.getStats(),
          dashboardAPI.getRecentActivity(),
          // api.get('/dashboard/recent-activity')
        ]);

        // Ensure we have a valid object, merge with existing defaults to be safe
        setStats(prev => ({ ...prev, ...(statsRes || {}) }));
        setActivities(Array.isArray(activityRes) ? activityRes : []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // Fallback to zeros or show error state if needed
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Dashboard
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="border-emerald-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-full">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              KES {(stats?.revenue ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center mt-1">
              <span className={`text-xs font-medium ${stats.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'} bg-emerald-50 px-2 py-0.5 rounded-full`}>
                {stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth}%
              </span>
              <span className="text-xs text-muted-foreground ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Tenants */}
        <Card className="border-blue-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tenants</CardTitle>
            <div className="p-2 bg-blue-100 rounded-full">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {stats.activeTenants}
            </div>
            <div className="flex items-center mt-1">
              <span className={`text-xs font-medium ${stats.tenantsGrowth >= 0 ? 'text-blue-600' : 'text-red-500'} bg-blue-50 px-2 py-0.5 rounded-full`}>
                {stats.tenantsGrowth > 0 ? '+' : ''}{stats.tenantsGrowth}%
              </span>
              <span className="text-xs text-muted-foreground ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Rate */}
        <Card className="border-violet-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Rate</CardTitle>
            <div className="p-2 bg-violet-100 rounded-full">
              <Home className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {stats.occupancyRate}%
            </div>
            <div className="flex items-center mt-1">
              <span className={`text-xs font-medium ${stats.occupancyGrowth >= 0 ? 'text-violet-600' : 'text-red-500'} bg-violet-50 px-2 py-0.5 rounded-full`}>
                {stats.occupancyGrowth > 0 ? '+' : ''}{stats.occupancyGrowth}%
              </span>
              <span className="text-xs text-muted-foreground ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Issues */}
        <Card className="border-amber-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Issues</CardTitle>
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {stats.pendingIssues}
            </div>
            <div className="flex items-center mt-1">
              <span className={`text-xs font-medium ${stats.issuesChange <= 0 ? 'text-emerald-600' : 'text-amber-600'} bg-amber-50 px-2 py-0.5 rounded-full`}>
                {stats.issuesChange > 0 ? '+' : ''}{stats.issuesChange}
              </span>
              <span className="text-xs text-muted-foreground ml-2">since yesterday</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-slate-100 shadow-lg shadow-slate-100/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-800">Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {/* Chart Placeholder - would be Recharts component here */}
            <div className="h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl border border-dashed border-slate-200 m-4">
              <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <DollarSign className="h-8 w-8 text-indigo-400" />
              </div>
              <p className="text-slate-500 font-medium">Revenue Analytics</p>
              <p className="text-sm text-slate-400 mt-1">Chart data loading...</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-indigo-50 shadow-lg shadow-indigo-100/20">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-800">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8 pr-4">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                activities.map((item) => (
                  <div key={item.id} className="flex items-start group">
                    <div className="mt-1 relative">
                      <div className="absolute inset-0 bg-indigo-200 blur-sm rounded-full opacity-0 group-hover:opacity-50 transition-opacity" />
                      <div className="relative h-9 w-9 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-100">
                        <Users className="h-4 w-4" /> {/* Or dynamic icon based on type */}
                      </div>
                    </div>

                    <div className="ml-4 space-y-1 flex-1">
                      <p className="text-sm font-semibold text-slate-800 leading-none group-hover:text-indigo-700 transition-colors cursor-default">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {item.description}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {item.amount && (
                      <div className="ml-auto font-bold text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                        +KES {item.amount.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
