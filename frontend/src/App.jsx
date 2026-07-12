import React, { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Wallet, Activity, AlertCircle, CreditCard, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import AnalyticsDashboard from './components/AnalyticsDashboard';
import TransactionFeed from './components/TransactionFeed';
import SubscriptionsManager from './components/SubscriptionsManager';
import AIChatWidget from './components/AIChatWidget';
import AuthScreen from './components/AuthScreen';

import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import { AccountProvider, useAccount } from './context/AccountContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function AppContent() {
  const queryClient = useQueryClient();
  const { currency, changeCurrency, formatCurrency, availableCurrencies } = useCurrency();
  const { activeAccount, changeAccount, accounts, refetchAccounts } = useAccount();
  const { isAuthenticated, logout } = useAuth();
  
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Fetch summary stats for top cards
  const { data: summary } = useQuery({
    queryKey: ['analyticsSummary', activeAccount],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/analytics/summary?account_name=${encodeURIComponent(activeAccount)}`);
      return data;
    },
    onError: () => toast.error("Could not load backend data.")
  });

  // Add transaction mutation
  const addTransaction = useMutation({
    mutationFn: async (newTx) => {
      const { data } = await axios.post(`${API_BASE_URL}/transactions`, newTx);
      return data;
    },
    onSuccess: (newTx) => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['analyticsSummary']);
      queryClient.invalidateQueries(['categories']);
      
      const currentSpend = summary?.total_spend || 0;
      const newTotal = currentSpend + newTx.amount;
      
      const savedBudget = localStorage.getItem('monthlyBudget');
      if (savedBudget) {
        const budgetLimit = parseFloat(savedBudget);
        const percent = (newTotal / budgetLimit) * 100;
        
        // Check for budget alerts if it's not a fraud transaction
        if (!newTx.is_fraud) {
          if (percent >= 100) {
            toast.error(`Budget Exceeded: You are at ${percent.toFixed(0)}% of your ${formatCurrency(budgetLimit)} limit!`, {
              icon: '🛑',
              duration: 6000,
            });
          } else if (percent >= 80) {
            toast('Budget Warning: You have reached 80% of your monthly limit.', {
              icon: '⚠️',
              style: { background: '#18181b', color: '#fbbf24', border: '1px solid #78350f' }
            });
          } else {
             toast.success('Transaction secured', {
              icon: '🛡️',
              style: { background: '#18181b', color: '#4ade80', border: '1px solid #14532d' }
            });
          }
        }
      } else {
        // No budget set, just show normal success
        if (!newTx.is_fraud) {
          toast.success('Transaction secured', {
            icon: '🛡️',
            style: { background: '#18181b', color: '#4ade80', border: '1px solid #14532d' }
          });
        }
      }
      
      if (newTx.is_fraud) {
        toast.error(`Fraud Alert: ${formatCurrency(newTx.amount)} at ${newTx.merchant}`, {
          icon: '🚨',
          duration: 6000,
          style: { background: '#18181b', color: '#f87171', border: '1px solid #7f1d1d' }
        });
      }
      
      setMerchant('');
      setAmount('');
      setDescription('');
    },
    onError: (error) => {
      console.error("Error processing transaction", error);
      toast.error("Failed to process transaction.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!merchant || !amount || !description) return;

    addTransaction.mutate({
      merchant,
      amount: parseFloat(amount),
      description,
      date: new Date().toISOString(),
      account_name: activeAccount
    });
  };

  const totalSpend = summary?.total_spend || 0;
  const transactionCount = summary?.total_transactions || 0;
  const anomalyCount = summary?.total_fraud || 0;

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-transparent selection:bg-emerald-500/30 p-4 md:p-8 font-sans text-zinc-100">
      <Toaster position="top-right" toastOptions={{ style: { background: '#111113', color: '#fff', border: '1px solid #27272a' } }} />
      
      <div className="max-w-7xl mx-auto space-y-10">
        
        <header className="glass-panel rounded-3xl px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-4 z-40">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all">
              <ShieldAlert className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center">
                Smart Expense Guardian
              </h1>
              <p className="text-zinc-400 text-sm font-semibold tracking-wide uppercase mt-1">
                Neural-Net Secured Finance
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            
            <select
              value={activeAccount}
              onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  const newAcc = prompt("Enter new account name:");
                  if (newAcc) {
                    changeAccount(newAcc);
                    // Add it implicitly by starting to post/fetch to it
                  }
                } else {
                  changeAccount(e.target.value);
                }
              }}
              className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2 text-sm font-bold text-blue-400 focus:outline-none cursor-pointer hover:border-blue-500/50 transition-colors"
            >
              {accounts.map(acc => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
              {activeAccount && !accounts.includes(activeAccount) && (
                <option key={activeAccount} value={activeAccount}>{activeAccount}</option>
              )}
              <option value="__add_new__">+ Add Account...</option>
            </select>
            
            <select
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
              className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2 text-sm font-bold text-emerald-400 focus:outline-none cursor-pointer hover:border-emerald-500/50 transition-colors"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            
            <div className="bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 flex items-center space-x-2 text-xs font-semibold text-zinc-300">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span>SYSTEM ONLINE</span>
            </div>
            
            <button
              onClick={logout}
              className="text-xs font-bold text-zinc-400 hover:text-red-400 transition-colors uppercase tracking-widest px-3 py-2 bg-zinc-800/50 rounded-xl"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <p className="text-xs font-bold text-zinc-400 flex items-center tracking-widest uppercase mb-3">
              <Wallet className="w-4 h-4 mr-2 text-emerald-400" /> Total Volume Protected
            </p>
            <p className="text-4xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {formatCurrency(totalSpend)}
            </p>
          </div>
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-500/30 transition-all duration-300">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <p className="text-xs font-bold text-zinc-400 flex items-center tracking-widest uppercase mb-3">
              <Activity className="w-4 h-4 mr-2 text-blue-400" /> ML Analyzed Events
            </p>
            <p className="text-4xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {transactionCount}
            </p>
          </div>
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(248,113,113,0.15)] hover:border-red-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <p className="text-xs font-bold text-zinc-400 flex items-center tracking-widest uppercase mb-3">
              <AlertCircle className="w-4 h-4 mr-2 text-red-400" /> Threats Neutralized
            </p>
            <p className="text-4xl font-black font-mono tracking-tight text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]">
              {anomalyCount}
            </p>
          </div>
        </div>

        {/* Analytics Section */}
        <AnalyticsDashboard />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Transaction Feed */}
          <div className="xl:col-span-2 h-[800px]">
            <TransactionFeed />
          </div>

          {/* Right Column */}
          <div className="xl:col-span-1 h-[800px] flex flex-col gap-8">
            
            {/* New Entry Form */}
            <div className="glass-panel p-8 rounded-3xl shrink-0 relative overflow-hidden group">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-xl"></div>
              <h2 className="text-xl font-bold mb-8 text-white flex items-center relative z-10">
                <CreditCard className="w-5 h-5 mr-3 text-emerald-400" /> New Entry
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Merchant</label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={e => setMerchant(e.target.value)}
                    className="w-full px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:outline-none transition-all placeholder:text-zinc-600 text-white font-medium shadow-inner"
                    placeholder="Apple Store"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Amount</label>
                  <div className="relative">
                    <span className="absolute left-5 top-4 text-zinc-500 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full pl-9 pr-5 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:outline-none transition-all placeholder:text-zinc-600 text-white font-medium font-mono shadow-inner"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:outline-none transition-all placeholder:text-zinc-600 text-white font-medium shadow-inner"
                    placeholder="Subscription"
                    required
                  />
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={addTransaction.isPending}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-black tracking-wide py-4 px-6 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center group uppercase"
                  >
                    {addTransaction.isPending ? (
                      <span className="flex items-center">
                        <div className="w-5 h-5 border-2 border-[#09090b]/20 border-t-[#09090b] rounded-full animate-spin mr-3"></div>
                        Analyzing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Submit <Sparkles className="w-4 h-4 ml-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                      </span>
                    )}
                  </button>
                </div>
                
                <p className="text-center text-xs text-zinc-600 font-medium mt-4">
                  Secured by local machine learning.
                </p>
              </form>
            </div>
            
            {/* Subscriptions Manager */}
            <div className="flex-1 min-h-0">
              <SubscriptionsManager />
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <AccountProvider>
          <AppContent />
        </AccountProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
