import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, KeyRound, Mail, ArrowRight } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    let success = false;
    
    if (isLogin) {
      success = await login(email, password);
    } else {
      success = await register(email, password);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 selection:bg-emerald-500/30">
      <Toaster position="top-right" toastOptions={{ style: { background: '#111113', color: '#fff', border: '1px solid #27272a' } }} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[0%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-3xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)] mb-6">
            <ShieldAlert className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Smart Expense Guardian</h1>
          <p className="text-zinc-400 mt-2 font-medium">Neural-Net Secured Finance</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-6">
            {isLogin ? 'Welcome Back' : 'Create Secure Vault'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:outline-none transition-all placeholder:text-zinc-600 text-white font-medium"
                  placeholder="agent@guardian.io"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:outline-none transition-all placeholder:text-zinc-600 text-white font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-black tracking-wide py-4 px-6 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center group uppercase mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#09090b]/20 border-t-[#09090b] rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? 'Decrypt & Enter' : 'Initialize Vault'}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              {isLogin ? "Don't have an account? " : "Already have a vault? "}
              <span className="text-emerald-400 font-bold border-b border-transparent hover:border-emerald-400 transition-colors">
                {isLogin ? 'Sign up' : 'Log in'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
