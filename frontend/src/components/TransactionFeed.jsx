import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ShieldAlert, Receipt, ChevronRight, Search, Trash2, X, Download, Filter, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { useAccount } from '../context/AccountContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function TransactionFeed() {
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();
  const { activeAccount } = useAccount();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  // Fetch transactions with filters
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', search, categoryFilter, activeAccount],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (activeAccount) params.append('account_name', activeAccount);
      
      const { data } = await axios.get(`${API_BASE_URL}/transactions?${params.toString()}`);
      return data;
    }
  });

  // Fetch categories for filter dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', activeAccount],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/analytics/categories?account_name=${encodeURIComponent(activeAccount)}`);
      return data;
    }
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`${API_BASE_URL}/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsSummary'] });
      toast.success('Transaction deleted');
      setSelectedTx(null);
    },
    onError: () => {
      toast.error('Failed to delete transaction');
    }
  });

  const handleExport = () => {
    window.open(`${API_BASE_URL}/transactions/export?account_name=${encodeURIComponent(activeAccount)}`, '_blank');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('account_name', activeAccount);

    setIsUploading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/transactions/upload`, formData);
      
      const jobId = res.data.job_id;
      if (jobId) {
        toast.loading(`Processing file...`, { id: jobId });
        
        // Poll for status
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await axios.get(`${API_BASE_URL}/transactions/upload/status/${jobId}`);
            const status = statusRes.data.status;
            
            if (status === 'SUCCESS') {
              clearInterval(pollInterval);
              toast.success(`Successfully categorized and uploaded transactions!`, { id: jobId });
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
              queryClient.invalidateQueries({ queryKey: ['analyticsSummary'] });
              setIsUploading(false);
            } else if (status === 'FAILURE') {
              clearInterval(pollInterval);
              toast.error(`Upload failed: ${statusRes.data.error || 'Unknown error'}`, { id: jobId });
              setIsUploading(false);
            } else if (status === 'PROGRESS') {
                const progress = statusRes.data.progress;
                if (progress && progress.total) {
                    toast.loading(`Processing ${progress.current} / ${progress.total}...`, { id: jobId });
                }
            }
          } catch (err) {
            clearInterval(pollInterval);
            toast.error("Failed to check status", { id: jobId });
            setIsUploading(false);
          }
        }, 2000);
      } else {
        setIsUploading(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload statement');
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden flex flex-col h-full relative">
      
      {/* Header & Filters */}
      <div className="px-6 py-5 border-b border-white/5 sticky top-0 bg-[#050505]/60 backdrop-blur-2xl z-10 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Receipt className="w-5 h-5 mr-3 text-zinc-400" /> Encrypted Ledger
          </h2>
          <div className="flex space-x-2">
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-emerald-400 transition-colors bg-zinc-800/50 px-3 py-2 rounded-lg disabled:opacity-50"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mr-2"></div>
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload CSV
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-emerald-400 transition-colors bg-zinc-800/50 px-3 py-2 rounded-lg"
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search merchants..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-9 pr-8 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="overflow-y-auto flex-1 p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium tracking-wide uppercase">Syncing Node...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <Receipt className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium">No transactions found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div 
                key={tx.id} 
                onClick={() => setSelectedTx(tx)}
                className="group flex items-center justify-between py-3 px-4 hover:bg-white/5 rounded-2xl transition-all duration-300 cursor-pointer border-b border-white/5 last:border-0 hover:translate-x-1 hover:shadow-lg"
              >
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
                <div className="flex flex-col items-end sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                   <div className="flex flex-col items-end">
                    <span className={`text-base font-bold font-mono tracking-tight ${tx.is_fraud ? 'text-red-400' : 'text-white'}`}>
                      {formatCurrency(tx.amount)}
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
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Detail Drawer Overlay */}
      {selectedTx && (
        <div className="absolute inset-y-0 right-0 w-full md:w-[400px] bg-[#050505]/95 backdrop-blur-3xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col transform transition-transform duration-500 ease-out z-50">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-transparent">
            <h3 className="font-bold text-white tracking-wide uppercase text-sm">Transaction Details</h3>
            <button onClick={() => setSelectedTx(null)} className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-8">
            {/* Amount & Merchant Header */}
            <div className="text-center space-y-2">
              <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center border-2 ${selectedTx.is_fraud ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                {selectedTx.is_fraud ? <ShieldAlert className="w-10 h-10" /> : <Receipt className="w-10 h-10" />}
              </div>
              <h2 className="text-3xl font-black text-white font-mono mt-4">{formatCurrency(selectedTx.amount)}</h2>
              <p className="text-zinc-400 font-medium">{selectedTx.merchant}</p>
              <p className="text-xs text-zinc-500">{format(parseISO(selectedTx.date), 'MMMM do, yyyy h:mm a')}</p>
            </div>

            {/* AI Analysis Card */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Neural Net Analysis</h4>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-300">Category Prediction</span>
                  <span className="text-sm font-bold text-white bg-zinc-800 px-2 py-1 rounded">{selectedTx.category}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-300">Anomaly Score</span>
                  <span className="text-sm font-bold font-mono text-white">
                    {selectedTx.anomaly_score ? selectedTx.anomaly_score.toFixed(4) : 'N/A'}
                  </span>
                </div>

                <div className="pt-4 border-t border-zinc-700/50">
                  <p className={`text-sm font-medium leading-relaxed ${selectedTx.is_fraud ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedTx.is_fraud 
                      ? "⚠️ Critical Alert: This transaction's isolation forest anomaly score exceeds the safety threshold. High probability of fraudulent merchant velocity or unusual timestamp."
                      : "✅ Verified Secure: Transaction characteristics align with normal spending patterns."}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4">
              <button 
                onClick={() => deleteMutation.mutate(selectedTx.id)}
                disabled={deleteMutation.isPending}
                className="w-full flex items-center justify-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-3 rounded-xl font-bold transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Transaction</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
