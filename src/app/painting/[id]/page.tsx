import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import PaintingDetailClient from '@/components/PaintingDetailClient';
import Header from '@/components/Header';

// Revalidate on demand
export const revalidate = 0;
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const { data: painting } = await supabase
    .from('paintings')
    .select('*')
    .eq('id', id)
    .single();

  if (!painting) return {};

  const cleanDesc = painting.description 
    ? painting.description.substring(0, 155) 
    : `Acquire the original contemporary Indian masterpiece "${painting.title}" on northernart11.`;

  return {
    title: `${painting.title} | northernart11`,
    description: cleanDesc,
    openGraph: {
      title: `${painting.title} | northernart11`,
      description: cleanDesc,
      url: `https://northernart11.com/painting/${painting.id}`,
      images: [
        {
          url: painting.image_url,
          alt: painting.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${painting.title} | northernart11`,
      description: cleanDesc,
      images: [painting.image_url],
    },
  };
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

  // Visual Artwork Schema Markup
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    'name': painting.title,
    'image': painting.image_url,
    'description': painting.description || '',
    'artform': 'Painting',
    'artMedium': painting.medium || 'Oil on Canvas',
    'artworkSurface': 'Canvas',
    'creator': {
      '@type': 'Person',
      'name': 'Indian Contemporary Master'
    },
    'offers': {
      '@type': 'Offer',
      'price': (painting.price / 100).toString(),
      'priceCurrency': 'INR',
      'availability': painting.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'url': `https://northernart11.com/painting/${painting.id}`,
      'seller': {
        '@type': 'ArtGallery',
        'name': 'northernart11'
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans selection:bg-neutral-100">
      {/* Schema Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* Unified Nav Header */}
      <Header />

      {/* Render the interactive Client detail component */}
      <main className="max-w-7xl mx-auto px-8 py-8 md:py-16">
        <PaintingDetailClient painting={painting} />
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-neutral-100 py-12 px-8 mt-24">
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

