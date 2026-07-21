import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Users, FileText, FilePlus, 
  CreditCard, Settings, Menu, X, ChevronRight, UserCog, BarChart3, LogOut, ScrollText
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { hasAcceptedTerms } from '@/pages/TermsOfUse';
import TermsOfUse from '@/pages/TermsOfUse';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const allNavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/quotes', label: 'Quotes', icon: FileText },
  { path: '/sales-orders', label: 'Sales Orders', icon: FilePlus },
  { path: '/invoices', label: 'Invoices', icon: ({ className }) => (
    <span className={cn("flex items-center justify-center font-bold text-[10px] leading-none border border-current rounded-[2px] w-4 h-4", className)}>R</span>
  ) },
  { path: '/credit-notes', label: 'Credit Notes', icon: CreditCard },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/users', label: 'Users', icon: UserCog, adminOnly: true },
  { path: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(hasAcceptedTerms);
  const { user } = useAuth();
  const location = useLocation();

  if (!termsAccepted) {
    return <TermsOfUse showAcceptButton={true} onAccept={() => setTermsAccepted(true)} />;
  }

  const isAdmin = user?.role === 'admin';
  const userName = user?.full_name || user?.email || 'User';

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 shrink-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-lg leading-none">R</span>
              </div>
              <div>
                <h1 className="font-heading font-bold text-base text-sidebar-foreground">AccuBooks</h1>
                <p className="text-[10px] text-sidebar-foreground/50 tracking-widest uppercase">Accounting</p>
              </div>
            </div>
            <Button 
              variant="ghost" size="icon" 
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="px-4 py-2.5 border-b border-sidebar-border">
          <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest">Logged in as</p>
          <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/25"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0 text-current" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-0.5">
          <Link
            to="/terms"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
          >
            <ScrollText className="w-4 h-4 flex-shrink-0" />
            <span>Terms of Use</span>
          </Link>
          <button
            onClick={() => base44.auth.logout('/')}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 lg:px-6 h-14 flex items-center gap-4 no-print">
          <Button
            variant="ghost" size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}