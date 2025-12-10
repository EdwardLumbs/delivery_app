import { supabase } from './supabase'

/**
 * Calculate delivery distance from restaurant to user's address
 * @param userId - User's UUID
 * @param restaurantLon - Restaurant longitude
 * @param restaurantLat - Restaurant latitude
 * @returns Distance in kilometers
 */
export async function getDeliveryDistance(
    userId: string,
    restaurantLon: number,
    restaurantLat: number
): Promise<number | null> {
    try {
        const { data, error } = await supabase.rpc('get_delivery_distance', {
            user_id: userId,
            restaurant_lon: restaurantLon,
            restaurant_lat: restaurantLat
        })

        if (error) {
            console.error('getDeliveryDistance error:', error)
            return null
        }

        return data as number
    } catch (error) {
        console.error('getDeliveryDistance error:', error)
        return null
    }
}

/**
 * Calculate delivery fee based on distance
 * @param distanceKm - Distance in kilometers
 * @returns Delivery fee in pesos
 */
export function calculateDeliveryFee(distanceKm: number): number {
    if (distanceKm < 3) return 50
    if (distanceKm < 5) return 75
    if (distanceKm < 10) return 100
    return Math.ceil(distanceKm * 15) // ₱15 per km for distances over 10km
}

/**
 * Check if user is within delivery radius
 * @param userId - User's UUID
 * @param restaurantLon - Restaurant longitude
 * @param restaurantLat - Restaurant latitude
 * @param maxDistanceKm - Maximum delivery distance in km (default: 10)
 * @returns true if within radius, false otherwise
 */
export async function isWithinDeliveryRadius(
    userId: string,
    restaurantLon: number,
    restaurantLat: number,
    maxDistanceKm: number = 10
): Promise<boolean> {
    const distance = await getDeliveryDistance(userId, restaurantLon, restaurantLat)
    
    if (distance === null) return false
    
    return distance <= maxDistanceKm
}

/**
 * Check if a location is within the delivery zone
 * @param longitude - Location longitude
 * @param latitude - Location latitude
 * @returns true if within delivery zone, false otherwise
 */
export async function isWithinDeliveryZone(
    longitude: number,
    latitude: number
): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc('is_within_delivery_zone', {
            check_lon: longitude,
            check_lat: latitude
        })

        if (error) {
            console.error('isWithinDeliveryZone error:', error)
            return false
        }

        return data as boolean
    } catch (error) {
        console.error('isWithinDeliveryZone error:', error)
        return false
    }
}

/**
 * Get delivery zone polygon coordinates for map display
 * NOTE: Use with React Query for automatic caching
 * @returns Array of coordinates [{latitude, longitude}] or null
 */
export async function getDeliveryZonePolygon(): Promise<{latitude: number, longitude: number}[] | null> {
    try {
        const { data: geoJsonData, error: geoJsonError } = await supabase.rpc('get_delivery_zone_geojson')
        
        if (geoJsonError || !geoJsonData) {
            console.error('getDeliveryZonePolygon GeoJSON error:', geoJsonError)
            return null
        }

        // Convert GeoJSON coordinates to map format
        const coordinates = geoJsonData.coordinates[0].map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0]
        }))

        console.log('Delivery zone polygon fetched')
        return coordinates
    } catch (error) {
        console.error('getDeliveryZonePolygon error:', error)
        return null
    }
}

/**
 * Restaurant location (Kawit, Cavite)
 * Update these coordinates to your actual restaurant location
 */
export const RESTAURANT_LOCATION = {
    longitude: 120.9025,
    latitude: 14.4444,
    name: 'Main Restaurant',
    address: 'Kawit, Cavite'
}
