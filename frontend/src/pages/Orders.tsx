import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  X,
  User,
  ShoppingBag,
  Layers,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    sku: string;
  };
}

interface Order {
  id: string;
  customerId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  customer: {
    companyName: string;
    contactPerson: string;
  };
  orderItems: OrderItem[];
}

interface Customer {
  id: string;
  companyName: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number; // Stock level
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/customers'),
        api.get('/products')
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to sync ERP transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setSelectedCustomerId('');
    setSelectedProductId('');
    setQuantity(1);
    setFormError(null);
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setFormError(null);
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const computedTotal = selectedProduct ? selectedProduct.price * quantity : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedCustomerId) {
      setFormError('Please select a customer.');
      return;
    }
    if (!selectedProductId) {
      setFormError('Please select a product.');
      return;
    }
    if (quantity < 1) {
      setFormError('Quantity must be at least 1.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customerId: selectedCustomerId,
        items: [
          {
            productId: selectedProductId,
            quantity: Number(quantity)
          }
        ]
      };
      const response = await api.post('/orders', payload);
      setOrders([response.data, ...orders]);
      
      // Refresh products list to reflect deducted stock
      const productsRes = await api.get('/products');
      setProducts(productsRes.data);
      
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to record sales transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await api.put(`/orders/${id}`, { status: newStatus });
      setOrders(orders.map(o => o.id === id ? response.data : o));
      
      // Refresh products to catch changes in case of status cancelation stock reversal
      const productsRes = await api.get('/products');
      setProducts(productsRes.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to modify transaction status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this order? Active product stocks will be restored (if the order is not already cancelled).')) {
      return;
    }

    try {
      await api.delete(`/orders/${id}`);
      setOrders(orders.filter(o => o.id !== id));
      
      // Refresh products to catch stock restoration
      const productsRes = await api.get('/products');
      setProducts(productsRes.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete order.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-indigo-400" />
            Billing & Orders (ERP)
          </h2>
          <p className="text-slate-400 text-sm mt-1">Record purchases, generate invoice values, and fulfill shipment states.</p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Main Orders Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading database nodes...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">
            No orders registered in system. Click "Create Order" to launch one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/20 text-xs uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Customer Company</th>
                  <th className="py-4 px-6">Purchased Items</th>
                  <th className="py-4 px-6 text-right">Invoice Total</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-850/20 text-slate-300 transition-colors">
                    {/* Timestamp */}
                    <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    
                    {/* Customer */}
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      {order.customer.companyName}
                      <span className="text-[10px] text-slate-500 block font-normal">{order.customer.contactPerson}</span>
                    </td>
                    
                    {/* Items Purchased */}
                    <td className="py-4 px-6">
                      <div className="space-y-1.5">
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="text-xs">
                            <span className="text-slate-100 font-medium">{item.product.name}</span>
                            <span className="text-indigo-400 font-semibold font-mono ml-2">x{item.quantity}</span>
                            <span className="text-slate-500 font-mono text-[10px] ml-2">(${item.price.toFixed(2)}/ea)</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    
                    {/* Total Amount */}
                    <td className="py-4 px-6 text-right font-mono font-bold text-slate-100 text-sm">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    
                    {/* Status Badge & Select */}
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase rounded border px-2 py-1 bg-slate-950 focus:outline-none cursor-pointer ${
                            order.status === 'COMPLETED' ? 'text-emerald-400 border-emerald-500/20' :
                            order.status === 'PENDING' ? 'text-amber-400 border-amber-500/20' :
                            order.status === 'SHIPPED' ? 'text-blue-400 border-blue-500/20' :
                            'text-red-400 border-red-500/20'
                          }`}
                        >
                          <option value="PENDING" className="text-amber-500 bg-slate-900">PENDING</option>
                          <option value="SHIPPED" className="text-blue-500 bg-slate-900">SHIPPED</option>
                          <option value="COMPLETED" className="text-emerald-500 bg-slate-900">COMPLETED</option>
                          <option value="CANCELLED" className="text-red-500 bg-slate-900">CANCELLED</option>
                        </select>
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="p-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Overlay for Creating Order */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-zoomIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <h3 className="font-bold text-white text-base">Record Sales Order Invoice</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3.5 bg-red-950/20 border border-red-800/40 text-red-400 text-xs rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Customer (CRM Node)
                </label>
                <div className="relative">
                  <User className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="" className="text-slate-600">-- Select Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Product Item (WMS Node)
                </label>
                <div className="relative">
                  <ShoppingBag className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setQuantity(1); // Reset quantity on product swap
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="" className="text-slate-600">-- Select Product SKU --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                        {p.name} [{p.sku}] - ${p.price.toFixed(2)} (Stock: {p.quantity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity Selector */}
              {selectedProduct && (
                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Purchase Quantity
                    </label>
                    <div className="relative">
                      <Layers className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                      <input
                        type="number"
                        min="1"
                        max={selectedProduct.quantity}
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(selectedProduct.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Max Stock: {selectedProduct.quantity} units
                    </span>
                  </div>

                  {/* Calculated Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Order Invoice Total
                    </label>
                    <div className="h-10 border border-slate-800 bg-slate-950 rounded-xl flex items-center px-4 gap-1.5 font-mono text-white text-sm font-bold">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>{computedTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/10 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (selectedProduct && selectedProduct.quantity <= 0)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-lg cursor-pointer"
                >
                  {submitting ? 'Generating Invoice...' : 'Finalize Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
