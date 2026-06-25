'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';
import { Check, Loader2, ArrowLeft, ShieldCheck, CreditCard } from 'lucide-react';
import Header from '@/components/Header';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface Painting {
  id: string;
  title: string;
  price: number;
  image_url: string;
  dimensions: string | null;
  medium: string | null;
}

// Styled input wrapper component for the international PhoneInput
const CustomPhoneInput = React.forwardRef<HTMLInputElement, any>((props, ref) => {
  return (
    <input
      ref={ref}
      {...props}
      className="w-full bg-transparent text-[#111111] focus:outline-none text-sm py-2.5 font-sans"
    />
  );
});
CustomPhoneInput.displayName = 'CustomPhoneInput';

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<Painting[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Buyer Details
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState<string | undefined>('');

  // Structured Address Details
  const [streetAddress, setStreetAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');

  // Checkout execution states
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchCheckoutItems = async () => {
    try {
      const cartIds = JSON.parse(localStorage.getItem('cart') || '[]');
      if (cartIds.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('paintings')
        .select('id, title, price, image_url, dimensions, medium')
        .in('id', cartIds);

      if (error) throw error;
      setCartItems(data || []);
    } catch (err) {
      console.error('Failed to load cart items for checkout:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckoutItems();
  }, []);

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price, 0);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);
    setErrorMsg('');

    const paintingIds = cartItems.map(item => item.id);
    if (paintingIds.length === 0) {
      setErrorMsg('Your shopping cart is empty.');
      setCheckoutLoading(false);
      return;
    }

    if (!buyerPhone) {
      setErrorMsg('Please enter a valid phone number.');
      setCheckoutLoading(false);
      return;
    }

    // Format shipping address cleanly
    const formattedAddress = [
      streetAddress,
      apartment ? apartment : null,
      `${city}, ${state} ${postalCode}`,
      country
    ].filter(Boolean).join('\n');

    try {
      // 1. Create order ID on server
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paintingIds }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize order.');
      }

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error('Razorpay public Key ID is missing on the client.');
      }

      // 2. Launch Razorpay modal
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) {
        throw new Error('Razorpay gateway failed to load. Please refresh.');
      }

      const options = {
        key: keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'northernart11',
        description: `Purchase of ${cartItems.length} painting(s)`,
        image: cartItems[0]?.image_url || '',
        order_id: data.orderId,
        prefill: {
          name: buyerName,
          email: buyerEmail,
          contact: buyerPhone,
        },
        notes: {
          buyer_name: buyerName,
          shipping_address: formattedAddress,
          paintingIds: JSON.stringify(paintingIds),
          paintingTitles: cartItems.map(item => item.title).join(', '),
        },
        theme: {
          color: '#111111',
        },
        handler: function (response: any) {
          setSuccess(true);
          localStorage.removeItem('cart');
          window.dispatchEvent(new Event('cart-updated'));
        },
        modal: {
          ondismiss: function () {
            setCheckoutLoading(false);
          },
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during checkout setup.');
      setCheckoutLoading(false);
    }
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
      
      {/* Razorpay Script Import */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {/* Header */}
      <Header />

      {/* Checkout Screen */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-16 md:py-24">
        {success ? (
          <div className="max-w-md mx-auto text-center py-24 space-y-8 fade-in">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Check size={24} />
            </div>
            <h2 className="font-serif text-2xl tracking-tight">Order Placed</h2>
            <p className="text-sm text-neutral-600 leading-relaxed font-light">
              Thank you. Your payment was processed successfully. A confirmation receipt has been sent to your email. The artist will package and ship your painting shortly.
            </p>
            <div className="pt-4">
              <Link
                href="/"
                className="bg-[#111111] hover:bg-neutral-800 text-white py-3 px-8 text-xs uppercase tracking-[0.2em] font-sans transition-colors duration-300"
              >
                Return to Gallery
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-24 text-xs uppercase tracking-widest text-neutral-400">
            Preparing checkout details...
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <p className="text-xs uppercase tracking-widest text-neutral-400">No items available for checkout.</p>
            <Link href="/" className="inline-block bg-[#111111] text-white text-xs px-6 py-2.5 uppercase tracking-widest">
              Go to Gallery
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-28 items-start">
            
            {/* Left Panel: Checkout Form */}
            <div className="lg:col-span-7 space-y-16 fade-in">
              {/* Checkout Header */}
              <div className="border-b border-neutral-100 pb-6">
                <h2 className="font-serif text-3xl md:text-4xl tracking-tight">Checkout</h2>
              </div>

              {errorMsg && (
                <div className="text-xs text-red-500 border border-red-200 bg-red-50/50 p-4 text-center font-mono">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handlePayment} className="space-y-12">
                {/* 1. Contact Info Section */}
                <div className="space-y-6">
                  <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold border-b border-neutral-50 pb-2">
                    01. Contact Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-neutral-500 block font-medium">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 text-sm font-sans"
                        placeholder="e.g. buyer@domain.com"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-neutral-500 block font-medium">
                        Phone Number *
                      </label>
                      <PhoneInput
                        placeholder="Enter phone number"
                        value={buyerPhone}
                        onChange={setBuyerPhone}
                        defaultCountry="IN"
                        inputComponent={CustomPhoneInput}
                        className="flex items-center gap-3 border-b border-neutral-200 focus-within:border-[#111111] transition-colors duration-300 py-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Shipping Destination */}
                <div className="space-y-6">
                  <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold border-b border-neutral-50 pb-2">
                    02. Shipping Address
                  </h3>

                  <div className="space-y-8">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-neutral-500 block font-medium">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 text-sm font-sans"
                        placeholder="e.g. Eleanor Vance"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      <div className="md:col-span-8 space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-neutral-500 block font-medium">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 text-sm font-sans"
                          placeholder="e.g. 12 Baker Street"
                        />
                      </div>
                      <div className="md:col-span-4 space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-neutral-500 block font-medium">
                          Apt, Suite, Unit
                        </label>
                        <input
                          type="text"
                          value={apartment}
                          onChange={(e) => setApartment(e.target.value)}
                          className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 text-sm font-sans"
                          placeholder="e.g. Apartment 4B"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-neutral-500 block font-medium">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 text-sm font-sans"
                          placeholder="e.g. Mumbai"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-neutral-500 block font-medium">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 text-sm font-sans"
                          placeholder="e.g. Maharashtra"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-neutral-500 block font-medium">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 text-sm font-sans"
                          placeholder="e.g. 400001"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-neutral-500 block font-medium">
                          Country *
                        </label>
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 text-sm font-sans cursor-pointer"
                        >
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Singapore">Singapore</option>
                          <option value="Germany">Germany</option>
                          <option value="France">France</option>
                          <option value="United Arab Emirates">United Arab Emirates</option>
                          <option value="Australia">Australia</option>
                          <option value="Canada">Canada</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Secure Payment Gateway */}
                <div className="space-y-6">
                  <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold border-b border-neutral-50 pb-2">
                    03. Payment Method
                  </h3>
                  
                  <div className="border border-neutral-100 p-5 flex items-center justify-between bg-neutral-50/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 border border-neutral-200 bg-white">
                        <CreditCard size={18} className="text-neutral-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Credit Card / UPI / NetBanking</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">Secure payment via Razorpay</p>
                      </div>
                    </div>
                    <ShieldCheck size={20} className="text-neutral-400" />
                  </div>

                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="w-full bg-[#111111] hover:bg-neutral-800 text-white py-4 text-xs uppercase tracking-[0.2em] font-sans transition-colors duration-300 disabled:bg-neutral-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Opening Payment Gateway...
                      </>
                    ) : (
                      <>
                        Place Order
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Panel: Order Summary Card */}
            <div className="lg:col-span-5 border border-neutral-100 p-6 space-y-6 bg-neutral-50/20 sticky top-28 fade-in" style={{ animationDelay: '150ms' }}>
              <h3 className="font-serif text-lg tracking-tight border-b border-neutral-100 pb-3">Order Summary</h3>
              
              {/* Item List */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-neutral-100 overflow-hidden flex-shrink-0 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-sm tracking-tight truncate">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                        {item.medium || 'Painting'}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-medium shrink-0">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-neutral-100 pt-4 space-y-2">
                <div className="flex justify-between text-xs text-neutral-400 uppercase tracking-widest">
                  <span>Shipping</span>
                  <span className="font-mono text-emerald-600 font-semibold text-[10px]">Free</span>
                </div>
                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold">Total</span>
                  <span className="text-xl font-light font-mono">
                    {formatPrice(getSubtotal())}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-12 px-8 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs tracking-wider text-neutral-400 uppercase">
          <span>&copy; {new Date().getFullYear()} northernart11</span>
          <span>Curated with absolute minimalism</span>
        </div>
      </footer>
    </div>
  );
}
