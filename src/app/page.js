"use client";

import { useDataStore } from '@/hooks/useDataStore';
import {
  ArrowUpRight, ArrowDownRight, DollarSign,
  FileText, Users, Receipt, TrendingUp
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import Link from 'next/link';

// Mock data generator for previewing dashboard before adding real data
const generateMockData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    name: month,
    revenue: Math.floor(Math.random() * 5000) + 2000,
    expenses: Math.floor(Math.random() * 2000) + 500
  }));
};

const mockChartData = generateMockData();

const SummaryCard = ({ title, value, icon: Icon, trend, trendValue, isPositive }) => (
  <div className="glass-panel p-6 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <span className="text-foreground/60 font-medium">{title}</span>
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-3xl font-bold">{value}</span>
      {trend && (
        <span className={`text-sm flex items-center gap-1 font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {trendValue} {trend}
        </span>
      )}
    </div>
  </div>
);

export default function Dashboard() {
  const { data: invoices, isLoaded: invoicesLoaded } = useDataStore('invoices', []);
  const { data: expenses, isLoaded: expensesLoaded } = useDataStore('expenses', []);
  const { data: clients, isLoaded: clientsLoaded } = useDataStore('clients', []);

  if (!invoicesLoaded || !expensesLoaded || !clientsLoaded) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  // Calculate summaries (using actual data if available, otherwise 0)
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0);
  const pendingRevenue = invoices.filter(i => i.status === 'Sent').reduce((sum, i) => sum + i.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Format currency
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-foreground/60 mt-1">Welcome back. Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/expenses" className="px-4 py-2 rounded-lg bg-card border border-border hover:bg-card/80 text-sm font-medium transition-colors">
            Add Expense
          </Link>
          <Link href="/invoices" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors shadow-lg shadow-primary/25">
            Create Invoice
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue || 12450)}
          icon={DollarSign}
          trend="vs last month"
          trendValue="+12.5%"
          isPositive={true}
        />
        <SummaryCard
          title="Net Profit"
          value={formatCurrency(netProfit || 8200)}
          icon={TrendingUp}
          trend="vs last month"
          trendValue="+8.2%"
          isPositive={true}
        />
        <SummaryCard
          title="Pending Invoices"
          value={formatCurrency(pendingRevenue || 3400)}
          icon={FileText}
          trend="vs last month"
          trendValue="-2.4%"
          isPositive={false}
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses || 4250)}
          icon={Receipt}
          trend="vs last month"
          trendValue="+5.1%"
          isPositive={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Revenue Overview</h2>
            <select className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary">
              <option>Last 6 months</option>
              <option>This year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fafafa' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Activity</h2>
          </div>
          <div className="flex flex-col gap-4">
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3 opacity-60">
                <FileText className="w-8 h-8" />
                <p className="text-sm">No recent invoices.<br/>Create one to get started.</p>
              </div>
            ) : (
              invoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${inv.status === 'Paid' ? 'bg-emerald-500' : inv.status === 'Sent' ? 'bg-amber-500' : 'bg-foreground/20'}`} />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">Invoice #{inv.number}</span>
                      <span className="text-xs text-foreground/50">{clients.find(c => c.id === inv.clientId)?.name || 'Unknown Client'}</span>
                    </div>
                  </div>
                  <span className="font-medium text-sm">{formatCurrency(inv.total)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
