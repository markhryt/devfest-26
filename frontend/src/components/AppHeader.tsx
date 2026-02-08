'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FlaskConical, Store, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { TokenBalance } from './TokenBalance';
import { TokenPurchaseModal } from './TokenPurchaseModal';
import { UserDropdown } from './UserDropdown';

const NAV = [
  { href: '/marketplace', label: 'Marketplace', icon: Store },
  { href: '/lab', label: 'Lab', icon: FlaskConical },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const cartCount = useCartStore((state) => state.blockIds.length);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 shrink-0 border-b border-app bg-app-surface/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
          <Link href="/" className="text-base font-semibold tracking-tight text-app-fg md:text-lg">
            Handi
          </Link>

          <nav className="ml-2 flex items-center gap-1 overflow-x-auto">
            {NAV.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-app-accent/20 text-blue-300 dark:text-blue-200'
                      : 'text-app-soft hover:bg-app-surface hover:text-app-fg'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {href === '/cart' && cartCount > 0 && (
                    <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-blue-300">
                      {cartCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <TokenBalance onClick={() => setShowPurchaseModal(true)} />
            <UserDropdown />
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
