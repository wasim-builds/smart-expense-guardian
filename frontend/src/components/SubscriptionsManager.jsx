import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CalendarClock, AlertCircle, XCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { useAccount } from '../context/AccountContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function SubscriptionsManager() {
  const { formatCurrency } = useCurrency();
  const { activeAccount } = useAccount();
  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', activeAccount],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/analytics/subscriptions?account_name=${encodeURIComponent(activeAccount)}`);
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center border border-zinc-800 rounded-3xl bg-zinc-900/40">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-[#111113] p-8 rounded-3xl border border-zinc-800 shadow-2xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <CalendarClock className="w-5 h-5 mr-3 text-purple-400" /> Fixed Costs
        </h2>
        <span className="text-xs font-bold bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20 uppercase tracking-widest">
          {formatCurrency(data.total_fixed_costs)} / Mo
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {data.subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center p-4">
            <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm font-medium">No recurring subscriptions detected.</p>
          </div>
        ) : (
          data.subscriptions.map((sub, idx) => (
            <div key={idx} className="group bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center hover:border-zinc-700 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold border border-zinc-700/50">
                  {sub.merchant.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{sub.merchant}</p>
                  <p className="text-xs text-zinc-500">Last paid: {sub.last_paid}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <p className="font-bold text-zinc-300 font-mono">{formatCurrency(sub.amount)}</p>
                <button 
                  onClick={() => alert('Demo only: Cancel subscription feature initiated!')}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/20"
                  title="Cancel Subscription"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
