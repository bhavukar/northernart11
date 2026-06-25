import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PaintingDetailClient from '@/components/PaintingDetailClient';
import Header from '@/components/Header';

// Revalidate on demand
export const revalidate = 0;
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PaintingDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Fetch painting details
  const { data: painting, error } = await supabase
    .from('paintings')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !painting) {
    console.error('Error fetching painting details:', error);
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans selection:bg-neutral-100">
      {/* Unified Nav Header */}
      <Header />

      {/* Render the interactive Client detail component */}
      <main className="max-w-7xl mx-auto px-8 py-8 md:py-16">
        <PaintingDetailClient painting={painting} />
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-neutral-100 py-12 px-8 mt-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs tracking-wider text-neutral-400 uppercase">
          <span>&copy; {new Date().getFullYear()} northernart11</span>
          <span>Curated with absolute minimalism</span>
        </div>
      </footer>
    </div>
  );
}
