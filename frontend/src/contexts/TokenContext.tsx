'use client';

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface TokenContextValue {
    balance: number;
    loading: boolean;
    refresh: () => Promise<void>;
    deductLocally: (amount: number) => void;
}

const TokenContext = createContext<TokenContextValue>({
    balance: 0,
    loading: true,
    refresh: async () => { },
    deductLocally: () => { },
});

export function TokenProvider({ children }: { children: ReactNode }) {
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        try {
            const res = await fetch(`${API_URL}/api/tokens`, {
                headers: { 'X-User-Id': 'demo-user-2' },
            });
            if (res.ok) {
                const data = await res.json();
                setBalance(data.balance);
            }
        } catch (e) {
            console.error('[Tokens] Failed to fetch balance:', e);
        } finally {
            setLoading(false);
        }
    };

    const deductLocally = (amount: number) => {
        setBalance((prev) => Math.max(0, prev - amount));
    };

    useEffect(() => {
        refresh();
    }, []);

    return (
        <TokenContext.Provider value={{ balance, loading, refresh, deductLocally }}>
            {children}
        </TokenContext.Provider>
    );
}

export function useTokens() {
    return useContext(TokenContext);
}
