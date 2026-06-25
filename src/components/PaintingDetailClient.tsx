'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, ShoppingBag } from 'lucide-react';

interface Painting {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string;
  additional_images: string[] | null;
  dimensions: string | null;
  medium: string | null;
  status: string;
}

interface PaintingDetailClientProps {
  painting: Painting;
}

export default function PaintingDetailClient({ painting }: PaintingDetailClientProps) {
  const secondaryImages = painting.additional_images && Array.isArray(painting.additional_images) 
    ? painting.additional_images 
    : [];
  
  const allImages = [painting.image_url, ...secondaryImages];
  
  const [activeImage, setActiveImage] = useState(painting.image_url);
  const [isInCart, setIsInCart] = useState(false);

  // Check if item is already in cart on mount
  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setIsInCart(cart.includes(painting.id));
    } catch (e) {
      console.error('Failed to parse cart localstorage:', e);
    }
  }, [painting.id]);

  const handleAddToCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (!cart.includes(painting.id)) {
        cart.push(painting.id);
        localStorage.setItem('cart', JSON.stringify(cart));
        setIsInCart(true);
        // Dispatch global event so the nav header updates its cart counter
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (e) {
      console.error('Failed to add item to cart:', e);
    }
  };

  const formatPrice = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  // Pre-configured WhatsApp Inquiry Link
  const getWhatsAppLink = () => {
    const artistPhone = process.env.NEXT_PUBLIC_ARTIST_WHATSAPP || '919999999999';
    const message = encodeURIComponent(
      `Hello northernart11. I am interested in inquiring about your artwork titled "${painting.title}" (${painting.medium || ''}, ${painting.dimensions || ''}). Is it still available?`
    );
    return `https://wa.me/${artistPhone}?text=${message}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
      
      {/* Left Side: Artwork Visual View & Carousel */}
      <div className="lg:col-span-7 space-y-6 fade-in">
        {/* Main Display Image */}
        <div className="bg-neutral-50 overflow-hidden relative flex items-center justify-center min-h-[50vh] max-h-[80vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeImage}
            src={activeImage}
            alt={painting.title}
            className="w-full h-auto max-h-[80vh] object-contain mx-auto fade-in"
          />
        </div>
        
        {/* Thumbnail Carousel for Multi-Images */}
        {allImages.length > 1 && (
          <div className="flex flex-wrap gap-3 items-center justify-start pt-2">
            {allImages.map((imgUrl, index) => {
              const isActive = imgUrl === activeImage;
              return (
                <button
                  key={index}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`h-16 w-16 bg-neutral-50 border transition-all duration-300 ${
                    isActive 
                      ? 'border-[#111111] opacity-100 scale-105' 
                      : 'border-neutral-100 hover:border-neutral-300 opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`View ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Side: Details & Actions */}
      <div className="lg:col-span-5 space-y-8 fade-in" style={{ animationDelay: '150ms' }}>
        
        {/* Metadata Block */}
        <div className="space-y-4">
          <h2 className="font-serif text-3xl md:text-4xl tracking-tight text-[#111111] font-normal leading-tight">
            {painting.title}
          </h2>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs uppercase tracking-widest text-neutral-400 font-sans border-b border-neutral-100 pb-4">
            {painting.medium && <span>{painting.medium}</span>}
            {painting.medium && painting.dimensions && <span>•</span>}
            {painting.dimensions && <span>{painting.dimensions}</span>}
          </div>

          <p className="text-xl font-light text-[#111111] tracking-wide">
            {formatPrice(painting.price)}
          </p>
        </div>

        {/* Story Narrative */}
        {painting.description && (
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-sans">
              Artist Narrative
            </h4>
            <p className="text-sm text-neutral-600 leading-relaxed font-light whitespace-pre-line">
              {painting.description}
            </p>
          </div>
        )}

        {/* Action Trigger Interface */}
        {painting.status === 'sold' ? (
          <div className="space-y-4">
            <button
              disabled
              className="w-full border border-neutral-200 text-neutral-400 py-4 text-xs uppercase tracking-[0.2em] font-sans disabled:cursor-not-allowed text-center"
            >
              Private Collection (Sold)
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {isInCart ? (
              <Link
                href="/cart"
                className="w-full bg-[#111111] hover:bg-neutral-800 text-white py-4 text-xs uppercase tracking-[0.2em] font-sans transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <Check size={14} />
                Added to Cart — View Cart
                <ArrowRight size={14} />
              </Link>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full bg-[#111111] hover:bg-neutral-800 text-white py-4 text-xs uppercase tracking-[0.2em] font-sans transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <ShoppingBag size={14} />
                Add to Cart
              </button>
            )}

            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full border border-neutral-200 hover:border-[#111111] text-neutral-600 hover:text-[#111111] py-4 text-xs uppercase tracking-[0.2em] font-sans transition-colors duration-300 block text-center"
            >
              Inquire via WhatsApp
            </a>
          </div>
        )}

        {/* Secure transaction disclaimer */}
        <div className="text-[10px] text-neutral-400 text-center leading-relaxed">
          Paintings include shipping insurance and custom packaging.
        </div>

      </div>
    </div>
  );
}
