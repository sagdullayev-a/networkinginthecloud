import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  Tag,
  Hash,
  DollarSign,
  Layers,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch catalog nodes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('ADD');
    setCurrentProduct({ name: '', sku: '', price: 0, quantity: 0 });
    setFormError(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setModalMode('EDIT');
    setCurrentProduct(product);
    setFormError(null);
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    // Cast price/quantity as numeric values
    const payload = {
      ...currentProduct,
      price: Number(currentProduct.price),
      quantity: Number(currentProduct.quantity)
    };

    try {
      if (modalMode === 'ADD') {
        const response = await api.post('/products', payload);
        setProducts([response.data, ...products]);
      } else {
        const response = await api.put(`/products/${currentProduct.id}`, payload);
        setProducts(products.map(p => p.id === currentProduct.id ? response.data : p));
      }
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to submit product catalog form.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product? All active orders and inventory logs referencing this SKU will be deleted.')) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete product.');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-400" />
            REMODULE
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage physical inventory SKUs, billing rates, and specifications.</p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Control Bar: Search */}
      <div className="flex items-center bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3 max-w-md">
        <Search className="w-5 h-5 text-slate-500 mr-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by SKU or name..."
          className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 text-sm w-full"
        />
      </div>

      {/* Main Catalog Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading database nodes...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">
            No products found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/20 text-xs uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">SKU Number</th>
                  <th className="py-4 px-6">Product Description</th>
                  <th className="py-4 px-6 text-right">Unit Price</th>
                  <th className="py-4 px-6 text-center">Available Stock</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-850/20 text-slate-300 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-indigo-400 font-bold">{product.sku}</td>
                    <td className="py-4 px-6 font-semibold text-slate-100">{product.name}</td>
                    <td className="py-4 px-6 text-right font-mono font-semibold text-slate-200">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold font-mono border ${
                        product.quantity <= 10
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 hover:bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 rounded border border-transparent hover:border-indigo-500/20 transition-all cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Overlay for Add/Edit Product */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-zoomIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <h3 className="font-bold text-white text-base">
                {modalMode === 'ADD' ? 'Catalog New Product SKU' : 'Modify Product SKU Details'}
              </h3>
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

              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Product Name / Description
                </label>
                <div className="relative">
                  <Tag className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={currentProduct.name || ''}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Silk Dress Shirt (White, L)"
                  />
                </div>
              </div>

              {/* SKU */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  SKU Code
                </label>
                <div className="relative">
                  <Hash className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={currentProduct.sku || ''}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, sku: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 uppercase font-mono"
                    placeholder="e.g. SLK-WHT-L"
                  />
                </div>
              </div>

              {/* Grid: Price & Quantity */}
              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Unit Price ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={currentProduct.price || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="35.99"
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Initial Stock Level
                  </label>
                  <div className="relative">
                    <Layers className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                    <input
                      type="number"
                      min="0"
                      required
                      value={currentProduct.quantity === undefined ? '' : currentProduct.quantity}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: parseInt(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

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
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-lg cursor-pointer"
                >
                  {submitting ? 'Syncing...' : modalMode === 'ADD' ? 'Save Product' : 'Apply Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
