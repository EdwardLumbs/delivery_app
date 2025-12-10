// Helper function to convert little-endian hex string to IEEE 754 double
const hexToDouble = (hex: string): number => {
    // Reverse byte order (little-endian to big-endian)
    const reversed = hex.match(/.{2}/g)?.reverse().join('') || ''
    
    // Convert to ArrayBuffer and then to Float64
    const buffer = new ArrayBuffer(8)
    const view = new DataView(buffer)
    
    for (let i = 0; i < 8; i++) {
        const byte = parseInt(reversed.substring(i * 2, i * 2 + 2), 16)
        view.setUint8(i, byte)
    }
    
    return view.getFloat64(0)
}

/**
 * Parse WKB coordinates from PostGIS to [longitude, latitude] format
 * Handles both GeoJSON objects and WKB binary strings
 */
export const parseCoordinates = (coords: string | { coordinates: [number, number] } | null): [number, number] | null => {
    if (!coords) return null
    
    // If it's already a GeoJSON object
    if (typeof coords === 'object' && 'coordinates' in coords) {
        return coords.coordinates
    }
    
    // If it's a WKB string from PostGIS (EWKB format)
    if (typeof coords === 'string' && coords.startsWith('0101000020E6100000')) {
        try {
            // PostGIS EWKB format: 0101000020E6100000 + 16 hex chars for X + 16 hex chars for Y
            // Skip the header (0101000020E6100000 = 18 chars)
            const hexData = coords.substring(18)
            
            if (hexData.length >= 32) {
                // Extract X (longitude) - first 16 hex chars
                const xHex = hexData.substring(0, 16)
                // Extract Y (latitude) - next 16 hex chars  
                const yHex = hexData.substring(16, 32)
                
                // Convert little-endian hex to IEEE 754 double
                const longitude = hexToDouble(xHex)
                const latitude = hexToDouble(yHex)
                
                // Validate coordinates are reasonable
                if (longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90) {
                    return [longitude, latitude]
                }
            }
        } catch (error) {
            console.log('Error parsing WKB:', error)
        }
    }
    
    return null
}