"use client";

import { useState } from 'react';
import { useDataStore } from '@/hooks/useDataStore';
import Modal from '@/components/Modal';
import { Plus, Search, Receipt, Tag, Calendar, DollarSign, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const EXPENSE_CATEGORIES = [
  'Software/Subscriptions',
  'Marketing/Ads',
  'Office Supplies',
  'Travel/Meals',
  'Contractors',
  'Equipment/Hardware',
  'Other'
];

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#64748b'];

const Input = ({ label, icon: Icon, ...props }) => (
  <div className="flex flex-col gap-1.5 mb-4 relative">
    <label className="text-sm font-medium text-foreground/80">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">
        <Icon className="w-4 h-4" />
      </div>
      {props.type === "select" ? (
        <select
          className="w-full bg-background/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50 appearance-none"
          {...props}
        >
          {props.children}
        </select>
      ) : (
        <input
          className={`w-full bg-background/50 border border-border rounded-lg ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/50`}
          {...props}
        />
      )}
    </div>
  </div>
);

export default function ExpensesPage() {
  const { data: expenses, add, update, remove, isLoaded } = useDataStore('expenses', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    amount: '', category: EXPENSE_CATEGORIES[0], date: new Date().toISOString().split('T')[0], description: ''
  });

  if (!isLoaded) return <div className="flex items-center justify-center h-full">Loading...</div>;

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Group data for Pie Chart
  const categoryData = EXPENSE_CATEGORIES.map(category => ({
    name: category,
    value: filteredExpenses.filter(e => e.category === category).reduce((sum, e) => sum + Number(e.amount), 0)
  })).filter(cat => cat.value > 0);

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({ amount: '', category: EXPENSE_CATEGORIES[0], date: new Date().toISOString().split('T')[0], description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({ ...expense });
    setIsModalOpen(true);
  };

  const openDeleteModal = (expense) => {
    setExpenseToDelete(expense);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      amount: Number(formData.amount)
    };
    if (editingExpense) {
      update(editingExpense.id, dataToSave);
    } else {
      add(dataToSave);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (expenseToDelete) {
      remove(expenseToDelete.id);
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-foreground/60 mt-1">Track and categorize your business expenses.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors shadow-lg shadow-primary/25"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="text"
                placeholder="Search descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-48 bg-background/50 border border-border rounded-lg pl-9 pr-8 py-2 text-sm outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-foreground/50 uppercase bg-card/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Category / Date</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-foreground/50">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Receipt className="w-8 h-8 opacity-50" />
                        <p>No expenses found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.sort((a,b) => new Date(b.date) - new Date(a.date)).map((expense) => (
                    <tr key={expense.id} className="border-b border-border/50 hover:bg-card/30 transition-colors last:border-0">
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">{expense.description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary w-fit">
                            {expense.category}
                          </span>
                          <span className="text-xs text-foreground/50 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(expense.date).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="p-2 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(expense)}
                            className="p-2 text-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h2 className="text-xl font-bold">Summary</h2>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{formatCurrency(totalExpenses)}</span>
              <span className="text-sm text-foreground/50 mb-1 block">Total</span>
            </div>
          </div>

          <div className="glass-panel p-6 flex flex-col gap-4 flex-1 min-h-[350px]">
            <h2 className="text-lg font-bold">Category Breakdown</h2>
            {categoryData.length === 0 ? (
               <div className="flex items-center justify-center h-full text-foreground/50 bg-card/20 rounded-xl border border-border/50">
                No data to display
               </div>
            ) : (
              <div className="h-full min-h-[250px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fafafa' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          <Input
            label="Description"
            icon={Tag}
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            required
            placeholder="e.g. Adobe Creative Cloud"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0"
              icon={DollarSign}
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              required
              placeholder="0.00"
            />
            <Input
              label="Date"
              type="date"
              icon={Calendar}
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>
          <Input
            label="Category"
            type="select"
            icon={Filter}
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
          >
            {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </Input>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border/50">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors text-foreground/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
            >
              {editingExpense ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Expense"
      >
        <div className="flex flex-col">
          <p className="text-foreground/80 mb-6">
            Are you sure you want to delete <span className="font-semibold text-foreground">{expenseToDelete?.description}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors text-foreground/80"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
            >
              Delete Expense
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
