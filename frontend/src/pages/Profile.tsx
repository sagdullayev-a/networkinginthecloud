import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile: React.FC = () => {
  const { user, updateUserSession } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const payload: any = { name, email };
      if (password) {
        payload.password = password;
      }

      const response = await api.put('/auth/profile', payload);
      
      // Update session values
      const { user: updatedUser, token: updatedToken } = response.data;
      updateUserSession(updatedUser, updatedToken);
      
      // Reset password fields
      setPassword('');
      setConfirmPassword('');
      setSuccess('Profile updated successfully! System authentication tokens refreshed.');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update system profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header Panel */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-7 h-7 text-indigo-400" />
          User Profile node
        </h2>
        <p className="text-slate-400 text-sm mt-1">Configure your operator credentials, contact info, and passwords.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-sm rounded-xl flex items-start gap-2.5 animate-headShake">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-sm rounded-xl flex items-start gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Profile Form Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Security Meta */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-between text-center md:col-span-1">
          <div className="space-y-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-3xl font-extrabold uppercase mx-auto">
              {user?.name.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-white font-bold text-base leading-tight">{user?.name}</h3>
              <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block mt-1">{user?.role} Node</span>
            </div>
          </div>

          <div className="w-full border-t border-slate-800/80 pt-6 mt-6 space-y-3.5 text-left text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Auth: <strong className="text-slate-300 font-semibold">JWT-Bearer</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Status: <strong className="text-emerald-400 font-bold">Online</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Form inputs */}
        <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 md:col-span-2 space-y-5">
          <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3">Security Credentials</h3>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Operator Full Name
            </label>
            <div className="relative">
              <User className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Full name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Corporate Email Address
            </label>
            <div className="relative">
              <Mail className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="email@company.com"
              />
            </div>
          </div>

          {/* Security Boundary */}
          <div className="pt-2">
            <h4 className="font-bold text-indigo-400 text-xs uppercase tracking-wider mb-4">Update Security Password</h4>
            
            {/* Grid for passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute inset-y-0 left-0 pl-3.5 w-8.5 h-full text-slate-500 flex items-center pointer-events-none" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Re-type password"
                  />
                </div>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-2 block">
              Leave password blank if you do not wish to refresh it.
            </span>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-slate-800/80 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 text-white font-semibold text-xs rounded-lg transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              {loading ? 'Refreshing tokens...' : 'Save Profile Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
