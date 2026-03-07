"use client";

import { useState } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import UpgradeBanner from '@/components/UpgradeBanner';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#64748b'];

export default function ReportsPage() {
  const { data: invoices, isLoaded: invoicesLoaded } = useDataStore('invoices', []);
  const { data: expenses, isLoaded: expensesLoaded } = useDataStore('expenses', []);
  const { data: clients, isLoaded: clientsLoaded } = useDataStore('clients', []);
  const { data: settings } = useDataStore('settings', []);
  const [timeRange, setTimeRange] = useState('year'); // 'month', 'year', 'all'

  const currencySymbol = settings[0]?.currencySymbol || '$';

  if (!invoicesLoaded || !expensesLoaded || !clientsLoaded) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  const isPro = settings[0]?.planType === 'pro';

  if (!isPro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-2xl mx-auto w-full">
        <UpgradeBanner
          title="Premium Analytics"
          description="Unlock detailed reports, profit margins, and exportable financial data with LanceLedger Pro."
        />
      </div>
    );
  }

  // Filter data based on time range
  const filterByDate = (dateString) => {
    if (timeRange === 'all') return true;

    const date = new Date(dateString);
    const now = new Date();

    if (timeRange === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }

    if (timeRange === 'year') {
      return date.getFullYear() === now.getFullYear();
    }

    return true;
  };

  const filteredInvoices = invoices.filter(inv => filterByDate(inv.createdAt));
  const filteredExpenses = expenses.filter(exp => filterByDate(exp.date));

  // Calculate totals
  const totalRevenue = filteredInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Prepare chart data: Revenue by Client
  const revenueByClientMap = {};
  filteredInvoices.filter(i => i.status === 'Paid').forEach(inv => {
    const clientName = clients.find(c => c.id === inv.clientId)?.name || 'Unknown';
    revenueByClientMap[clientName] = (revenueByClientMap[clientName] || 0) + inv.total;
  });

  const revenueByClientData = Object.entries(revenueByClientMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 clients

  // Prepare chart data: Expenses by Category
  const expenseByCategoryMap = {};
  filteredExpenses.forEach(exp => {
    expenseByCategoryMap[exp.category] = (expenseByCategoryMap[exp.category] || 0) + exp.amount;
  });

  const expenseByCategoryData = Object.entries(expenseByCategoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Prepare chart data: Monthly P&L (if year or all time)
  const monthlyDataMap = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Initialize months
  if (timeRange === 'year') {
    months.forEach(m => monthlyDataMap[m] = { name: m, revenue: 0, expenses: 0 });
  }

  filteredInvoices.filter(i => i.status === 'Paid').forEach(inv => {
    const d = new Date(inv.createdAt);
    const month = months[d.getMonth()];
    const key = timeRange === 'all' ? `${month} ${d.getFullYear()}` : month;

    if (!monthlyDataMap[key]) monthlyDataMap[key] = { name: key, revenue: 0, expenses: 0 };
    monthlyDataMap[key].revenue += inv.total;
  });

  filteredExpenses.forEach(exp => {
    const d = new Date(exp.date);
    const month = months[d.getMonth()];
    const key = timeRange === 'all' ? `${month} ${d.getFullYear()}` : month;

    if (!monthlyDataMap[key]) monthlyDataMap[key] = { name: key, revenue: 0, expenses: 0 };
    monthlyDataMap[key].expenses += exp.amount;
  });

  const monthlyData = Object.values(monthlyDataMap);

  const formatCurrency = (val) => `${currencySymbol}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}`;

  const handleExportCSV = () => {
    // Generate simple P&L CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Type,Date,Description,Amount\n";

    filteredInvoices.filter(i => i.status === 'Paid').forEach(inv => {
      const clientName = clients.find(c => c.id === inv.clientId)?.name || 'Unknown';
      csvContent += `Revenue,${new Date(inv.createdAt).toISOString().split('T')[0]},Invoice #${inv.number} - ${clientName},${inv.total}\n`;
    });

    filteredExpenses.forEach(exp => {
      csvContent += `Expense,${new Date(exp.date).toISOString().split('T')[0]},${exp.category} - ${exp.description},-${exp.amount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tracker_report_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-foreground/60 mt-1">Detailed insights into your business performance.</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-card border border-border rounded-lg px-4 py-2 text-sm outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors shadow-lg shadow-primary/25"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex flex-col gap-2">
          <div className="text-foreground/60 font-medium text-sm">Total Revenue</div>
          <div className="text-3xl font-bold flex items-center gap-2">
            {formatCurrency(totalRevenue)}
          </div>
        </div>
        <div className="glass-panel p-6 flex flex-col gap-2">
          <div className="text-foreground/60 font-medium text-sm">Total Expenses</div>
          <div className="text-3xl font-bold">{formatCurrency(totalExpenses)}</div>
        </div>
        <div className={`glass-panel p-6 flex flex-col gap-2 relative overflow-hidden`}>
          <div className={`absolute inset-0 opacity-10 ${netProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <div className="relative z-10 flex items-center justify-between">
            <div className="text-foreground/60 font-medium text-sm">Net Profit</div>
            <div className={`flex items-center gap-1 text-sm font-medium ${netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {profitMargin.toFixed(1)}% Margin
            </div>
          </div>
          <div className="relative z-10 text-3xl font-bold">{formatCurrency(netProfit)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly P&L Chart */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col gap-6">
          <h2 className="text-xl font-bold">Profit & Loss Summary</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickFormatter={(val) => `${currencySymbol}${val}`} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fafafa' }} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Client Revenue Pie */}
        <div className="glass-panel p-6 flex flex-col gap-6 min-h-[400px]">
          <h2 className="text-xl font-bold">Revenue by Client (Top 5)</h2>
          {revenueByClientData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-foreground/50 border border-dashed border-border/50 rounded-xl">No revenue data available</div>
          ) : (
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueByClientData} cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {revenueByClientData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fafafa' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expenses Category Pie */}
        <div className="glass-panel p-6 flex flex-col gap-6 min-h-[400px]">
          <h2 className="text-xl font-bold">Expenses by Category</h2>
          {expenseByCategoryData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-foreground/50 border border-dashed border-border/50 rounded-xl">No expense data available</div>
          ) : (
            <div className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseByCategoryData} cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {expenseByCategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fafafa' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
