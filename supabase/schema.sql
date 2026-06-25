-- SQL Schema for northernart11
-- Execute this script in your Supabase SQL Editor (https://supabase.com)

-- 1. Create paintings table
CREATE TABLE IF NOT EXISTS public.paintings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    price BIGINT NOT NULL, -- stored in paise (1 INR = 100 paise)
    image_url TEXT NOT NULL,
    dimensions TEXT,
    medium TEXT,
    status TEXT NOT NULL DEFAULT 'available' CONSTRAINT check_painting_status CHECK (status IN ('available', 'sold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    painting_id UUID REFERENCES public.paintings(id) ON DELETE RESTRICT,
    order_id TEXT UNIQUE NOT NULL, -- Razorpay Order ID
    payment_id TEXT, -- Razorpay Payment ID (filled after capture)
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_phone TEXT,
    shipping_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'created', -- 'created', 'paid', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) on both tables
ALTER TABLE public.paintings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Set up policies for paintings:
-- 1. Anyone can view paintings (public read)
CREATE POLICY "Allow public read access to paintings" 
ON public.paintings FOR SELECT 
USING (true);

-- 2. Service role / admin can perform all operations (insert, update, delete)
CREATE POLICY "Allow service role all operations on paintings" 
ON public.paintings FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Set up policies for orders:
-- 1. Only admin/service role can view and modify orders (orders are private)
CREATE POLICY "Allow service role all operations on orders" 
ON public.orders FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Allow anonymous insert for webhook/checkout operations (if needed, otherwise service_role handles it)
-- Note: Since we use service_role client for API route handlers (backend), public access is disabled by default.

-- Instructions for Supabase Storage:
-- 1. Create a public bucket named "paintings"
-- 2. Set storage policy for "paintings" bucket to allow public read access
-- 3. Set storage policy to allow authenticated/service_role upload access

-- Migration: Add support for multiple secondary images
ALTER TABLE public.paintings 
ADD COLUMN IF NOT EXISTS additional_images JSONB DEFAULT '[]'::jsonb;

-- Migration: Add support for multiple painting acquisitions in orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS painting_ids JSONB DEFAULT '[]'::jsonb,
ALTER COLUMN painting_id DROP NOT NULL;


