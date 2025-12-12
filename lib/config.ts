// Configuration for delivery system
export const DELIVERY_CONFIG = {
    // Google Maps API configuration
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    
    // Route optimization settings (can be moved to database later)
    REASSIGNMENT_RULES: {
        MAX_DELAY_MINUTES: 10,           // Never delay original orders >10 min
        MAX_RETURN_DISTANCE: 3,          // Only if driver <3km from supplier (in km)
        MAX_TIME_WINDOW: 8,              // Only reassign within 8 min of departure
        MIN_EFFICIENCY_GAIN: 0.25,       // Must save at least 25% total distance
        MAX_ADDITIONAL_ORDERS: 1         // Only add 1 order per reassignment
    },
    
    // Caching settings
    ROUTE_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    
    // Performance settings
    STRAIGHT_LINE_PREFILTER_THRESHOLD: 10, // km - don't call Google Maps if straight-line > this
    BATCH_DISTANCE_THRESHOLD: 2, // Use batch API if checking >= this many drivers
    
    // Default supplier location (will be moved to app config table)
    SUPPLIER_LOCATION: [120.9025, 14.4444] as [number, number], // Kawit
    
    // Driver settings
    DEFAULT_MAX_CONCURRENT_ORDERS: 3,
    AVERAGE_DRIVING_SPEED: 30, // km/h for fallback calculations
}

// Validation
export function validateConfig(): { isValid: boolean, errors: string[] } {
    const errors: string[] = []
    
    if (!DELIVERY_CONFIG.GOOGLE_MAPS_API_KEY) {
        errors.push('Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY or EXPO_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.')
    }
    
    if (DELIVERY_CONFIG.REASSIGNMENT_RULES.MAX_RETURN_DISTANCE <= 0) {
        errors.push('MAX_RETURN_DISTANCE must be greater than 0')
    }
    
    if (DELIVERY_CONFIG.REASSIGNMENT_RULES.MIN_EFFICIENCY_GAIN <= 0 || DELIVERY_CONFIG.REASSIGNMENT_RULES.MIN_EFFICIENCY_GAIN >= 1) {
        errors.push('MIN_EFFICIENCY_GAIN must be between 0 and 1')
    }
    
    return {
        isValid: errors.length === 0,
        errors
    }
}

// Log configuration status
export function logConfigStatus(): void {
    const validation = validateConfig()
    
    console.log('🚚 Delivery System Configuration:')
    console.log(`  Google Maps API: ${DELIVERY_CONFIG.GOOGLE_MAPS_API_KEY ? '✅ Configured' : '❌ Missing'}`)
    console.log(`  Route Caching: ✅ Enabled (${DELIVERY_CONFIG.ROUTE_CACHE_DURATION / 1000 / 60 / 60}h TTL)`)
    console.log(`  Batch Optimization: ✅ Enabled (${DELIVERY_CONFIG.BATCH_DISTANCE_THRESHOLD}+ drivers)`)
    console.log(`  Pre-filtering: ✅ Enabled (${DELIVERY_CONFIG.STRAIGHT_LINE_PREFILTER_THRESHOLD}km threshold)`)
    
    if (!validation.isValid) {
        console.warn('⚠️ Configuration Issues:')
        validation.errors.forEach(error => console.warn(`  - ${error}`))
    }
}