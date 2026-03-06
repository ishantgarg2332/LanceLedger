"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Receipt, PieChart, LogOut } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Reports', href: '/reports', icon: PieChart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (pathname === '/login') return null;

  return (
    <div className="w-64 flex-shrink-0 h-screen sticky top-0 border-r border-border bg-card/10 backdrop-blur-xl">
      <div className="h-full flex flex-col p-4">
        <div className="flex items-center gap-2 mb-8 px-2 mt-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent tracking-tight">
            Tracker<span className="text-primary hover:text-primary-hover transition-colors">.io</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground/60 hover:bg-card hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-foreground/40 group-hover:text-foreground/80'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-2 py-4 border-t border-border/50">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-sm font-medium uppercase">
                {user?.user_metadata?.first_name ? user.user_metadata.first_name.charAt(0) : (user?.email?.charAt(0) || 'U')}
              </div>
              <div className="flex flex-col max-w-[130px]">
                <span className="text-sm font-medium truncate">
                  {user?.user_metadata?.first_name
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
                    : (user?.email || 'User')}
                </span>
                <span className="text-xs text-foreground/40">Pro Plan</span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 text-foreground/60 transition-colors text-sm w-full font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
