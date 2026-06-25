'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';

interface Painting {
  id: string;
  title: string;
  price: number;
  image_url: string;
  dimensions: string | null;
  medium: string | null;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<Painting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCartItems = async () => {
    try {
      const cartIds = JSON.parse(localStorage.getItem('cart') || '[]');
      if (cartIds.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      // Read painting details directly using public anon Supabase client
      const { data, error } = await supabase
        .from('paintings')
        .select('id, title, price, image_url, dimensions, medium')
        .in('id', cartIds);

      if (error) throw error;
      setCartItems(data || []);
    } catch (err) {
      console.error('Failed to load cart items from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleRemove = (id: string) => {
    try {
      const cartIds = JSON.parse(localStorage.getItem('cart') || '[]');
      const updatedIds = cartIds.filter((cartId: string) => cartId !== id);
      localStorage.setItem('cart', JSON.stringify(updatedIds));
      
      // Update local state
      setCartItems(prev => prev.filter(item => item.id !== id));
      
      // Dispatch event to update global header count
      window.dispatchEvent(new Event('cart-updated'));
    } catch (e) {
      console.error('Failed to remove item:', e);
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price, 0);
  };

  const formatPrice = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans antialiased selection:bg-neutral-100 flex flex-col justify-between">
      
      {/* Unified Nav Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-8 md:py-16">
        <h2 className="font-serif text-3xl tracking-tight text-[#111111] mb-12 border-b border-neutral-100 pb-4">
          Shopping Cart
        </h2>

        {loading ? (
          <div className="text-center py-20 text-xs uppercase tracking-widest text-neutral-400">
            Reviewing cart contents...
          </div>
        ) : cartItems.length === 0 ? (
          <div className="border border-neutral-100 p-16 text-center text-neutral-400 text-xs flex flex-col items-center gap-3">
            <ShoppingBag size={24} className="text-neutral-200" />
            <span>Your cart is empty.</span>
            <Link
              href="/"
              className="mt-4 bg-[#111111] hover:bg-neutral-800 text-white px-6 py-2.5 uppercase tracking-widest text-[10px] font-medium transition-colors duration-300"
            >
              Browse Gallery
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* List of Cart Items */}
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-6 py-4 border-b border-neutral-100 justify-between fade-in"
                >
                  <div className="flex items-center gap-6">
                    {/* Thumbnail */}
                    <div className="h-20 w-20 bg-neutral-50 flex-shrink-0 overflow-hidden relative">
                      <Link href={`/painting/${item.id}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      </Link>
                    </div>

                    {/* Meta */}
                    <div>
                      <h4 className="font-serif text-base tracking-tight font-normal hover:text-neutral-600 transition-colors duration-300">
                        <Link href={`/painting/${item.id}`}>
                          {item.title}
                        </Link>
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1 font-sans">
                        {item.medium || 'Artwork'} • {item.dimensions || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center gap-6 text-right">
                    <span className="text-sm font-mono font-medium">
                      {formatPrice(item.price)}
                    </span>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-neutral-400 hover:text-red-600 transition-colors duration-300 p-1"
                      title="Remove artwork"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal and checkout actions */}
            <div className="pt-6 border-t border-neutral-100 flex flex-col md:flex-row md:items-baseline md:justify-between gap-6">
              <div className="text-neutral-500 text-xs font-light">
                * Includes customized packing, museum documentation, and domestic shipping insurance.
              </div>
              <div className="space-y-6 text-right shrink-0">
                <div className="flex items-baseline justify-end gap-6">
                  <span className="text-xs uppercase tracking-widest text-neutral-400 font-sans">
                    Subtotal
                  </span>
                  <span className="text-2xl font-light font-mono">
                    {formatPrice(getSubtotal())}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="w-full md:w-auto inline-flex bg-[#111111] hover:bg-neutral-800 text-white py-4 px-10 text-xs uppercase tracking-[0.2em] font-sans transition-colors duration-300 items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-neutral-100 py-12 px-8 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs tracking-wider text-neutral-400 uppercase">
          <span>&copy; {new Date().getFullYear()} northernart11</span>
          <span>Curated with absolute minimalism</span>
        </div>
      </footer>
    </div>
  );
}
