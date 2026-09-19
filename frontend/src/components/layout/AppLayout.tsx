import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  Building2,
  Kanban,
  CheckSquare,
  Clock,
  BarChart3,
  ShieldCheck,
  CreditCard,
  Settings,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export const AppLayout: React.FC = () => {
  const { user, currentOrg, organizations, switchOrganization, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch unread notifications count
  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications?unreadOnly=true');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const unreadCount = notifData?.meta?.unreadCount || 0;
  const recentNotifs = notifData?.data?.slice(0, 5) || [];

  const navigationItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', to: '/leads', icon: Users2 },
    { name: 'Customers', to: '/customers', icon: Building2 },
    { name: 'Sales Pipeline', to: '/pipeline', icon: Kanban },
    { name: 'Tasks', to: '/tasks', icon: CheckSquare },
    { name: 'Activities', to: '/activities', icon: Clock },
    { name: 'Analytics', to: '/analytics', icon: BarChart3 },
    { name: 'Team', to: '/team', icon: Users2 },
    { name: 'Billing', to: '/billing', icon: CreditCard },
    { name: 'Settings', to: '/settings', icon: Settings },
    { name: 'Audit Logs', to: '/audit-logs', icon: ShieldCheck },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'CF';
  };

  return (
    <div className="flex h-screen bg-slate-50/70 overflow-hidden">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden animate-backdrop-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Dark Enterprise Aesthetic */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/25 transition-transform hover:scale-105">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight">
                Client<span className="text-indigo-400">Flow</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 -mt-1">
                Enterprise CRM
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Organization Switcher */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="relative">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/60 transition-all duration-200 text-left group hover:border-slate-600"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                  {currentOrg?.name?.[0]?.toUpperCase() || 'O'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                    {currentOrg?.name || 'Workspace'}
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {currentOrg?.plan || 'PRO'} Plan
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 group-hover:text-slate-200 transition-transform duration-200 ${
                  orgDropdownOpen ? 'rotate-180 text-indigo-400' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {orgDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 animate-scale-in">
                <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Workspace
                </p>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      switchOrganization(org.id);
                      setOrgDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors duration-150 ${
                      currentOrg?.id === org.id
                        ? 'bg-indigo-600/25 text-indigo-300 font-semibold border-l-2 border-indigo-400'
                        : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{org.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{org.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ease-out group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70 hover:translate-x-1'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full shadow-sm" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-all duration-200 ${
                    isActive
                      ? 'text-white scale-105'
                      : 'text-slate-400 group-hover:text-indigo-400 group-hover:scale-110'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Profile Section */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105">
                {getInitials(user?.firstName, user?.lastName)}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 active:scale-95 transition-all duration-150"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar - Frosted Glass Aesthetic */}
        <header className="h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 active:scale-95 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleSearch} className="max-w-md w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads, companies, deals (Press Enter)..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-100/90 border border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 focus:outline-none transition-all duration-200 placeholder:text-slate-400 text-slate-800 shadow-xs"
              />
            </form>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all duration-150"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                    <span className="font-bold text-sm text-slate-900">Notifications</span>
                    <NavLink
                      to="/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                    >
                      View all
                    </NavLink>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {recentNotifs.length === 0 ? (
                      <p className="p-6 text-xs text-center text-slate-400">No new notifications</p>
                    ) : (
                      recentNotifs.map((n: any) => (
                        <div
                          key={n.id}
                          className="p-3.5 hover:bg-indigo-50/40 transition-colors duration-150 cursor-pointer"
                        >
                          <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Upgrade Badge or Pro Status */}
            {currentOrg?.plan === 'FREE' ? (
              <NavLink
                to="/billing"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade to Pro
              </NavLink>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                PRO ACTIVE
              </div>
            )}

            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-indigo-500/30 hover:ring-indigo-500 transition-all duration-200 cursor-pointer">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
