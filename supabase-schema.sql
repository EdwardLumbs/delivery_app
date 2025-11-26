-- =============================================
-- Supabase Database Schema for Food Ordering App
-- =============================================
-- Run this in your Supabase SQL Editor
-- https://app.supabase.com/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. Users Table
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- 2. Categories Table
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read categories
CREATE POLICY "Anyone can read categories" ON categories
    FOR SELECT USING (true);

-- =============================================
-- 3. Menu Table
-- =============================================
CREATE TABLE IF NOT EXISTS menu (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0,
    calories INTEGER,
    protein INTEGER,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;

-- Anyone can read menu
CREATE POLICY "Anyone can read menu" ON menu
    FOR SELECT USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_rating ON menu(rating DESC);

-- =============================================
-- 4. Customizations Table
-- =============================================
CREATE TABLE IF NOT EXISTS customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    type TEXT NOT NULL, -- 'topping', 'side', 'size', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE customizations ENABLE ROW LEVEL SECURITY;

-- Anyone can read customizations
CREATE POLICY "Anyone can read customizations" ON customizations
    FOR SELECT USING (true);

-- =============================================
-- 5. Menu Customizations (Junction Table)
-- =============================================
CREATE TABLE IF NOT EXISTS menu_customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_id UUID REFERENCES menu(id) ON DELETE CASCADE,
    customization_id UUID REFERENCES customizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(menu_id, customization_id)
);

-- Enable Row Level Security
ALTER TABLE menu_customizations ENABLE ROW LEVEL SECURITY;

-- Anyone can read menu customizations
CREATE POLICY "Anyone can read menu_customizations" ON menu_customizations
    FOR SELECT USING (true);

-- Create indexes for faster joins
CREATE INDEX IF NOT EXISTS idx_menu_customizations_menu ON menu_customizations(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_customizations_customization ON menu_customizations(customization_id);

-- =============================================
-- 6. Orders Table (for future use)
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_price DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'preparing', 'on_the_way', 'delivered', 'cancelled'
    delivery_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "Users can read own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);

-- =============================================
-- 7. Order Items Table (for future use)
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES menu(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    customizations JSONB, -- Store selected customizations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can read items from their own orders
CREATE POLICY "Users can read own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Create index
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- =============================================
-- 8. Driver Locations Table (for real-time tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS driver_locations (
    driver_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Anyone can read driver locations (for customers to track)
CREATE POLICY "Anyone can read driver locations" ON driver_locations
    FOR SELECT USING (true);

-- Drivers can update their own location
CREATE POLICY "Drivers can update own location" ON driver_locations
    FOR UPDATE USING (auth.uid() = driver_id);

-- =============================================
-- Functions and Triggers
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for orders table
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for driver_locations table
CREATE TRIGGER update_driver_locations_updated_at
    BEFORE UPDATE ON driver_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Enable Realtime (for driver tracking)
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- =============================================
-- Done!
-- =============================================
-- Now run the seed script from your React Native app
