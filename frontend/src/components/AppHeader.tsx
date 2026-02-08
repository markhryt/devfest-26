'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Blocks, CreditCard, User } from 'lucide-react';
import { TokenBalance } from './TokenBalance';
import { TokenPurchaseModal } from './TokenPurchaseModal';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/block-library', label: 'Block Library', icon: Blocks },
  { href: '/checkout', label: 'Checkout', icon: CreditCard },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  return (
    <>
      <header className="flex items-center gap-6 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
        <Link
          href="/"
          className="text-lg font-semibold text-zinc-100 hover:text-white transition"
        >
          AI Block Marketplace
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <TokenBalance onClick={() => setShowPurchaseModal(true)} />
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <User className="h-4 w-4" />
            <span>Demo user</span>
          </div>
        </div>
      </header>
      <TokenPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
    </>
  );
}
