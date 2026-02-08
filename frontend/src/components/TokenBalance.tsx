'use client';

import { Coins } from 'lucide-react';
import { useTokens } from '@/contexts/TokenContext';

export function TokenBalance({ onClick }: { onClick?: () => void }) {
    const { balance, loading } = useTokens();

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-400/50 transition-all"
            title="Click to buy more tokens"
        >
            <Coins className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-200">
                {loading ? '...' : balance.toLocaleString()}
            </span>
        </button>
    );
}
