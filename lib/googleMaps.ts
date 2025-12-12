// Enhanced Google Maps integration with React Query caching and optimizations

import { getCachedRoute, setCachedRoute } from "./routeQueries"








interface GoogleMapsRoute {
    distance: number // meters
    duration: number // seconds
    polyline: string // encoded route for map display
    steps: RouteStep[]
    coordinates: {latitude: number, longitude: number}[] // For React Native Maps
}

interface RouteStep {
    instruction: string
    distance: number
    duration: number
    start_location: [number, number]
    end_location: [number, number]
}

interface OptimizedDeliveryResult {
    optimizedSequence: number[]
    totalDistance: number
    totalDuration: number
    route: GoogleMapsRoute
}

interface DistanceResult {
    distance: number // meters
    duration: number // seconds
}

/**
 * Decode Google Maps polyline to coordinates for React Native Maps
 */
function decodePolyline(encoded: string): {latitude: number, longitude: number}[] {
    const coordinates: {latitude: number, longitude: number}[] = []
    let index = 0
    let lat = 0
    let lng = 0

    while (index < encoded.length) {
        let b: number
        let shift = 0
        let result = 0

        do {
            b = encoded.charCodeAt(index++) - 63
            result |= (b & 0x1f) << shift
            shift += 5
        } while (b >= 0x20)

        const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1))
        lat += deltaLat

        shift = 0
        result = 0

        do {
            b = encoded.charCodeAt(index++) - 63
            result |= (b & 0x1f) << shift
            shift += 5
        } while (b >= 0x20)

        const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1))
        lng += deltaLng

        coordinates.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5
        })
    }

    return coordinates
}

/**
 * Calculate real driving route using Google Maps Directions API with caching
 */
export async function calculateDrivingRoute(
    origin: [number, number],
    destination: [number, number],
    waypoints?: [number, number][]
): Promise<GoogleMapsRoute> {
    // Check cache first
    const destinations = waypoints ? [...waypoints, destination] : [destination]
    const cachedRoute = getCachedRoute(origin, destinations, !!waypoints)
    
    if (cachedRoute) {
        return {
            distance: cachedRoute.distance,
            duration: cachedRoute.duration,
            polyline: '', // Not needed for cached routes
            steps: [], // Not needed for cached routes
            coordinates: cachedRoute.coordinates
        }
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
        console.warn('Google Maps API key not configured, using fallback')
        // Return straight-line fallback
        return createStraightLineRoute(origin, destination, waypoints)
    }

    const waypointsParam = waypoints 
        ? waypoints.map(([lng, lat]) => `${lat},${lng}`).join('|')
        : ''

    const url = `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${origin[1]},${origin[0]}` + // lat,lng format for Google
        `&destination=${destination[1]},${destination[0]}` +
        (waypointsParam ? `&waypoints=optimize:true|${waypointsParam}` : '') +
        `&key=${apiKey}`

    try {
        console.log('🗺️ Google Maps API call:', url.replace(apiKey, 'API_KEY'))
        const response = await fetch(url)
        const data = await response.json()

        if (data.status !== 'OK') {
            console.error('Google Maps API error:', data.status, data.error_message)
            return createStraightLineRoute(origin, destination, waypoints)
        }

        const route = data.routes[0]
        const coordinates = decodePolyline(route.overview_polyline.points)
        
        // Calculate total distance and duration
        let totalDistance = 0
        let totalDuration = 0
        
        for (const leg of route.legs) {
            totalDistance += leg.distance.value
            totalDuration += leg.duration.value
        }

        const result: GoogleMapsRoute = {
            distance: totalDistance,
            duration: totalDuration,
            polyline: route.overview_polyline.points,
            coordinates: coordinates,
            steps: route.legs[0]?.steps?.map((step: any) => ({
                instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
                distance: step.distance.value,
                duration: step.duration.value,
                start_location: [step.start_location.lng, step.start_location.lat],
                end_location: [step.end_location.lng, step.end_location.lat]
            })) || []
        }

        // Cache the result
        setCachedRoute(origin, destinations, {
            coordinates: coordinates,
            distance: totalDistance,
            duration: totalDuration,
            optimizedSequence: waypoints ? data.routes[0].waypoint_order : undefined
        }, !!waypoints)

        return result
    } catch (error) {
        console.error('Google Maps API error:', error)
        return createStraightLineRoute(origin, destination, waypoints)
    }
}

/**
 * Fallback: Create straight-line route when Google Maps fails
 */
