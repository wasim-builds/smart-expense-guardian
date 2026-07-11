import React, { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { AlertCircle, Plus, Wallet, ShieldAlert, Sparkles, Receipt, Activity, CreditCard, ChevronRight } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function App() {
  const queryClient = useQueryClient();
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Fetch transactions using React Query
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/transactions`);
      return data;
    },
    onError: () => toast.error("Could not load previous transactions.")
  });

  // Add transaction mutation
  const addTransaction = useMutation({
    mutationFn: async (newTx) => {
      const { data } = await axios.post(`${API_BASE_URL}/transactions`, newTx);
      return data;
    },
    onSuccess: (newTx) => {
      queryClient.setQueryData(['transactions'], (old) => [newTx, ...old]);
      
      if (newTx.is_fraud) {
        toast.error(`Fraud Alert: $${newTx.amount.toFixed(2)} at ${newTx.merchant}`, {
          icon: '🚨',
          duration: 6000,
          style: { background: '#18181b', color: '#f87171', border: '1px solid #7f1d1d' }
        });
      } else {
        toast.success('Transaction secured', {
          icon: '🛡️',
          style: { background: '#18181b', color: '#4ade80', border: '1px solid #14532d' }
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

  // Generate 7-day padded data for the chart to always look good
  const getChartData = () => {
    const grouped = transactions.reduce((acc, tx) => {
      const date = tx.date.split('T')[0];
      acc[date] = (acc[date] || 0) + tx.amount;
      return acc;
    }, {});
    
    const chartData = [];
    // Always show the last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      chartData.push({
        date: format(d, 'MMM dd'),
        spend: grouped[dateStr] || 0
      });
    }
    return chartData;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!merchant || !amount || !description) return;

    addTransaction.mutate({
      merchant,
      amount: parseFloat(amount),
      description,
      date: new Date().toISOString()
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-xl shadow-2xl">
          <p className="text-xs text-zinc-400 font-medium mb-1 tracking-widest uppercase">{label}</p>
          <p className="text-2xl font-bold text-emerald-400">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate total spend
  const totalSpend = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const anomalyCount = transactions.filter(tx => tx.is_fraud).length;

  return (
    <div className="min-h-screen bg-[#09090b] selection:bg-emerald-500/30 p-4 md:p-8 font-sans text-zinc-100">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Navbar / Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-800/60 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <ShieldAlert className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
                Smart Expense Guardian
              </h1>
              <p className="text-zinc-500 text-sm font-medium">
                Neural-Net Secured Finance
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 flex items-center space-x-2 text-xs font-semibold text-zinc-300">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span>SYSTEM ONLINE</span>
            </div>
          </div>
        </header>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-3xl border border-zinc-800/80 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-sm font-medium text-zinc-400 flex items-center">
              <Wallet className="w-4 h-4 mr-2" /> Total Volume Protected
            </p>
            <p className="text-4xl font-black mt-3 font-mono tracking-tight text-white">
              ${totalSpend.toFixed(2)}
            </p>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-3xl border border-zinc-800/80 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-sm font-medium text-zinc-400 flex items-center">
              <Activity className="w-4 h-4 mr-2" /> ML Analyzed Events
            </p>
            <p className="text-4xl font-black mt-3 font-mono tracking-tight text-white">
              {transactions.length}
            </p>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-3xl border border-zinc-800/80 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-sm font-medium text-zinc-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" /> Threats Neutralized
            </p>
            <p className="text-4xl font-black mt-3 font-mono tracking-tight text-red-400">
              {anomalyCount}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Chart & Table */}
          <div className="xl:col-span-2 space-y-8 flex flex-col">
            
            {/* Chart Section */}
            <div className="bg-zinc-900/40 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center">
                    Velocity Analysis
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">7-Day Trajectory</p>
                </div>
              </div>
              
              <div className="h-[300px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData()} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12, fontWeight: 500}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12, fontWeight: 500}} tickFormatter={(value) => `$${value}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="spend" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-zinc-900/40 backdrop-blur-xl rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col h-[400px]">
              <div className="px-8 py-6 border-b border-zinc-800/80 sticky top-0 bg-zinc-900/90 backdrop-blur-md z-10 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">Encrypted Ledger</h2>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Live Feed</span>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                    <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-medium tracking-wide uppercase">Syncing Node...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <Receipt className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-medium">No transactions recorded.</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {transactions.map(tx => (
                      <div key={tx.id} className="group flex items-center justify-between p-4 hover:bg-zinc-800/50 rounded-2xl transition-all cursor-pointer">
                        <div className="flex items-center space-x-4">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${tx.is_fraud ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-zinc-800 text-zinc-300 border-zinc-700/50'}`}>
                            {tx.is_fraud ? <ShieldAlert className="w-5 h-5" /> : tx.merchant.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-zinc-100">{tx.merchant}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs font-medium text-zinc-500">
                                {format(parseISO(tx.date), 'MMM dd, h:mm a')}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                              <span className="text-xs text-zinc-400 truncate max-w-[150px]">{tx.description}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                           <div className="flex flex-col items-end">
                            <span className={`text-base font-bold font-mono tracking-tight ${tx.is_fraud ? 'text-red-400' : 'text-white'}`}>
                              ${tx.amount.toFixed(2)}
                            </span>
                            <div className="mt-1">
                              {tx.is_fraud ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
                                  Threat
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  {tx.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="xl:col-span-1 h-full">
            <div className="bg-[#111113] p-8 rounded-3xl border border-zinc-800 shadow-2xl sticky top-8">
              <h2 className="text-xl font-bold mb-8 text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-3 text-zinc-400" /> New Entry
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
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
