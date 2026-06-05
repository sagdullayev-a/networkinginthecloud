import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileSpreadsheet,
  Warehouse,
  User,
  LogOut,
  Shirt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customers', label: 'Customers (CRM)', icon: Users },
    { to: '/products', label: 'Products (WMS)', icon: Package },
    { to: '/orders', label: 'Orders (ERP)', icon: FileSpreadsheet },
    { to: '/inventory', label: 'Inventory Stock', icon: Warehouse },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 text-slate-300 z-20">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-800 flex items-center gap-3">
        <Shirt className="w-7 h-7 text-indigo-400" />
        <div>
          <h1 className="font-bold text-slate-100 text-lg leading-tight">ClothingCorp</h1>
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">ERP / WMS System</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border-l-4 border-indigo-500 pl-3'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 pl-4'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold uppercase">
            {user?.name.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-slate-200 truncate">{user?.name}</h4>
            <span className="text-[10px] font-medium text-slate-500 block truncate">{user?.email}</span>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-950/40 hover:text-red-400 rounded-lg text-xs font-semibold text-slate-300 transition-colors border border-slate-700/50 hover:border-red-900/50"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
