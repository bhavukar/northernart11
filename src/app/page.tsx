import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

// Force dynamic fetch so the gallery stays fresh and updates when items are sold
export const revalidate = 0;
export const dynamic = 'force-dynamic';

interface Painting {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string;
  dimensions: string | null;
  medium: string | null;
  status: string;
}

export default async function GalleryPage() {
  // Fetch available paintings
  const { data: paintings, error } = await supabase
    .from('paintings')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching paintings:', error);
  }

  const formatPrice = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans selection:bg-neutral-100">
      {/* Unified Nav Header */}
      <Header />

      {/* Elegant Page Title */}
      <div className="max-w-7xl mx-auto pt-16 pb-12 px-8">
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-[#111111] font-normal">
          Fine Art Collection
        </h1>
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 mt-2 font-sans">
          Curated Contemporary Masterpieces
        </p>
      </div>

      {/* Main Staggered Asymmetrical Grid */}
      <main className="max-w-7xl mx-auto px-8 pb-32">
        {(!paintings || paintings.length === 0) ? (
          <div className="py-32 text-center text-xs uppercase tracking-widest text-neutral-400">
            No work is currently on display.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-12 gap-y-24 items-start">
            {paintings.map((painting: Painting, index: number) => {
              // Create asymmetrical sizing by mapping indexes to column spans and staggers
              // Item 0: Col Span 7 (Lg)
              // Item 1: Col Span 5 (Lg)
              // Item 2: Col Span 5, offset-lg (Lg)
              // Item 3: Col Span 7 (Lg)
              const isEven = index % 2 === 0;
              const colSpanClass = isEven 
                ? 'lg:col-span-7 lg:pr-8' 
                : 'lg:col-span-5 lg:pl-4 lg:mt-20'; // Adds vertical staggered offset to odd items
              
              return (
                <div 
                  key={painting.id}
                  className={`${colSpanClass} group cursor-pointer flex flex-col space-y-4 fade-in`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <Link href={`/painting/${painting.id}`} className="block overflow-hidden relative bg-neutral-50">
                    {/* Soft image fade-in and scale on hover */}
                    <div className="aspect-[4/3] w-full overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={painting.image_url}
                        alt={painting.title}
                        className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                        loading={index < 4 ? 'eager' : 'lazy'}
                      />
                    </div>
                  </Link>

                  <div className="flex flex-col space-y-1.5 pt-1 px-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-serif text-lg tracking-tight font-normal text-[#111111] group-hover:text-neutral-600 transition-colors duration-300">
                        <Link href={`/painting/${painting.id}`}>
                          {painting.title}
                        </Link>
                      </h3>
                      <span className="text-xs font-mono text-neutral-400">
                        {formatPrice(painting.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-400 tracking-wide font-sans">
                      {painting.medium && <span>{painting.medium}</span>}
                      {painting.medium && painting.dimensions && <span>•</span>}
                      {painting.dimensions && <span>{painting.dimensions}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-neutral-100 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs tracking-wider text-neutral-400 uppercase">
          <span>&copy; {new Date().getFullYear()} northernart11</span>
          <span>Curated with absolute minimalism</span>
        </div>
      </footer>
    </div>
  );
}
