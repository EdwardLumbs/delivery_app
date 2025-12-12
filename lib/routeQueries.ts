// React Query-based route caching for Google Maps API optimization
import { queryClient } from './queryClient'

export interface CachedRoute {
    coordinates: {latitude: number, longitude: number}[]
    distance: number // meters
    duration: number // seconds
    optimizedSequence?: number[]
}

/**
 * Generate cache key for route
 */
function generateRouteKey(
    origin: [number, number], 
    destinations: [number, number][], 
    optimize: boolean = false
): string {
    const originStr = `${origin[1].toFixed(4)},${origin[0].toFixed(4)}`
    const destStr = destinations
        .map(([lng, lat]) => `${lat.toFixed(4)},${lng.toFixed(4)}`)
        .sort() // Sort to handle same destinations in different order
        .join('|')
    
    return `route-${originStr}-${destStr}${optimize ? '-opt' : ''}`
}

/**
 * Get cached route using React Query
 */
export function getCachedRoute(
    origin: [number, number], 
    destinations: [number, number][], 
    optimize: boolean = false
): CachedRoute | undefined {
    const key = generateRouteKey(origin, destinations, optimize)
    const cachedData = queryClient.getQueryData<CachedRoute>([key])
    
    if (cachedData) {
        console.log(`🎯 React Query Cache HIT for route: ${key}`)
    }
    
    return cachedData
}

/**
 * Store route in React Query cache
 */
export function setCachedRoute(
    origin: [number, number], 
    destinations: [number, number][], 
    route: CachedRoute,
    optimize: boolean = false
): void {
    const key = generateRouteKey(origin, destinations, optimize)
    
    // Cache for 24 hours (fish delivery routes are stable)
    queryClient.setQueryData([key], route)
    
    console.log(`💾 React Query Cache SET for route: ${key}`)
}

/**
 * Invalidate route cache (useful for testing or when routes change)
 */
export function invalidateRouteCache(): void {
    queryClient.invalidateQueries({
        predicate: (query) => {
            return Array.isArray(query.queryKey) && 
                   typeof query.queryKey[0] === 'string' && 
                   query.queryKey[0].startsWith('route-')
        }
    })
    console.log('🗑️ Route cache invalidated')
}

/**
 * Get route cache statistics
 */
export function getRouteCacheStats(): { size: number } {
    const cache = queryClient.getQueryCache()
    const routeQueries = cache.getAll().filter(query => 
        Array.isArray(query.queryKey) && 
        typeof query.queryKey[0] === 'string' && 
        query.queryKey[0].startsWith('route-')
    )
    
    return {
        size: routeQueries.length
    }
}

// Configure default cache time for route queries in queryClient
// This is handled in queryClient.ts with defaultOptions