import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shirt, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-slate-900/40 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden grid md:grid-cols-2 min-h-[600px] backdrop-blur-md">
        
        {/* Left Column: Image & Assignment Banner */}
        <div 
          className="hidden md:flex flex-col justify-between p-12 relative bg-cover bg-center"
          style={{ backgroundImage: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(7, 10, 19, 0.95)), url("/login_bg.png")' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 text-indigo-400">
            <Shirt className="w-8 h-8" />
            <span className="font-bold text-xl tracking-wider text-slate-100 uppercase">ClothingCorp</span>
          </div>

          {/* Core Message */}
          <div className="my-auto space-y-4">
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Enterprise Resource <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Management System
              </span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              A secure cloud platform for managing operations, inventory tracking, supply chain logistics, and customer relations.
            </p>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-slate-950/20">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div>
              <div className="md:hidden flex justify-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Shirt className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white text-center md:text-left">System Authentication</h3>
              <p className="text-slate-400 text-sm mt-1 text-center md:text-left">
                Please enter your credentials to access the central node.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-xl text-red-400 text-sm flex items-start gap-3 animate-headShake">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  System Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="admin@clothingcorp.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Security Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group cursor-pointer"
              >
                {loading ? 'Verifying Credentials...' : 'Authenticate Access'}
                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>


          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
