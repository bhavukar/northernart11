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

      {/* Cinematic Hero Section with Indian Contemporary Art Touch */}
      <div className="relative bg-white border-b border-neutral-100 py-12 md:py-24 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Poetic Typography */}
          <div className="lg:col-span-6 flex flex-col space-y-6">
            <div className="inline-flex items-center gap-2">
              <span className="h-px w-8 bg-neutral-400"></span>
              <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-sans font-semibold">
                Indian Contemporary Fine Art
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-[#111111] font-normal">
              Heritage Soul. <br />
              <span className="italic text-neutral-500 font-light">Modern Expression.</span>
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-lg font-sans">
              A curated sanctuary showcasing high-end contemporary masterpieces. We bridge classical Indian tones of saffron, clay, and gold leaf with raw modern abstraction—curating exclusive visual acquisitions for niche collectors.
            </p>
            <div className="pt-4 flex items-center gap-6">
              <a 
                href="#collection" 
                className="bg-[#111111] text-white hover:bg-neutral-800 px-6 py-3.5 text-xs uppercase tracking-widest transition-all duration-300 font-sans font-semibold"
              >
                Explore Collection
              </a>
            </div>
          </div>

          {/* Masterpiece Floating Exhibit */}
          <div className="lg:col-span-6 flex justify-center relative">
            {/* Museum Tag */}
            <div className="absolute z-10 bottom-6 left-6 bg-white/95 backdrop-blur-sm p-4 shadow-sm border border-neutral-100 max-w-xs font-sans">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">Exhibit I</p>
              <h4 className="font-serif text-sm text-[#111111] font-normal mt-0.5">Saffron Abstraction & Himalayan Mist</h4>
              <p className="text-[10px] text-neutral-500 mt-1 font-mono">Oil, Clay & Gold Leafing on Canvas</p>
            </div>
            
            {/* Visual Frame */}
            <div className="relative max-w-md w-full bg-neutral-50 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.06)] border border-neutral-100/50">
              <div className="aspect-[4/5] w-full overflow-hidden relative grayscale-[10%] hover:grayscale-0 transition-all duration-[1000ms] ease-out">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/indian_art_hero.png" 
                  alt="Featured Indian Contemporary Artwork" 
                  className="w-full h-full object-cover scale-[1.01]" 
                />
              </div>
            </div>
            
            {/* Subtle background abstract shape */}
            <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-neutral-50 -z-10 mix-blend-multiply opacity-70 filter blur-2xl"></div>
          </div>
        </div>
      </div>

      {/* Main Staggered Asymmetrical Grid */}
      <main id="collection" className="max-w-7xl mx-auto px-8 pb-32 pt-24 scroll-mt-20">
        <div className="pb-8 border-b border-neutral-100 mb-16">
          <h2 className="font-serif text-2xl md:text-3xl tracking-tight text-[#111111] font-normal">
            The Exhibition
          </h2>
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 mt-1 font-sans">
            Currently Available Original Works
          </p>
        </div>
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
          <div className="flex items-center gap-4">
            <span>&copy; {new Date().getFullYear()} northernart11</span>
            <span>•</span>
            <Link 
              href="/admin" 
              className="hover:text-[#111111] transition-colors duration-300 lowercase tracking-normal"
            >
              studio login
            </Link>
          </div>
          <span>Curated with absolute minimalism</span>
        </div>
      </footer>
    </div>
  );
}
