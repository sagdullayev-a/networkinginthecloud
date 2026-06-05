import React, { useState, useEffect } from 'react';
import { 
  Warehouse, 
  Search, 
  X,
  Layers,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

interface InventoryItem {
  id: string;
  productId: string;
  stockQuantity: number;
  lastUpdated: string;
  product: {
    name: string;
    sku: string;
    price: number;
  };
}

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Edit stock level state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/inventory');
      setInventory(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to sync WMS warehouse telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setNewStockVal(item.stockQuantity);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newStockVal < 0) {
      setFormError('Stock levels cannot drop below 0.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.put(`/inventory/${editingItem?.id}`, {
        stockQuantity: Number(newStockVal)
      });
      
      // Update state local list item
      setInventory(inventory.map(item => item.id === editingItem?.id ? response.data : item));
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to update warehouse stock.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.product.name.toLowerCase().includes(search.toLowerCase()) ||
    item.product.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Warehouse className="w-7 h-7 text-indigo-400" />
            Warehouse Management (WMS)
          </h2>
          <p className="text-slate-400 text-sm mt-1">Audit bin locations, monitor low-stock levels, and replenish clothing items.</p>
        </div>
        
        <button
          onClick={fetchInventory}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Audit Stock
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Search Filter */}
      <div className="flex items-center bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 max-w-md">
        <Search className="w-5 h-5 text-slate-500 mr-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by SKU or description..."
          className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 text-sm w-full"
        />
      </div>

      {/* Main Stock Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Auditing warehouse locations...
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">
            No stock listings found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/20 text-xs uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">SKU Number</th>
                  <th className="py-4 px-6">Product Description</th>
                  <th className="py-4 px-6 text-right">Market Price</th>
                  <th className="py-4 px-6 text-center">In-Stock Quantity</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Last Audited</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-850/20 text-slate-300 transition-colors">
                    {/* SKU */}
                    <td className="py-4 px-6 font-mono text-xs text-indigo-400 font-bold">{item.product.sku}</td>
                    
                    {/* Name */}
                    <td className="py-4 px-6 font-semibold text-slate-100">{item.product.name}</td>
                    
                    {/* Price */}
                    <td className="py-4 px-6 text-right font-mono font-semibold text-slate-200">
                      ${item.product.price.toFixed(2)}
                    </td>
                    
                    {/* Quantity */}
                    <td className="py-4 px-6 text-center font-mono font-bold text-slate-100">
                      {item.stockQuantity}
                    </td>

                    {/* Stock Status Badge */}
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.stockQuantity === 0 
                          ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                          : item.stockQuantity <= 10 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>
                        {item.stockQuantity === 0 ? 'OUT OF STOCK' : item.stockQuantity <= 10 ? 'LOW STOCK' : 'IN STOCK'}
                      </span>
                    </td>

                    {/* Last Updated Timestamp */}
                    <td className="py-4 px-6 text-right text-xs text-slate-400 font-mono">
                      {new Date(item.lastUpdated).toLocaleString()}
                    </td>

                    {/* Quick Restock Action */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-2.5 py-1 text-xs font-semibold bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded border border-indigo-500/20 hover:border-transparent transition-all cursor-pointer"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Adjusting Stock */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-zoomIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <h3 className="font-bold text-white text-base">Adjust Warehouse Stock</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-red-950/20 border border-red-800/40 text-red-400 text-xs rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Readonly details */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                <div className="text-slate-500">Selected Product:</div>
                <div className="font-bold text-slate-200 text-sm">{editingItem.product.name}</div>
                <div className="font-mono text-indigo-400 mt-1">SKU: {editingItem.product.sku}</div>
              </div>

              {/* Input stockQuantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Total Bin Quantity
                </label>
                <div className="relative">
                  <Layers className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStockVal}
                    onChange={(e) => setNewStockVal(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="Enter updated count"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Submitting updates both ERP catalog records and WMS trackers simultaneously.
                </span>
              </div>

              {/* Footer */}
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
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-lg cursor-pointer"
                >
                  {submitting ? 'Applying...' : 'Commit stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
