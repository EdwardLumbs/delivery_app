import { Linking, Platform } from 'react-native'

/**
 * Open device's native navigation app with route
 * Works with Google Maps, Apple Maps, Waze, etc.
 */
export function openNativeNavigation(
    destination: [number, number],
    waypoints?: [number, number][]
): void {
    const [destLng, destLat] = destination
    
    if (Platform.OS === 'ios') {
        // Apple Maps URL scheme
        let url = `http://maps.apple.com/?daddr=${destLat},${destLng}`
        
        if (waypoints && waypoints.length > 0) {
            // Apple Maps doesn't support waypoints well, so just go to first waypoint
            const [firstLng, firstLat] = waypoints[0]
            url = `http://maps.apple.com/?daddr=${firstLat},${firstLng}`
        }
        
        Linking.openURL(url)
    } else {
        // Google Maps URL scheme for Android
        let url = `google.navigation:q=${destLat},${destLng}`
        
        if (waypoints && waypoints.length > 0) {
            // Add waypoints for Google Maps
            const waypointStr = waypoints
                .map(([lng, lat]) => `${lat},${lng}`)
                .join('|')
            url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&waypoints=${waypointStr}&travelmode=driving`
        }
        
        Linking.openURL(url)
    }
}

/**
 * Generate route coordinates for React Native Maps Polyline
 * This creates a simple straight-line route between points
 * Good enough for MVP - shows driver the general path
 */
export function generateRouteCoordinates(
    supplierLocation: [number, number],
    deliveryLocations: [number, number][]
): Array<{latitude: number, longitude: number}> {
    const coordinates = []
    
    // Start at supplier
    coordinates.push({
        latitude: supplierLocation[1],
        longitude: supplierLocation[0]
    })
    
    // Add each delivery location
    for (const [lng, lat] of deliveryLocations) {
        coordinates.push({
            latitude: lat,
            longitude: lng
        })
    }
    
    return coordinates
}

/**
 * Create a simple route polyline for MapView
 * This draws straight lines between points - good enough for MVP
 */
export function createRoutePolyline(
    supplierLocation: [number, number],
    deliverySequence: [number, number][]
): Array<{latitude: number, longitude: number}> {
    return generateRouteCoordinates(supplierLocation, deliverySequence)
}