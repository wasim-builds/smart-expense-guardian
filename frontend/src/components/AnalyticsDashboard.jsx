import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { PieChart as PieChartIcon, TrendingUp, Target, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import { useAccount } from '../context/AccountContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4'];

export default function AnalyticsDashboard() {
  const { formatCurrency } = useCurrency();
  const { activeAccount } = useAccount();
  const [budgetLimit, setBudgetLimit] = useState(5000);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  // Load budget from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('monthlyBudget');
    if (saved) {
      setBudgetLimit(parseFloat(saved));
    }
  }, []);

  const handleSaveBudget = () => {
    const parsed = parseFloat(budgetInput);
    if (!isNaN(parsed) && parsed > 0) {
      setBudgetLimit(parsed);
      localStorage.setItem('monthlyBudget', parsed);
      setIsEditingBudget(false);
      toast.success(`Monthly budget set to ${formatCurrency(parsed)}`);
    } else {
      toast.error("Please enter a valid number");
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['analyticsSummary', activeAccount],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/analytics/summary?account_name=${encodeURIComponent(activeAccount)}`);
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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#18181b] border border-zinc-800 p-3 rounded-xl shadow-2xl">
          <p className="text-sm font-medium text-white">{payload[0].name || payload[0].payload.merchant}</p>
          <p className="text-lg font-bold text-emerald-400">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const totalSpend = data.total_spend || 0;
  const rawPercent = (totalSpend / budgetLimit) * 100;
  const displayPercent = isFinite(rawPercent) ? rawPercent : 0;
  const ringPercent = Math.min(displayPercent, 100);
  
  // Color the ring red if over 80%, dark red if over 100%
  const ringColor = displayPercent > 100 ? '#ef4444' : displayPercent >= 80 ? '#fbbf24' : '#10b981';
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ringPercent / 100) * circumference;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      {/* Budget Progress Ring */}
      <div className="glass-panel p-8 rounded-3xl flex flex-col justify-center items-center relative group hover:border-emerald-500/30 transition-all duration-500">
        <div className="absolute top-6 left-6 flex items-center text-zinc-400 font-bold uppercase text-xs tracking-widest">
          <Target className="w-4 h-4 mr-2 text-emerald-400" />
          Budget Limit
        </div>
        
        {isEditingBudget ? (
          <div className="absolute top-5 right-6 flex items-center space-x-2 z-20">
            <input 
              type="number" 
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="e.g. 5000"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-white w-24 outline-none focus:border-emerald-500"
            />
            <button onClick={handleSaveBudget} className="text-emerald-400 hover:text-emerald-300">
              <Save className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => { setBudgetInput(budgetLimit.toString()); setIsEditingBudget(true); }}
            className="absolute top-5 right-6 text-xs text-emerald-400 hover:text-emerald-300 font-bold uppercase bg-emerald-500/10 px-3 py-1.5 rounded-lg z-20 transition-colors"
          >
            Edit
          </button>
        )}

        <div className="relative flex items-center justify-center w-full h-[250px] mt-4">
          <svg className="transform -rotate-90 w-48 h-48 drop-shadow-2xl">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Background ring */}
            <circle
              cx="96" cy="96" r={radius}
              stroke="currentColor" strokeWidth="12" fill="transparent"
              className="text-zinc-800/50"
            />
            {/* Progress ring */}
            <circle
              cx="96" cy="96" r={radius}
              stroke={ringColor} strokeWidth="12" fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              filter="url(#glow)"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black font-mono text-white">
              {displayPercent.toFixed(0)}%
            </span>
            <div className="text-[10px] font-medium text-zinc-500 mt-2 flex flex-col items-center leading-tight w-24">
              <span className="truncate w-full text-center">{formatCurrency(totalSpend)}</span>
              <span className="text-zinc-600">out of</span>
              <span className="truncate w-full text-center">{formatCurrency(budgetLimit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="glass-panel p-8 rounded-3xl group hover:border-emerald-500/30 transition-all duration-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center relative z-10">
          <PieChartIcon className="w-5 h-5 mr-3 text-emerald-400" />
          Categories
        </h2>
        <div className="h-[200px] w-full">
          {data.category_breakdown.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.category_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="amount"
                  nameKey="category"
                  stroke="none"
                >
                  {data.category_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {data.category_breakdown.slice(0, 4).map((cat, i) => (
            <div key={cat.category} className="flex items-center text-[10px] font-medium text-zinc-400">
              <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
              {cat.category}
            </div>
          ))}
        </div>
      </div>

      {/* Top Merchants */}
      <div className="glass-panel p-8 rounded-3xl group hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center relative z-10">
          <TrendingUp className="w-5 h-5 mr-3 text-blue-400" />
          Merchants
        </h2>
        <div className="h-[250px] w-full">
          {data.top_merchants.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_merchants} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                <XAxis type="number" hide />
                <YAxis dataKey="merchant" type="category" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
