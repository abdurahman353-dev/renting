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
    if (chartView === 'Monthly') return chartData;

    // Aggregate by year
    const yearlyMap: { [key: string]: number } = {};
    chartData.forEach(item => {
      const year = item.month.split(' ').pop() || item.month;
      yearlyMap[year] = (yearlyMap[year] || 0) + item.revenue;
    });

    return Object.keys(yearlyMap).map(year => ({
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
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Dashboard
          </h2>
          <p className="text-slate-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 px-4" onClick={() => router.push('/dashboard')}>
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-slate-600">Live Updates</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="border-none shadow-lg shadow-emerald-100/50 bg-white overflow-hidden group hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 cursor-pointer">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Revenue</CardTitle>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
              KES {(stats?.revenue ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center mt-3">
              <div className={`flex items-center gap-1 text-[10px] font-black ${stats.revenueGrowth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'} px-2 py-1 rounded-full border border-emerald-100/50`}>
                <TrendingUp className="h-3 w-3" />
                {stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth}%
              </div>
              <span className="text-[10px] text-slate-400 ml-2 font-bold uppercase tracking-tighter">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Tenants */}
        <Card className="border-none shadow-lg shadow-blue-100/50 bg-white overflow-hidden group hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 cursor-pointer">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Tenants</CardTitle>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
              {stats.activeTenants}
            </div>
            <div className="flex items-center mt-3">
              <div className={`flex items-center gap-1 text-[10px] font-black ${stats.tenantsGrowth >= 0 ? 'text-blue-600 bg-blue-50' : 'text-red-500 bg-red-50'} px-2 py-1 rounded-full border border-blue-100/50`}>
                <TrendingUp className="h-3 w-3" />
                {stats.tenantsGrowth > 0 ? '+' : ''}{stats.tenantsGrowth}%
              </div>
              <span className="text-[10px] text-slate-400 ml-2 font-bold uppercase tracking-tighter">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Rate */}
        <Card className="border-none shadow-lg shadow-violet-100/50 bg-white overflow-hidden group hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 cursor-pointer">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Occupancy Rate</CardTitle>
            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-2xl group-hover:bg-violet-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <Home className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-500">
              {stats.occupancyRate}%
            </div>
            <div className="flex items-center mt-3">
              <div className={`flex items-center gap-1 text-[10px] font-black ${stats.occupancyGrowth >= 0 ? 'text-violet-600 bg-violet-50' : 'text-red-500 bg-red-50'} px-2 py-1 rounded-full border border-violet-100/50`}>
                <TrendingUp className="h-3 w-3" />
                {stats.occupancyGrowth > 0 ? '+' : ''}{stats.occupancyGrowth}%
              </div>
              <span className="text-[10px] text-slate-400 ml-2 font-bold uppercase tracking-tighter">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Properties */}
        <Card className="border-none shadow-lg shadow-amber-100/50 bg-white overflow-hidden group hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 cursor-pointer">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">PROPERTIES</CardTitle>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-500">
              {stats.totalProperties || 0}
            </div>
            <div className="flex items-center mt-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Total Properties managed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-xl shadow-slate-200/50 bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">Revenue Analytics</CardTitle>
              <p className="text-sm text-slate-400 mt-1 font-medium">Real-time performance insights</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
              <div
                onClick={() => setChartView('Yearly')}
                className={`px-3 py-1 rounded-md shadow-sm text-xs font-bold cursor-pointer transition-all ${chartView === 'Yearly' ? 'bg-white text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Yearly
              </div>
              <div
                onClick={() => setChartView('Monthly')}
                className={`px-3 py-1 rounded-md shadow-sm text-xs font-bold cursor-pointer transition-all ${chartView === 'Monthly' ? 'bg-white text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Monthly
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[350px] w-full">
              {chartLoading ? (
                <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 animate-pulse">
                  <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">Revenue Analytics</h3>
                  <p className="text-slate-400 font-medium mt-1">Chart data loading...</p>
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getAggregatedData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="50%" stopColor="#6366f1" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorRevenueStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                      tickFormatter={(value) => `KES ${value >= 1000 ? (value / 1000) + 'k' : value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '16px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        padding: '12px',
                        backdropFilter: 'blur(8px)'
                      }}
                      itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                      formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Revenue']}
                      cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="url(#colorRevenueStroke)"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      animationDuration={2500}
                      activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-medium">No revenue data available yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-xl shadow-slate-200/50 bg-white flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">Recent Activity</CardTitle>
              <p className="text-sm text-slate-400 mt-1 font-medium">Latest system events</p>
            </div>
            <div className="h-8 w-8 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden pt-4">
            <div className="h-[350px] overflow-y-auto pr-4 space-y-6 custom-scrollbar">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-medium">No recent activity found</p>
                </div>
              ) : (
                activities.map((item) => {
                  // Determine icon and color based on severity or action type
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
                    red: 'bg-red-50 text-red-600 border-red-100 group-hover:bg-red-600',
                    amber: 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-600',
                    blue: 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600',
                    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600',
                    violet: 'bg-violet-50 text-violet-600 border-violet-100 group-hover:bg-violet-600',
                    slate: 'bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-slate-600',
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
                          <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 font-medium line-clamp-1">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.user && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              by {item.user}
                            </span>
                          )}
                          {item.severity && item.severity !== 'Normal' && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.severity === 'Critical' ? 'bg-red-100 text-red-600' :
                              item.severity === 'Warning' ? 'bg-amber-100 text-amber-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                              {item.severity}
                            </span>
                          )}
                        </div>
                        {item.amount && (
                          <div className="inline-block mt-1 font-extrabold text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
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
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
