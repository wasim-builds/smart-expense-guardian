import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const AccountContext = createContext();

export function AccountProvider({ children }) {
  const [activeAccount, setActiveAccount] = useState('Main Account');

  // Fetch accounts from backend
  const { data: accounts = ['Main Account'], refetch } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/accounts`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Removed aggressive useEffect that reverted activeAccount to accounts[0]
  // This allows users to create and stay on new accounts that don't have transactions yet.

  const changeAccount = (accountName) => {
    setActiveAccount(accountName);
  };

  return (
    <AccountContext.Provider value={{ activeAccount, changeAccount, accounts, refetchAccounts: refetch }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