function createStraightLineRoute(
    origin: [number, number],
    destination: [number, number],
    waypoints?: [number, number][]
): GoogleMapsRoute {
    const points = [origin, ...(waypoints || []), destination]
    const coordinates = points.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
    
    // Estimate distance (straight-line + 30% for roads)
    let totalDistance = 0
    for (let i = 0; i < points.length - 1; i++) {
        const dist = calculateHaversineDistance(points[i], points[i + 1])
        totalDistance += dist * 1000 * 1.3 // Convert to meters, add 30% for roads
    }
    
    const estimatedDuration = (totalDistance / 1000) / 30 * 3600 // 30 km/h average speed

    return {
        distance: totalDistance,
        duration: estimatedDuration,
        polyline: '',
        coordinates: coordinates,
        steps: []
    }
}

/**
 * Calculate straight-line distance using Haversine formula
 */
function calculateHaversineDistance(point1: [number, number], point2: [number, number]): number {
    const [lon1, lat1] = point1
    const [lon2, lat2] = point2
    
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
}

/**
 * Get driving distance between two points with caching and pre-filtering
 */
export async function getDrivingDistance(
    origin: [number, number],
    destination: [number, number]
): Promise<DistanceResult> {
    // Pre-filtering: Check straight-line distance first
    const straightLineDistance = calculateHaversineDistance(origin, destination)
    
    // If straight-line is too far, don't waste API call
    if (straightLineDistance > 10) { // 10km straight-line = ~13km driving
        return {
            distance: straightLineDistance * 1000 * 1.3, // Convert to meters, add 30%
            duration: (straightLineDistance / 30) * 3600 // 30 km/h average
        }
    }

    // Check cache first
    const cachedRoute = getCachedRoute(origin, [destination])
    if (cachedRoute) {
        return {
            distance: cachedRoute.distance,
            duration: cachedRoute.duration
        }
    }

    // Use Google Maps for accurate distance
    try {
        const route = await calculateDrivingRoute(origin, destination)
        
        // Cache the result for future use
        setCachedRoute(origin, [destination], {
            coordinates: route.coordinates,
            distance: route.distance,
            duration: route.duration
        })
        
        return {
            distance: route.distance,
            duration: route.duration
        }
    } catch (error) {
        console.error('Error getting driving distance:', error)
        // Fallback to straight-line estimate
        return {
            distance: straightLineDistance * 1000 * 1.3,
            duration: (straightLineDistance / 30) * 3600
        }
    }
}

/**
 * Batch distance calculations using Google Maps Distance Matrix API
 */
export async function getBatchDistances(
    origins: [number, number][],
    destinations: [number, number][]
): Promise<DistanceResult[][]> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
        console.warn('Google Maps API key not configured, using straight-line fallback')
        return origins.map(origin => 
            destinations.map(dest => ({
                distance: calculateHaversineDistance(origin, dest) * 1000 * 1.3,
                duration: (calculateHaversineDistance(origin, dest) / 30) * 3600
            }))
        )
    }

    const originsParam = origins.map(([lng, lat]) => `${lat},${lng}`).join('|')
    const destinationsParam = destinations.map(([lng, lat]) => `${lat},${lng}`).join('|')

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
        `origins=${originsParam}` +
        `&destinations=${destinationsParam}` +
        `&key=${apiKey}`

    try {
        console.log('🗺️ Google Maps Distance Matrix API call')
        const response = await fetch(url)
        const data = await response.json()

        if (data.status !== 'OK') {
            throw new Error(`Distance Matrix API error: ${data.status}`)
        }

        return data.rows.map((row: any) => 
            row.elements.map((element: any) => ({
                distance: element.distance?.value || 0,
                duration: element.duration?.value || 0
            }))
        )
    } catch (error) {
        console.error('Distance Matrix API error:', error)
        // Fallback to straight-line calculations
        return origins.map(origin => 
            destinations.map(dest => ({
                distance: calculateHaversineDistance(origin, dest) * 1000 * 1.3,
                duration: (calculateHaversineDistance(origin, dest) / 30) * 3600
            }))
        )
    }
}

/**
 * Optimize multiple waypoints using Google Maps with caching
 */
