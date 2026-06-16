import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  FileSpreadsheet, 
  Warehouse, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Stats {
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  totalInventory: number;
  totalRevenue: number;
  lowStockItems: number;
}

interface RecentOrder {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  customer: {
    companyName: string;
  };
}

interface RecentCustomer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.stats);
      setRecentOrders(response.data.recentOrders);
      setRecentCustomers(response.data.recentCustomers);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch dashboard intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Aggregating cluster metrics...</p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'from-blue-500/20 to-indigo-500/5',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
      link: '/customers',
    },
    {
      title: 'Catalog Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'from-purple-500/20 to-pink-500/5',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/20',
      link: '/products',
    },
    {
      title: 'Sales Orders',
      value: stats?.totalOrders || 0,
      icon: FileSpreadsheet,
      color: 'from-emerald-500/20 to-teal-500/5',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      link: '/orders',
    },
    {
      title: 'Warehouse Items',
      value: stats?.totalInventory || 0,
      icon: Warehouse,
      color: 'from-amber-500/20 to-orange-500/5',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
      link: '/inventory',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Cloud Cluster Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">Real-time statistics synchronized from postgres database node.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link 
              key={idx} 
              to={card.link}
              className={`p-6 rounded-xl bg-gradient-to-br ${card.color} border ${card.borderColor} hover:scale-[1.02] transition-all duration-200 flex items-center justify-between group`}
            >
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <h3 className="text-3xl font-extrabold text-white font-mono">{card.value}</h3>
              </div>
              <div className={`p-3 rounded-lg bg-slate-950/60 border border-slate-800 group-hover:border-slate-700 transition-colors ${card.iconColor}`}>
                <Icon className="w-6 h-6" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Grid: Extended Dashboard widgets (Revenue / Low Stock Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Revenue Card */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Estimated Gross Revenue</span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Calculated by summing all active transaction orders</span>
            </div>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-4 mt-4">
            <h4 className="text-4xl font-black text-white font-mono">
              ${stats?.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </h4>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Active System Flow
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className={`p-6 rounded-xl border flex flex-col justify-between min-h-[160px] ${
          stats && stats.lowStockItems > 0 
            ? 'bg-amber-950/20 border-amber-900/40 text-amber-400' 
            : 'bg-slate-900/40 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider block">Low Stock Alert</span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Items with stock levels &le; 10 units</span>
            </div>
            <span className={`p-2 rounded border ${
              stats && stats.lowStockItems > 0 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-4xl font-black text-white font-mono">
              {stats?.lowStockItems || 0}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {stats && stats.lowStockItems > 0 
                ? 'Action required. replenishment needed in WMS module.' 
                : 'All warehouse locations report healthy quantities.'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Detailed Activity (Recent Orders & Customers) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders List */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Recent Orders (ERP Activity)
            </h3>
            <Link to="/orders" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              Manage Orders
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-2">
            {recentOrders.length === 0 ? (
              <p className="text-slate-500 text-xs p-6 text-center">No orders registered in system.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800">
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 text-slate-300">
                        <td className="py-3 px-3 font-medium text-slate-200">{order.customer.companyName}</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold">${order.totalAmount.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            order.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Customers List */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Recently Registered Accounts (CRM)
            </h3>
            <Link to="/customers" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              Manage Customers
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4 space-y-4">
            {recentCustomers.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4">No customers registered in database.</p>
            ) : (
              recentCustomers.map((cust) => (
                <div key={cust.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/30 border border-slate-800/60">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-200">{cust.companyName}</h4>
                    <span className="text-[10px] text-slate-400 block">{cust.contactPerson} &bull; {cust.email}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium">
                    {new Date(cust.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
