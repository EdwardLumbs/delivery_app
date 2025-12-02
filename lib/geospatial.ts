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
 * Restaurant location (Kawit, Cavite)
 * Update these coordinates to your actual restaurant location
 */
export const RESTAURANT_LOCATION = {
    longitude: 120.9025,
    latitude: 14.4444,
    name: 'Main Restaurant',
    address: 'Kawit, Cavite'
}
