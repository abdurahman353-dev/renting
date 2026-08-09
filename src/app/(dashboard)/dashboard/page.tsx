"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Home, AlertCircle, TrendingUp, Building2, Activity, Shield, AlertTriangle, Info } from "lucide-react";
import { dashboardAPI } from "@/data/apis";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DashboardStats {
  revenue: number;
  revenueGrowth: number;
  activeTenants: number;
  tenantsGrowth: number;
  occupancyRate: number;
  occupancyGrowth: number;
  pendingIssues: number;
  issuesChange: number;
  totalProperties?: number;
}

interface ActivityItem {
  id: number | string;
  title: string;
  description: string;
  amount?: number;
  created_at: string;
  severity?: string;
  user?: string;
}

interface ChartData {
  month: string;
  revenue: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0, revenueGrowth: 0,
    activeTenants: 0, tenantsGrowth: 0,
    occupancyRate: 0, occupancyGrowth: 0,
    pendingIssues: 0, issuesChange: 0,
    totalProperties: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartView, setChartView] = useState<'Monthly' | 'Yearly'>('Monthly');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes, chartRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentActivity(),
          dashboardAPI.getRevenueChart()
        ]);

        setStats(prev => ({ ...prev, ...(statsRes || {}) }));
        setActivities(Array.isArray(activityRes) ? activityRes : []);
        setChartData(Array.isArray(chartRes) ? chartRes : []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
        setChartLoading(false);
      }
    };

    fetchData();
  }, []);

  const getAggregatedData = () => {
    if (chartView === 'Monthly') {
      return chartData.map(item => ({
        ...item,
        revenue: Number(item.revenue)
      }));
    }

    // Aggregate by year
    const yearlyMap: { [key: string]: number } = {};
    chartData.forEach(item => {
      // Robust year extraction: "M Y" -> "Y"
      const parts = item.month.split(' ');
      const year = parts.length > 1 ? parts[parts.length - 1] : item.month;
      // Use Number() to prevent string concatenation (0 + "12" = "012")
      yearlyMap[year] = (yearlyMap[year] || 0) + Number(item.revenue);
    });

    // Explicitly sort keys to ensure chronological order
    return Object.keys(yearlyMap)
      .sort((a, b) => a.localeCompare(b))
      .map(year => ({
        month: year,
        revenue: yearlyMap[year]
      }));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-muted/40 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
            Dashboard
          </h2>
          <p className="text-muted-foreground dark:text-white mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="bg-card p-2 rounded-xl shadow-sm border border-border flex items-center gap-2 px-4 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">Live Updates</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="border-none shadow-lg shadow-emerald-100/10 bg-card overflow-hidden group hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 cursor-pointer">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Revenue</CardTitle>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              KES {(stats?.revenue ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center mt-3">
              <div className={`flex items-center gap-1 text-[10px] font-black ${stats.revenueGrowth >= 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400' : 'text-red-500 bg-red-50 dark:bg-red-950/30 dark:text-red-400'} px-2 py-1 rounded-full border border-emerald-100/50 dark:border-emerald-900/50`}>
                <TrendingUp className="h-3 w-3" />
                {stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth}%
              </div>
              <span className="text-[10px] text-muted-foreground ml-2 font-bold uppercase tracking-tighter">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Tenants */}
        <Card className="border-none shadow-lg shadow-blue-100/10 bg-card overflow-hidden group hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 cursor-pointer">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Tenants</CardTitle>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">
              {stats.activeTenants}
            </div>
            <div className="flex items-center mt-3">
              <div className={`flex items-center gap-1 text-[10px] font-black ${stats.tenantsGrowth >= 0 ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400' : 'text-red-500 bg-red-50 dark:bg-red-950/30 dark:text-red-400'} px-2 py-1 rounded-full border border-blue-100/50 dark:border-blue-900/50`}>
                <TrendingUp className="h-3 w-3" />
                {stats.tenantsGrowth > 0 ? '+' : ''}{stats.tenantsGrowth}
              </div>
              <span className="text-[10px] text-muted-foreground ml-2 font-bold uppercase tracking-tighter">all time</span>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Rate */}
        <Card className="border-none shadow-lg shadow-violet-100/10 bg-card overflow-hidden group hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 cursor-pointer">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Occupancy Rate</CardTitle>
            <div className="p-2.5 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-2xl group-hover:bg-violet-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <Home className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-violet-600 dark:text-violet-400">
              {stats.occupancyRate}%
            </div>
            <div className="flex items-center mt-3">
              <div className={`flex items-center gap-1 text-[10px] font-black ${stats.occupancyGrowth >= 0 ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-400' : 'text-red-500 bg-red-50 dark:bg-red-950/30 dark:text-red-400'} px-2 py-1 rounded-full border border-violet-100/50 dark:border-violet-900/50`}>
                <TrendingUp className="h-3 w-3" />
                {stats.occupancyGrowth > 0 ? '+' : ''}{stats.occupancyGrowth}%
              </div>
              <span className="text-[10px] text-muted-foreground ml-2 font-bold uppercase tracking-tighter">all time</span>
            </div>
          </CardContent>
        </Card>

        {/* Properties */}
        <Card onClick={() => router.push('/properties')} className="border-none shadow-lg shadow-amber-100/10 bg-card overflow-hidden group hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 cursor-pointer">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">PROPERTIES</CardTitle>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              {stats.totalProperties || 0}
            </div>
            <div className="flex items-center mt-3">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Total Properties managed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-xl shadow-slate-200/10 bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-foreground">Revenue Analytics</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Real-time performance insights</p>
            </div>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg border border-border">
              <div
                onClick={() => setChartView('Yearly')}
                className={`px-3 py-1 rounded-md shadow-sm text-xs font-bold cursor-pointer transition-all ${chartView === 'Yearly' ? 'bg-background text-primary shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Yearly
              </div>
              <div
                onClick={() => setChartView('Monthly')}
                className={`px-3 py-1 rounded-md shadow-sm text-xs font-bold cursor-pointer transition-all ${chartView === 'Monthly' ? 'bg-background text-primary shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Monthly
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[350px] w-full">
              {chartLoading ? (
                <div className="h-full flex flex-col items-center justify-center bg-muted/40 rounded-3xl border-2 border-dashed border-border animate-pulse">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <DollarSign className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Revenue Analytics</h3>
                  <p className="text-muted-foreground font-medium mt-1">Chart data loading...</p>
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getAggregatedData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <filter id="shadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                      tickFormatter={(value) => `KES ${value >= 1000 ? (value / 1000) + 'k' : value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderRadius: '16px',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        padding: '12px',
                        backdropFilter: 'blur(8px)',
                        color: 'hsl(var(--foreground))'
                      }}
                      itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                      formatter={(value: number) => [
                        new Intl.NumberFormat('en-KE', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 2
                        }).format(value),
                        'Revenue'
                      ]}
                      cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={4}
                      fillOpacity={0.1}
                      fill="#6366f1"
                      animationDuration={2500}
                      activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-muted/40 rounded-3xl border-2 border-dashed border-border">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No revenue data available yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-xl shadow-slate-200/10 bg-card flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold text-foreground">Recent Activity</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Latest system events</p>
            </div>
            <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center border border-border">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden pt-4">
            <div className="h-[350px] overflow-y-auto pr-4 space-y-6 custom-scrollbar">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No recent activity found</p>
                </div>
              ) : (
                activities.map((item) => {
                  const getSeverityConfig = (severity?: string, title?: string) => {
                    if (severity === 'Critical') return { icon: AlertTriangle, color: 'red' };
                    if (severity === 'Warning') return { icon: AlertCircle, color: 'amber' };
                    if (title?.includes('Login') || title?.includes('Logout')) return { icon: Shield, color: 'blue' };
                    if (title?.includes('Payment')) return { icon: DollarSign, color: 'emerald' };
                    if (title?.includes('Admin') || title?.includes('Create') || title?.includes('Update')) return { icon: Users, color: 'violet' };
                    return { icon: Activity, color: 'slate' };
                  };

                  const config = getSeverityConfig(item.severity, item.title);
                  const Icon = config.icon;
                  const colorClass = {
                    red: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900 group-hover:bg-red-600',
                    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900 group-hover:bg-amber-600',
                    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900 group-hover:bg-blue-600',
                    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900 group-hover:bg-emerald-600',
                    violet: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900 group-hover:bg-violet-600',
                    slate: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700 group-hover:bg-slate-600',
                  }[config.color];

                  return (
                    <div key={item.id} className="flex items-start group relative pb-2">
                      <div className="mt-1 relative z-10">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${colorClass} group-hover:text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="ml-4 space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.user && (
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                              by {item.user}
                            </span>
                          )}
                          {item.severity && item.severity !== 'Normal' && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.severity === 'Critical' ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' :
                              item.severity === 'Warning' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' :
                                'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                              }`}>
                              {item.severity}
                            </span>
                          )}
                        </div>
                        {item.amount && (
                          <div className="inline-block mt-1 font-extrabold text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900">
                            +KES {item.amount.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground));
          opacity: 0.5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--accent));
        }
      `}</style>
    </div>
  );
}
