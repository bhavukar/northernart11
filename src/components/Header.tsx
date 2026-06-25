'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function Header() {
  const [cartCount, setCartCount] = useState(0);

  const updateCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    } catch (e) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('cart-updated', updateCount);
    return () => {
      window.removeEventListener('cart-updated', updateCount);
    };
  }, []);

  return (
    <header className="border-b border-neutral-50 bg-white sticky top-0 z-50 py-5 px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Gallery Logo */}
        <Link 
          href="/" 
          className="font-serif text-xl md:text-2xl tracking-tight text-[#111111] font-normal hover:text-neutral-600 transition-colors duration-300"
        >
          northernart11
        </Link>

        {/* Global Navigation links */}
        <nav className="flex items-center gap-6 md:gap-8 text-xs uppercase tracking-wider text-neutral-500 font-sans">
          <Link 
            href="/" 
            className="hover:text-[#111111] transition-colors duration-300"
          >
            Gallery
          </Link>
          <Link 
            href="/admin" 
            className="hover:text-[#111111] transition-colors duration-300"
          >
            Studio
          </Link>
          <Link 
            href="/cart" 
            className="hover:text-[#111111] transition-colors duration-300 flex items-center gap-1.5 font-medium text-[#111111]"
          >
            <ShoppingBag size={14} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="bg-[#111111] text-white text-[9px] font-bold font-mono h-4 w-4 rounded-full flex items-center justify-center shrink-0">
                {cartCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
