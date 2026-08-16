import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_ACCOUNTS, web3Service, formatINR } from '../services/web3';

export type UserRole = 'CORPORATE' | 'VERIFIER' | 'BUYER';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface Web3ContextType {
  activeAccount: typeof DEMO_ACCOUNTS[0];
  walletAddress: string;
  role: UserRole;
  ztcBalance: string;
  inrBalance: string;
  ethBalance: string;
  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  notifications: Notification[];
  login: (accountIndex: number) => void;
  logout: () => void;
  switchAccount: (accountIndex: number) => void;
  connectBrowserWallet: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  addNotification: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  removeNotification: (id: string) => void;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number>(0);
  const [browserAccount, setBrowserAccount] = useState<string | null>(null);
  const [ztcBalance, setZtcBalance] = useState<string>('0.0');
  const [inrBalance, setInrBalance] = useState<string>('₹5,00,000');
  const [ethBalance, setEthBalance] = useState<string>('0.0');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const activeAccount = DEMO_ACCOUNTS[selectedAccountIndex];
  const currentAddress = browserAccount || activeAccount.address;

  const refreshBalances = async () => {
    try {
      const ztc = await web3Service.getTokenBalance(currentAddress);
      const inrNum = await web3Service.getInrBalance(currentAddress);
      const eth = await web3Service.getEthBalance(currentAddress);
      setZtcBalance(parseFloat(ztc).toFixed(2));
      setInrBalance(formatINR(inrNum));
      setEthBalance(parseFloat(eth).toFixed(3));
    } catch (e) {
      console.warn('Balance refresh failed:', e);
    }
  };

  useEffect(() => {
    refreshBalances();
    const interval = setInterval(refreshBalances, 6000);
    return () => clearInterval(interval);
  }, [currentAddress]);

  const login = (accountIndex: number) => {
    setBrowserAccount(null);
    setSelectedAccountIndex(accountIndex);
    setIsAuthenticated(true);
    addNotification('success', 'Logged In', `Authenticated as ${DEMO_ACCOUNTS[accountIndex].name}`);
  };

  const logout = () => {
    setIsAuthenticated(false);
    addNotification('info', 'Logged Out', 'Returned to public portal.');
  };

  const switchAccount = (index: number) => {
    setBrowserAccount(null);
    setSelectedAccountIndex(index);
    addNotification('info', 'Account Switched', `Active identity: ${DEMO_ACCOUNTS[index].name}`);
  };

  const connectBrowserWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        setIsConnecting(true);
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setBrowserAccount(accounts[0]);
          setIsAuthenticated(true);
          addNotification('success', 'Wallet Connected', `Connected with ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
        }
      } catch (err: any) {
        addNotification('error', 'Connection Failed', err.message || 'Could not connect wallet');
      } finally {
        setIsConnecting(false);
      }
    } else {
      addNotification('error', 'No Web3 Wallet', 'Please install MetaMask or use built-in demo roles.');
    }
  };

  const addNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setNotifications((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeNotification(id);
    }, 6000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <Web3Context.Provider
      value={{
        activeAccount,
        walletAddress: currentAddress,
        role: activeAccount.role,
        ztcBalance,
        inrBalance,
        ethBalance,
        isConnected: true,
        isConnecting,
        isAuthenticated,
        notifications,
        login,
        logout,
        switchAccount,
        connectBrowserWallet,
        refreshBalances,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
