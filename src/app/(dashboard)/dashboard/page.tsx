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
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {(stats?.revenue ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTenants}</div>
            <p className="text-xs text-muted-foreground">{stats.tenantsGrowth > 0 ? '+' : ''}{stats.tenantsGrowth}% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.occupancyGrowth > 0 ? '+' : ''}{stats.occupancyGrowth}% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingIssues}</div>
            <p className="text-xs text-muted-foreground">{stats.issuesChange > 0 ? '+' : ''}{stats.issuesChange} since yesterday</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {/* Chart Placeholder - would be Recharts component here */}
            <div className="h-[200px] flex items-center justify-center bg-slate-100 rounded-md">
              <p className="text-slate-500">Revenue Chart (Connecting to DB...)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {activities.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent activity</div>
              ) : (
                activities.map((item) => (
                  <div key={item.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    {item.amount && (
                      <div className="ml-auto font-medium text-green-600">
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