export async function optimizeMultipleDeliveries(
    supplierLocation: [number, number],
    deliveryLocations: [number, number][]
): Promise<OptimizedDeliveryResult> {
    if (deliveryLocations.length === 0) {
        throw new Error('No delivery locations provided')
    }

    if (deliveryLocations.length === 1) {
        // Single delivery - direct route
        const route = await calculateDrivingRoute(supplierLocation, deliveryLocations[0])
        return {
            optimizedSequence: [0],
            totalDistance: route.distance,
            totalDuration: route.duration,
            route
        }
    }

    // Check cache first
    const cachedRoute = getCachedRoute(supplierLocation, deliveryLocations, true)
    if (cachedRoute && cachedRoute.optimizedSequence) {
        // Reconstruct route from cache
        const optimizedLocations = cachedRoute.optimizedSequence.map(i => deliveryLocations[i])
        const route = await calculateDrivingRoute(supplierLocation, optimizedLocations[optimizedLocations.length - 1], optimizedLocations.slice(0, -1))
        
        return {
            optimizedSequence: cachedRoute.optimizedSequence,
            totalDistance: cachedRoute.distance,
            totalDuration: cachedRoute.duration,
            route
        }
    }

    // Multiple deliveries - let Google optimize the waypoints
    const lastDelivery = deliveryLocations[deliveryLocations.length - 1]
    const waypoints = deliveryLocations.slice(0, -1) // All except last

    try {
        const route = await calculateDrivingRoute(
            supplierLocation,
            lastDelivery,
            waypoints
        )

        // Google returns optimized waypoint order in the response
        // For now, assume sequential order (Google's optimization is built into the route)
        const optimizedSequence = deliveryLocations.map((_, index) => index)

        // Cache the optimized route result
        setCachedRoute(supplierLocation, deliveryLocations, {
            coordinates: route.coordinates,
            distance: route.distance,
            duration: route.duration,
            optimizedSequence
        }, true)

        return {
            optimizedSequence,
            totalDistance: route.distance,
            totalDuration: route.duration,
            route
        }
    } catch (error) {
        console.error('Error optimizing deliveries:', error)
        // Fallback to straight-line TSP
        return optimizeDeliveriesFallback(supplierLocation, deliveryLocations)
    }
}

/**
 * Fallback TSP optimization using straight-line distances
 */
function optimizeDeliveriesFallback(
    supplierLocation: [number, number],
    deliveryLocations: [number, number][]
): OptimizedDeliveryResult {
    // Simple nearest neighbor algorithm
    const unvisited = deliveryLocations.map((_, index) => index)
    const sequence: number[] = []
    let currentLocation = supplierLocation
    let totalDistance = 0

    while (unvisited.length > 0) {
        let nearestIndex = 0
        let nearestDistance = Infinity

        for (let i = 0; i < unvisited.length; i++) {
            const locationIndex = unvisited[i]
            const distance = calculateHaversineDistance(currentLocation, deliveryLocations[locationIndex])
            
            if (distance < nearestDistance) {
                nearestDistance = distance
                nearestIndex = i
            }
        }

        const selectedIndex = unvisited[nearestIndex]
        sequence.push(selectedIndex)
        currentLocation = deliveryLocations[selectedIndex]
        totalDistance += nearestDistance * 1000 * 1.3 // Convert to meters, add 30%
        unvisited.splice(nearestIndex, 1)
    }

    const coordinates = [supplierLocation, ...sequence.map(i => deliveryLocations[i])]
        .map(([lng, lat]) => ({ latitude: lat, longitude: lng }))

    return {
        optimizedSequence: sequence,
        totalDistance: totalDistance,
        totalDuration: (totalDistance / 1000 / 30) * 3600, // 30 km/h average
        route: {
            distance: totalDistance,
            duration: (totalDistance / 1000 / 30) * 3600,
            polyline: '',
            coordinates: coordinates,
            steps: []
        }
    }
}

/**
 * Get turn-by-turn navigation URL for driver
 */
export function getNavigationUrl(
    supplierLocation: [number, number],
    deliveryLocations: [number, number][]
): string {
    const origin = `${supplierLocation[1]},${supplierLocation[0]}` // lat,lng
    const destination = `${deliveryLocations[deliveryLocations.length - 1][1]},${deliveryLocations[deliveryLocations.length - 1][0]}`
    
    const waypoints = deliveryLocations.slice(0, -1)
        .map(([lng, lat]) => `${lat},${lng}`)
        .join('|')

    // Google Maps URL for mobile navigation
    return `https://www.google.com/maps/dir/?api=1` +
        `&origin=${origin}` +
        `&destination=${destination}` +
        (waypoints ? `&waypoints=${waypoints}` : '') +
        `&travelmode=driving`
}