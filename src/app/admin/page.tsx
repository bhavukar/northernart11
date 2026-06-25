'use strict';
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, LogOut, Package, Image as ImageIcon, ShoppingBag, Eye, Trash2, ToggleLeft, ToggleRight, Loader2, Images } from 'lucide-react';

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
  created_at: string;
}

interface Order {
  id: string;
  order_id: string;
  payment_id: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  shipping_address: string;
  status: string;
  created_at: string;
  paintings: {
    title: string;
    image_url: string;
    price: number;
  } | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'catalog' | 'upload' | 'acquisitions'>('catalog');
  
  // Data lists
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Loading & error states
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Operation loaders (key is paintingId)
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  // Form states
  const [title, setTitle] = useState('');
  const [medium, setMedium] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [priceInInr, setPriceInInr] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<FileList | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch catalog inventory
  const fetchCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const res = await fetch('/api/admin/paintings');
      if (!res.ok) throw new Error('Failed to retrieve paintings catalog.');
      const data = await res.json();
      setPaintings(data.paintings || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading catalog');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      if (!res.ok) throw new Error('Failed to retrieve orders.');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading orders');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
    fetchOrders();
  }, [fetchCatalog, fetchOrders]);

  // Handle logout
  const handleLogout = () => {
    document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    router.push('/admin/login');
    router.refresh();
  };

  // Toggle availability status
  const handleToggleStatus = async (paintingId: string, currentStatus: string) => {
    setActionLoading(prev => ({ ...prev, [paintingId]: true }));
    setErrorMsg('');
    setSuccessMsg('');
    const newStatus = currentStatus === 'available' ? 'sold' : 'available';

    try {
      const res = await fetch(`/api/admin/paintings/${paintingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');

      // Update state
      setPaintings(prev =>
        prev.map(p => (p.id === paintingId ? { ...p, status: newStatus } : p))
      );
      setSuccessMsg(`"${data.painting.title}" status updated to ${newStatus}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update status');
    } finally {
      setActionLoading(prev => ({ ...prev, [paintingId]: false }));
    }
  };

  // Delete painting
  const handleDeletePainting = async (paintingId: string, paintingTitle: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete "${paintingTitle}"? This will remove all image files from storage and cannot be undone.`)) {
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [paintingId]: true }));
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/admin/paintings/${paintingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete painting');

      setPaintings(prev => prev.filter(p => p.id !== paintingId));
      setSuccessMsg(`"${paintingTitle}" has been permanently deleted.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete painting');
    } finally {
      setActionLoading(prev => ({ ...prev, [paintingId]: false }));
    }
  };

  // Submit new painting (Cover + Secondary Images)
  const handleCreatePainting = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!coverImage) {
      setErrorMsg('Please select a cover image.');
      setFormLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('medium', medium);
      formData.append('dimensions', dimensions);
      formData.append('price', priceInInr);
      formData.append('description', description);
      formData.append('image', coverImage);
      
      if (additionalFiles) {
        // Append up to 4 additional gallery images
        const fileLimit = Math.min(additionalFiles.length, 4);
        for (let i = 0; i < fileLimit; i++) {
          formData.append('additional_images', additionalFiles[i]);
        }
      }

      const res = await fetch('/api/admin/paintings', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish artwork');

      setSuccessMsg(`Successfully published "${title}" with cover and gallery images.`);
      
      // Reset form states
      setTitle('');
      setMedium('');
      setDimensions('');
      setPriceInInr('');
      setDescription('');
      setCoverImage(null);
      setAdditionalFiles(null);
      
      const coverInput = document.getElementById('cover-image') as HTMLInputElement;
      const galleryInput = document.getElementById('gallery-images') as HTMLInputElement;
      if (coverInput) coverInput.value = '';
      if (galleryInput) galleryInput.value = '';

      // Refresh catalog list and direct to catalog tab
      await fetchCatalog();
      setActiveTab('catalog');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish artwork');
    } finally {
      setFormLoading(false);
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
    <div className="min-h-screen bg-white text-[#111111] font-sans antialiased selection:bg-neutral-100">
      {/* Dashboard Top Header */}
      <header className="border-b border-neutral-100 py-6 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl tracking-tight text-[#111111]">
            northernart11
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mt-1">
            Fine Art Studio CMS
          </p>
        </div>
        <div className="flex items-center gap-6">
          {/* Minimal tab navigation */}
          <nav className="flex items-center gap-6 text-xs uppercase tracking-wider font-medium text-neutral-400">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`pb-1 transition-all duration-300 border-b ${
                activeTab === 'catalog'
                  ? 'text-[#111111] border-[#111111]'
                  : 'hover:text-[#111111] border-transparent'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-1 transition-all duration-300 border-b ${
                activeTab === 'upload'
                  ? 'text-[#111111] border-[#111111]'
                  : 'hover:text-[#111111] border-transparent'
              }`}
            >
              Upload Artwork
            </button>
            <button
              onClick={() => setActiveTab('acquisitions')}
              className={`pb-1 transition-all duration-300 border-b ${
                activeTab === 'acquisitions'
                  ? 'text-[#111111] border-[#111111]'
                  : 'hover:text-[#111111] border-transparent'
              }`}
            >
              Orders
            </button>
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-500 hover:text-[#111111] transition-colors duration-300 ml-4 border-l border-neutral-200 pl-4"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto py-10 px-8">
        
        {/* Global Success / Error Messages */}
        {errorMsg && (
          <div className="text-xs text-red-500 border border-red-200 bg-red-50/50 p-4 text-center font-mono mb-8 fade-in">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="text-xs text-emerald-600 border border-emerald-200 bg-emerald-50/50 p-4 text-center font-mono mb-8 fade-in">
            {successMsg}
          </div>
        )}

        {/* TAB 1: CATALOG INVENTORY LISTING */}
        {activeTab === 'catalog' && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h2 className="font-serif text-xl tracking-tight">Inventory</h2>
                <p className="text-xs text-neutral-400 mt-1 font-sans">
                  Manage painting availability, edit details, or remove records from the grid.
                </p>
              </div>
              <button
                onClick={fetchCatalog}
                className="p-2 border border-neutral-200 hover:border-neutral-400 transition-colors duration-300"
                title="Refresh Catalog"
              >
                <RefreshCw size={14} className={catalogLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {catalogLoading && paintings.length === 0 ? (
              <div className="text-center py-24 text-neutral-400 text-xs uppercase tracking-wider">
                Loading catalog inventory...
              </div>
            ) : paintings.length === 0 ? (
              <div className="border border-neutral-100 p-16 text-center text-neutral-400 text-xs flex flex-col items-center gap-2">
                <ImageIcon size={22} className="text-neutral-300" />
                <span>Inventory is currently empty. Click &quot;Upload Artwork&quot; to begin.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paintings.map(painting => (
                  <div
                    key={painting.id}
                    className="border border-neutral-100 p-4 flex flex-col space-y-4 hover:border-neutral-300 transition-colors duration-300 relative group"
                  >
                    {/* Visual Preview */}
                    <div className="aspect-[4/3] w-full bg-neutral-50 relative overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={painting.image_url}
                        alt={painting.title}
                        className="object-cover h-full w-full"
                      />
                      {/* Badge for multiple images */}
                      {painting.additional_images && painting.additional_images.length > 0 && (
                        <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 text-[10px] uppercase font-mono tracking-wider text-[#111111] flex items-center gap-1 shadow-sm">
                          <Images size={10} />
                          +{painting.additional_images.length}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="font-serif text-base tracking-tight truncate">
                          {painting.title}
                        </h4>
                        <span className="text-xs font-mono font-medium text-neutral-500 shrink-0">
                          {formatPrice(painting.price)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 font-sans tracking-wide">
                        {painting.medium || 'N/A'} • {painting.dimensions || 'N/A'}
                      </p>
                    </div>

                    {/* Quick actions panel */}
                    <div className="flex items-center justify-between border-t border-neutral-50 pt-3 text-xs gap-3">
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 font-mono ${
                            painting.status === 'available'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {painting.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle Status Button */}
                        <button
                          disabled={actionLoading[painting.id]}
                          onClick={() => handleToggleStatus(painting.id, painting.status)}
                          className="p-1.5 border border-neutral-100 hover:border-neutral-300 text-neutral-500 hover:text-[#111111] transition-colors duration-300 disabled:opacity-50"
                          title="Toggle Status (Sold/Available)"
                        >
                          {painting.status === 'available' ? (
                            <ToggleLeft size={16} />
                          ) : (
                            <ToggleRight size={16} className="text-[#111111]" />
                          )}
                        </button>

                        {/* View Button */}
                        <a
                          href={`/painting/${painting.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 border border-neutral-100 hover:border-neutral-300 text-neutral-500 hover:text-[#111111] transition-colors duration-300"
                          title="View Live Listing"
                        >
                          <Eye size={14} />
                        </a>

                        {/* Delete Button */}
                        <button
                          disabled={actionLoading[painting.id]}
                          onClick={() => handleDeletePainting(painting.id, painting.title)}
                          className="p-1.5 border border-neutral-100 hover:border-red-300 text-neutral-500 hover:text-red-600 transition-colors duration-300 disabled:opacity-50"
                          title="Permanently Delete Painting"
                        >
                          {actionLoading[painting.id] ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UPLOAD ARTWORK FORM */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-8 fade-in">
            <div className="border-b border-neutral-100 pb-4">
              <h2 className="font-serif text-xl tracking-tight">Upload Masterpiece</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Upload a cover image along with supplementary pictures (details, alternate framing, or installation scale views).
              </p>
            </div>

            <form onSubmit={handleCreatePainting} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-widest text-neutral-400 block">
                  Artwork Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 text-sm"
                  placeholder="e.g. Echoes of Midnight"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest text-neutral-400 block">
                    Medium
                  </label>
                  <input
                    type="text"
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                    className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 text-sm"
                    placeholder="e.g. Mixed Media on Canvas"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest text-neutral-400 block">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 text-sm"
                    placeholder="e.g. 36 x 36 inches"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-widest text-neutral-400 block">
                  Price (INR) *
                </label>
                <input
                  type="number"
                  required
                  value={priceInInr}
                  onChange={(e) => setPriceInInr(e.target.value)}
                  className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 text-sm"
                  placeholder="e.g. 120000"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-widest text-neutral-400 block">
                  Story / Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-0 py-2 border-b border-neutral-200 text-[#111111] bg-transparent focus:outline-none focus:border-[#111111] transition-colors duration-300 text-sm resize-none"
                  placeholder="Tell the story or inspiration behind this artwork..."
                />
              </div>

              {/* Main Cover Image upload */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-neutral-400 block">
                  Cover Image (Primary View) *
                </label>
                <div className="border border-dashed border-neutral-200 hover:border-neutral-400 transition-colors duration-300 p-5 flex flex-col items-center justify-center bg-neutral-50/20">
                  <input
                    id="cover-image"
                    type="file"
                    required
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setCoverImage(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="cover-image" className="cursor-pointer flex flex-col items-center gap-2">
                    <ImageIcon size={20} className="text-neutral-400" />
                    <span className="text-xs text-neutral-500 hover:text-[#111111] transition-colors duration-300">
                      {coverImage ? coverImage.name : 'Choose cover image file'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Secondary Images Upload */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-neutral-400 block">
                  Supplementary Images (Max 4 secondary views)
                </label>
                <div className="border border-dashed border-neutral-200 hover:border-neutral-400 transition-colors duration-300 p-5 flex flex-col items-center justify-center bg-neutral-50/20">
                  <input
                    id="gallery-images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        setAdditionalFiles(e.target.files);
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="gallery-images" className="cursor-pointer flex flex-col items-center gap-2">
                    <Images size={20} className="text-neutral-400" />
                    <span className="text-xs text-neutral-500 hover:text-[#111111] transition-colors duration-300 text-center">
                      {additionalFiles && additionalFiles.length > 0 
                        ? `${additionalFiles.length} files selected` 
                        : 'Choose additional files (multiple allowed)'}
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-[#111111] hover:bg-neutral-800 text-white py-3 text-xs uppercase tracking-[0.2em] font-sans transition-colors duration-300 disabled:bg-neutral-300 flex items-center justify-center gap-2"
              >
                {formLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Uploading Assets...
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Publish artwork
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: COLLECTOR ORDERS */}
        {activeTab === 'acquisitions' && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h2 className="font-serif text-xl tracking-tight">Orders</h2>
                <p className="text-xs text-neutral-400 mt-1 font-sans">
                  Monitor order payments and buyer shipping details.
                </p>
              </div>
              <button
                onClick={fetchOrders}
                className="p-2 border border-neutral-200 hover:border-neutral-400 transition-colors duration-300"
                title="Refresh Orders"
              >
                <RefreshCw size={14} className={ordersLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {ordersLoading && orders.length === 0 ? (
              <div className="text-center py-24 text-neutral-400 text-xs uppercase tracking-wider">
                Retrieving order records...
              </div>
            ) : orders.length === 0 ? (
              <div className="border border-neutral-100 p-16 text-center text-neutral-400 text-xs flex flex-col items-center gap-2">
                <ShoppingBag size={22} className="text-neutral-300" />
                <span>No orders have been recorded yet.</span>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className="border border-neutral-100 p-5 space-y-4 hover:border-neutral-300 transition-colors duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-neutral-50 pb-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-400 font-mono">
                          Order #{order.order_id.replace('order_', '')}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-widest px-2.5 py-1 font-mono font-semibold ${
                          order.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Artwork details */}
                    {order.paintings ? (
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 relative bg-neutral-100 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={order.paintings.image_url}
                            alt={order.paintings.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-serif text-sm tracking-tight">{order.paintings.title}</h4>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Acquired for {formatPrice(order.paintings.price)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-red-500 font-mono flex items-center gap-1.5">
                        <Package size={12} />
                        Artwork reference removed
                      </div>
                    )}

                    {/* Buyer & shipping details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs border-t border-neutral-50">
                      <div className="space-y-1.5">
                        <h5 className="font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">
                          Buyer Details
                        </h5>
                        <p className="font-medium">{order.buyer_name}</p>
                        <p className="text-neutral-500 font-mono text-[11px]">{order.buyer_email}</p>
                        {order.buyer_phone && <p className="text-neutral-500 font-mono text-[11px]">{order.buyer_phone}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <h5 className="font-semibold text-neutral-500 uppercase tracking-wider text-[10px]">
                          Shipping Destination
                        </h5>
                        <p className="text-neutral-600 leading-relaxed whitespace-pre-line">
                          {order.shipping_address}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
