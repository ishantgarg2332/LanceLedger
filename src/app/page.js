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

  // Generate dynamic chart data for the last 6 months
  const generateChartData = () => {
    const data = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const monthIndex = d.getMonth();

      const monthRevenue = invoices
        .filter(inv => inv.status === 'Paid')
        .filter(inv => {
          const invDate = new Date(inv.createdAt || inv.dueDate);
          return invDate.getMonth() === monthIndex && invDate.getFullYear() === year;
        })
        .reduce((sum, inv) => sum + inv.total, 0);

      const monthExpenses = expenses
        .filter(exp => {
          const expDate = new Date(exp.date || exp.createdAt);
          return expDate.getMonth() === monthIndex && expDate.getFullYear() === year;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);

      data.push({
        name: monthName,
        revenue: monthRevenue,
        expenses: monthExpenses
      });
    }
    return data;
  };

  const chartData = generateChartData();

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
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
        />
        <SummaryCard
          title="Net Profit"
          value={formatCurrency(netProfit)}
          icon={TrendingUp}
        />
        <SummaryCard
          title="Pending Invoices"
          value={formatCurrency(pendingRevenue)}
          icon={FileText}
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon={Receipt}
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
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
            {(() => {
              const allActivity = [
                ...invoices.map(inv => ({
                  id: `inv-${inv.id}`,
                  type: 'invoice',
                  title: `Invoice #${inv.number}`,
                  subtitle: clients.find(c => c.id === inv.clientId)?.name || 'Unknown Client',
                  amount: inv.total,
                  date: new Date(inv.createdAt),
                  status: inv.status
                })),
                ...expenses.map(exp => ({
                  id: `exp-${exp.id}`,
                  type: 'expense',
                  title: exp.description || exp.category,
                  subtitle: 'Expense',
                  amount: exp.amount,
                  date: new Date(exp.createdAt || exp.date)
                }))
              ].sort((a, b) => b.date - a.date).slice(0, 5);

              if (allActivity.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-3 opacity-60">
                    <FileText className="w-8 h-8" />
                    <p className="text-sm">No recent activity.<br/>Create an invoice or expense to get started.</p>
                  </div>
                );
              }

              return allActivity.map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-card/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'expense' ? 'bg-rose-500' :
                      activity.status === 'Paid' ? 'bg-emerald-500' :
                      activity.status === 'Sent' ? 'bg-amber-500' :
                      'bg-foreground/20'
                    }`} />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{activity.title}</span>
                      <span className="text-xs text-foreground/50">{activity.subtitle}</span>
                    </div>
                  </div>
                  <span className={`font-medium text-sm ${activity.type === 'expense' ? 'text-rose-500' : ''}`}>
                    {activity.type === 'expense' ? '-' : '+'}{formatCurrency(activity.amount)}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
