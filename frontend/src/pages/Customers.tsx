import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  Mail,
  Phone,
  User,
  Building,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  _count?: {
    orders: number;
  };
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({});
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch customer nodes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('ADD');
    setCurrentCustomer({ companyName: '', contactPerson: '', email: '', phone: '' });
    setFormError(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setModalMode('EDIT');
    setCurrentCustomer(customer);
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

    try {
      if (modalMode === 'ADD') {
        const response = await api.post('/customers', currentCustomer);
        setCustomers([response.data, ...customers]);
      } else {
        const response = await api.put(`/customers/${currentCustomer.id}`, currentCustomer);
        setCustomers(customers.map(c => c.id === currentCustomer.id ? response.data : c));
      }
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to submit form.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer? All historical orders linked to this customer will be removed.')) {
      return;
    }

    try {
      await api.delete(`/customers/${id}`);
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete customer.');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-400" />
            Customer Relations (CRM)
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage wholesale buyers, accounts, and contact records.</p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Customer
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
          placeholder="Filter by company, contact, email..."
          className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 text-sm w-full"
        />
      </div>

      {/* Main Customers Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading database nodes...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">
            No customers found matching the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/20 text-xs uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">Company Name</th>
                  <th className="py-4 px-6">Contact Person</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Phone Number</th>
                  <th className="py-4 px-6 text-center">Orders</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-850/20 text-slate-300 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-100">{customer.companyName}</td>
                    <td className="py-4 px-6">{customer.contactPerson}</td>
                    <td className="py-4 px-6 font-mono text-xs">{customer.email}</td>
                    <td className="py-4 px-6 font-mono text-xs">{customer.phone}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-xs font-semibold font-mono">
                        {customer._count?.orders || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(customer)}
                          className="p-1.5 hover:bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 rounded border border-transparent hover:border-indigo-500/20 transition-all cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                          title="Delete Customer"
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

      {/* Modal Overlay for Add/Edit Customer */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-zoomIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <h3 className="font-bold text-white text-base">
                {modalMode === 'ADD' ? 'Add New Customer Profile' : 'Modify Customer Profile'}
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

              {/* Company Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Company Name
                </label>
                <div className="relative">
                  <Building className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={currentCustomer.companyName || ''}
                    onChange={(e) => setCurrentCustomer({ ...currentCustomer, companyName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Enter legal company name"
                  />
                </div>
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Primary Contact Person
                </label>
                <div className="relative">
                  <User className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={currentCustomer.contactPerson || ''}
                    onChange={(e) => setCurrentCustomer({ ...currentCustomer, contactPerson: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Full name of representative"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={currentCustomer.email || ''}
                    onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="billing@company.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={currentCustomer.phone || ''}
                    onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="+998901234567"
                  />
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
                  {submitting ? 'Processing...' : modalMode === 'ADD' ? 'Save Customer' : 'Apply Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
