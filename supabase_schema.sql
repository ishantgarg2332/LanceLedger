-- Schema for Invoice Tracker

-- 1. Create tables
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  status TEXT DEFAULT 'Draft',
  due_date DATE,
  notes TEXT,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  qty INT DEFAULT 1,
  rate DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  date DATE,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Users can only see and modify their own data

-- Clients
CREATE POLICY "Users can manage their own clients"
ON public.clients FOR ALL USING (auth.uid() = user_id);

-- Invoices
CREATE POLICY "Users can manage their own invoices"
ON public.invoices FOR ALL USING (auth.uid() = user_id);

-- Invoice Items
CREATE POLICY "Users can manage their own invoice items"
ON public.invoice_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id AND i.user_id = auth.uid()
  )
);

-- Expenses
CREATE POLICY "Users can manage their own expenses"
ON public.expenses FOR ALL USING (auth.uid() = user_id);

-- 4. Enable Realtime (optional, if you want live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients, public.invoices, public.expenses;
