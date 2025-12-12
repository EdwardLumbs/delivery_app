-- Create drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'offline' CHECK (status IN ('available', 'busy', 'on_delivery', 'offline')),
    current_orders INTEGER DEFAULT 0,
    max_concurrent_orders INTEGER DEFAULT 3,
    current_location GEOGRAPHY(POINT, 4326),
    last_location_update TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create driver routes table (one row per driver, updated frequently)
CREATE TABLE driver_routes (
    driver_id UUID PRIMARY KEY REFERENCES drivers(id) ON DELETE CASCADE,
    route_sequence JSONB DEFAULT '[]'::jsonb, -- Array of order IDs in delivery sequence
    route_data JSONB DEFAULT '{}'::jsonb, -- Route details (distances, coordinates, etc.)
    total_distance DECIMAL DEFAULT 0,
    estimated_duration INTEGER DEFAULT 0, -- in minutes
    supplier_location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add driver assignment to orders table
ALTER TABLE orders ADD COLUMN driver_id UUID REFERENCES drivers(id);
ALTER TABLE orders ADD COLUMN assigned_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN delivery_sequence INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN estimated_delivery_time TIMESTAMP;

-- Create delivery tracking table
CREATE TABLE delivery_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id),
    status TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX idx_orders_driver_status ON orders(driver_id, status);
CREATE INDEX idx_delivery_tracking_order ON delivery_tracking(order_id);

-- Insert sample drivers for testing
INSERT INTO drivers (name, phone, email, status) VALUES
('Driver 1', '+63-123-456-7891', 'driver1@fishdelivery.com', 'available'),
('Driver 2', '+63-123-456-7892', 'driver2@fishdelivery.com', 'available'),
('Driver 3', '+63-123-456-7893', 'driver3@fishdelivery.com', 'available');

-- Initialize driver routes
INSERT INTO driver_routes (driver_id, supplier_location) 
SELECT id, ST_GeogFromText('POINT(120.9025 14.4444)') -- Default Kawit supplier location
FROM drivers;

-- Create function to update driver route
CREATE OR REPLACE FUNCTION update_driver_route()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the driver routes table when orders are assigned
    IF TG_OP = 'UPDATE' AND OLD.driver_id IS DISTINCT FROM NEW.driver_id THEN
        -- Recalculate route for the driver
        -- This will be handled by the application logic
        UPDATE driver_routes 
        SET updated_at = NOW() 
        WHERE driver_id = NEW.driver_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for route updates
CREATE TRIGGER trigger_update_driver_route
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_driver_route();

-- RLS policies for drivers table
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read driver data (for customer tracking)
CREATE POLICY "Allow authenticated users to read drivers" ON drivers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read driver routes" ON driver_routes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read delivery tracking" ON delivery_tracking
    FOR SELECT TO authenticated USING (true);

-- Allow drivers to update their own data (will be refined when we add driver auth)
CREATE POLICY "Allow drivers to update their data" ON drivers
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow drivers to update routes" ON driver_routes
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow drivers to insert tracking" ON delivery_tracking
    FOR INSERT TO authenticated WITH CHECK (true);