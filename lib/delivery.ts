import { supabase } from './supabase'

import { DELIVERY_CONFIG, logConfigStatus } from './config'
import { getBatchDistances, getDrivingDistance, optimizeMultipleDeliveries } from './googleMaps'




// Types
export interface Driver {
    id: string
    name: string
    phone?: string
    email?: string
    status: 'available' | 'busy' | 'on_delivery' | 'offline'
    current_orders: number
    max_concurrent_orders: number
    current_location?: [number, number] // [longitude, latitude]
    last_location_update?: string
}

export interface DriverRoute {
    driver_id: string
    route_sequence: string[] // Array of order IDs
    route_data: RouteData
    total_distance: number
    estimated_duration: number // minutes
    supplier_location: [number, number]
    created_at?: string
    updated_at?: string
}

export interface RouteData {
    coordinates: [number, number][] // Route coordinates for map display
    distances: number[] // Distance between each point
    durations: number[] // Time between each point
}

export interface DeliveryAssignment {
    order_id: string
    driver_id: string
    estimated_delivery_time: string
    delivery_sequence: number
}

// Use configuration
const REASSIGNMENT_RULES = DELIVERY_CONFIG.REASSIGNMENT_RULES
const SUPPLIER_LOCATION = DELIVERY_CONFIG.SUPPLIER_LOCATION

// Log configuration on module load
logConfigStatus()

/**
 * Get all available drivers
 */
export async function getAvailableDrivers(): Promise<Driver[]> {
    const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .in('status', ['available', 'busy'])
        .order('current_orders', { ascending: true })

    if (error) throw error
    
    // Filter drivers with available capacity
    return (data || []).filter(driver => driver.current_orders < driver.max_concurrent_orders)
}

/**
 * Get driver's current route
 */
export async function getDriverRoute(driverId: string): Promise<DriverRoute | null> {
    const { data, error } = await supabase
        .from('driver_routes')
        .select('*')
        .eq('driver_id', driverId)
        .single()

    if (error) {
        console.error('Error fetching driver route:', error)
        return null
    }

    return data
}

/**
 * Calculate straight-line distance using Haversine formula
 * Used for geographic clustering and pre-filtering
 */
function calculateStraightLineDistance(point1: [number, number], point2: [number, number]): number {
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
 * Parse coordinates from various formats (GeoJSON, WKT, etc.)
 */
function parseCoordinates(coords: any): [number, number] | null {
    if (!coords) return null
    
    // Handle GeoJSON Point
    if (coords.type === 'Point' && coords.coordinates) {
        return [coords.coordinates[0], coords.coordinates[1]]
    }
    
    // Handle WKT format "POINT(lng lat)"
    if (typeof coords === 'string' && coords.startsWith('POINT(')) {
        const match = coords.match(/POINT\(([^)]+)\)/)
        if (match) {
            const [lng, lat] = match[1].split(' ').map(Number)
            return [lng, lat]
        }
    }
    
    // Handle array format [lng, lat]
    if (Array.isArray(coords) && coords.length === 2) {
        return [coords[0], coords[1]]
    }
    
    return null
}

/**
 * Calculate average distance from driver's current orders to a new order
 */
async function calculateAverageDistance(driverId: string, newOrderLocation: [number, number]): Promise<number> {
    // Get driver's current orders
    const { data: orders, error } = await supabase
        .from('orders')
        .select('delivery_address')
        .eq('driver_id', driverId)
        .in('status', ['assigned', 'preparing'])

    if (error || !orders || orders.length === 0) {
        return Infinity // No current orders, distance doesn't matter
    }

    let totalDistance = 0
    let validOrders = 0

    for (const order of orders) {
        const orderCoords = parseCoordinates(order.delivery_address)
        if (orderCoords) {
            totalDistance += calculateStraightLineDistance(orderCoords, newOrderLocation)
            validOrders++
        }
    }

    return validOrders > 0 ? totalDistance / validOrders : Infinity
}

/**
 * Find the best driver for a new order using geographic clustering
 */
export async function findBestDriverForOrder(orderLocation: [number, number]): Promise<string | null> {
    const availableDrivers = await getAvailableDrivers()
    
    if (availableDrivers.length === 0) {
        throw new Error('No available drivers')
    }

    let bestDriver = availableDrivers[0]
    let bestDistance = Infinity

    // Find driver with orders closest to new order location
    for (const driver of availableDrivers) {
        const avgDistance = await calculateAverageDistance(driver.id, orderLocation)
        
        // Prefer drivers with lower average distance to existing orders
        if (avgDistance < bestDistance) {
            bestDistance = avgDistance
            bestDriver = driver
        }
    }

    return bestDriver.id
}

/**
 * Enhanced route optimization using Google Maps
 */
async function optimizeDeliverySequence(
    supplierLocation: [number, number], 
    deliveryLocations: [number, number][]
): Promise<{sequence: number[], totalDistance: number, totalDuration: number}> {
    if (deliveryLocations.length <= 1) {
        if (deliveryLocations.length === 1) {
            try {
                const result = await getDrivingDistance(supplierLocation, deliveryLocations[0])
                return {
                    sequence: [0],
                    totalDistance: result.distance,
                    totalDuration: result.duration
                }
            } catch (error) {
                console.error('Error getting single delivery distance:', error)
                const straightDistance = calculateStraightLineDistance(supplierLocation, deliveryLocations[0])
                return {
                    sequence: [0],
                    totalDistance: straightDistance * 1000 * 1.3,
                    totalDuration: (straightDistance / 30) * 3600
                }
            }
        }
        return { sequence: [], totalDistance: 0, totalDuration: 0 }
    }

    try {
        // Use Google Maps for optimization
        const optimized = await optimizeMultipleDeliveries(supplierLocation, deliveryLocations)
        return {
            sequence: optimized.optimizedSequence,
            totalDistance: optimized.totalDistance,
            totalDuration: optimized.totalDuration
        }
    } catch (error) {
        console.error('Error optimizing delivery sequence with Google Maps:', error)
        
        // Fallback to straight-line TSP
        const unvisited = deliveryLocations.map((_, index) => index)
        const sequence: number[] = []
        let currentLocation = supplierLocation
        let totalDistance = 0

        while (unvisited.length > 0) {
            let nearestIndex = 0
            let nearestDistance = Infinity

            for (let i = 0; i < unvisited.length; i++) {
                const locationIndex = unvisited[i]
                const distance = calculateStraightLineDistance(currentLocation, deliveryLocations[locationIndex])
                
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

        return {
            sequence,
            totalDistance,
            totalDuration: (totalDistance / 1000 / 30) * 3600 // 30 km/h average
        }
    }
}

/**
 * Calculate optimized route for a driver's orders using Google Maps
 */
async function calculateOptimizedRoute(driverId: string): Promise<DriverRoute> {
    // Get driver's assigned orders
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, delivery_address')
        .eq('driver_id', driverId)
        .in('status', ['assigned', 'preparing'])
        .order('created_at', { ascending: true })

    if (error) throw error

    const deliveryLocations: [number, number][] = []
    const orderIds: string[] = []

    // Parse delivery locations
    for (const order of orders || []) {
        const coords = parseCoordinates(order.delivery_address)
        if (coords) {
            deliveryLocations.push(coords)
            orderIds.push(order.id)
        }
    }

    if (deliveryLocations.length === 0) {
        return {
            driver_id: driverId,
            route_sequence: [],
            route_data: {
                coordinates: [SUPPLIER_LOCATION],
                distances: [],
                durations: []
            },
            total_distance: 0,
            estimated_duration: 0,
            supplier_location: SUPPLIER_LOCATION
        }
    }

    // Optimize delivery sequence using Google Maps
    const optimized = await optimizeDeliverySequence(SUPPLIER_LOCATION, deliveryLocations)
    const optimizedOrderIds = optimized.sequence.map(index => orderIds[index])

    // Create route coordinates for React Native Maps
    const routeCoordinates = [
        SUPPLIER_LOCATION,
        ...optimized.sequence.map(i => deliveryLocations[i])
    ]

    return {
        driver_id: driverId,
        route_sequence: optimizedOrderIds,
        route_data: {
            coordinates: routeCoordinates,
            distances: [], // Will be populated by Google Maps route
            durations: []  // Will be populated by Google Maps route
        },
        total_distance: Math.round(optimized.totalDistance / 1000 * 100) / 100, // Convert to km, round to 2 decimal places
        estimated_duration: Math.round(optimized.totalDuration / 60), // Convert to minutes
        supplier_location: SUPPLIER_LOCATION
    }
}

/**
 * Assign order to driver and update route
 */
export async function assignOrderToDriver(orderId: string, driverId: string): Promise<DeliveryAssignment> {
    // Update order with driver assignment
    const { error: orderError } = await supabase
        .from('orders')
        .update({
            driver_id: driverId,
            status: 'assigned',
            assigned_at: new Date().toISOString()
        })
        .eq('id', orderId)

    if (orderError) throw orderError

    // Get current order count and increment
    const { data: driver } = await supabase
        .from('drivers')
        .select('current_orders')
        .eq('id', driverId)
        .single()

    // Update driver's current order count
    const { error: driverError } = await supabase
        .from('drivers')
        .update({
            current_orders: (driver?.current_orders || 0) + 1,
            status: 'busy'
        })
        .eq('id', driverId)

    if (driverError) throw driverError

    // Recalculate and update driver's route
    const optimizedRoute = await calculateOptimizedRoute(driverId)
    
    const { error: routeError } = await supabase
        .from('driver_routes')
        .update({
            route_sequence: optimizedRoute.route_sequence,
            route_data: optimizedRoute.route_data,
            total_distance: optimizedRoute.total_distance,
            estimated_duration: optimizedRoute.estimated_duration,
            updated_at: new Date().toISOString()
        })
        .eq('driver_id', driverId)

    if (routeError) throw routeError

    // Update delivery sequence for all orders
    for (let i = 0; i < optimizedRoute.route_sequence.length; i++) {
        const orderIdInSequence = optimizedRoute.route_sequence[i]
        const estimatedDeliveryTime = new Date()
        estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + (i + 1) * 20) // Rough estimate

        await supabase
            .from('orders')
            .update({
                delivery_sequence: i + 1,
                estimated_delivery_time: estimatedDeliveryTime.toISOString()
            })
            .eq('id', orderIdInSequence)
    }

    return {
        order_id: orderId,
        driver_id: driverId,
        estimated_delivery_time: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 min from now
        delivery_sequence: optimizedRoute.route_sequence.indexOf(orderId) + 1
    }
}

/**
 * Smart order assignment with geographic clustering
 */
export async function smartAssignOrder(orderId: string, orderLocation: [number, number]): Promise<DeliveryAssignment> {
    // Find best driver using geographic clustering
    const bestDriverId = await findBestDriverForOrder(orderLocation)
    
    if (!bestDriverId) {
        throw new Error('No available drivers found')
    }

    // Assign order to best driver
    return await assignOrderToDriver(orderId, bestDriverId)
}

/**
 * Check if dynamic reassignment is beneficial with batch optimization
 */
export async function checkDynamicReassignment(orderId: string, orderLocation: [number, number]): Promise<string | null> {
    // Get all drivers currently en route (status: busy, recently left supplier)
    const { data: drivers, error } = await supabase
        .from('drivers')
        .select(`
            id, 
            current_orders, 
            max_concurrent_orders,
            current_location
        `)
        .eq('status', 'busy')
        .filter('current_orders', 'lt', 'max_concurrent_orders')

    if (error || !drivers || drivers.length === 0) {
        return null // No suitable drivers for reassignment
    }

    // Pre-filter drivers with straight-line distance
    const candidateDrivers = []
    for (const driver of drivers) {
        // Check if driver has capacity
        if (driver.current_orders >= driver.max_concurrent_orders) {
            continue
        }

        // Get driver's current route
        const currentRoute = await getDriverRoute(driver.id)
        if (!currentRoute) continue

        // Check if driver is within time window (8 minutes since last route update)
        const routeAge = Date.now() - new Date(currentRoute.updated_at || Date.now()).getTime()
        if (routeAge > REASSIGNMENT_RULES.MAX_TIME_WINDOW * 60 * 1000) {
            continue // Too late to reassign
        }

        // Pre-filter with straight-line distance
        if (driver.current_location) {
            const driverCoords = parseCoordinates(driver.current_location)
            if (driverCoords) {
                const straightLineDistance = calculateStraightLineDistance(driverCoords, SUPPLIER_LOCATION)
                if (straightLineDistance <= REASSIGNMENT_RULES.MAX_RETURN_DISTANCE) {
                    candidateDrivers.push({ driver, driverCoords, currentRoute })
                }
            }
        }
    }

    if (candidateDrivers.length === 0) {
        return null // No candidates passed pre-filtering
    }

    // Batch distance check for multiple candidates
    if (candidateDrivers.length > 1) {
        try {
            const origins = candidateDrivers.map(c => c.driverCoords)
            const destinations = [SUPPLIER_LOCATION]
            const batchDistances = await getBatchDistances(origins, destinations)

            // Filter candidates by actual driving distance
            const validCandidates = candidateDrivers.filter((candidate, index) => {
                const drivingDistanceKm = batchDistances[index][0].distance / 1000
                return drivingDistanceKm <= REASSIGNMENT_RULES.MAX_RETURN_DISTANCE
            })

            candidateDrivers.splice(0, candidateDrivers.length, ...validCandidates)
        } catch (error) {
            console.error('Error in batch distance check:', error)
            // Continue with pre-filtered candidates
        }
    }

    // Check efficiency for remaining candidates
    for (const { driver } of candidateDrivers) {
        // Check if driver has capacity
        if (driver.current_orders >= driver.max_concurrent_orders) {
            continue
        }

        // Get driver's current route
        const currentRoute = await getDriverRoute(driver.id)
        if (!currentRoute) continue

        // Check if driver is within time window (8 minutes since last route update)
        const routeAge = Date.now() - new Date(currentRoute.updated_at || Date.now()).getTime()
        if (routeAge > REASSIGNMENT_RULES.MAX_TIME_WINDOW * 60 * 1000) {
            continue // Too late to reassign
        }

        // Check distance from supplier using Google Maps (with pre-filtering)
        if (driver.current_location) {
            const driverCoords = parseCoordinates(driver.current_location)
            if (driverCoords) {
                // Pre-filter with straight-line distance
                const straightLineDistance = calculateStraightLineDistance(driverCoords, SUPPLIER_LOCATION)
                if (straightLineDistance > REASSIGNMENT_RULES.MAX_RETURN_DISTANCE) {
                    continue // Too far even in straight line
                }

                // Check actual driving distance for promising candidates
                try {
                    const drivingResult = await getDrivingDistance(driverCoords, SUPPLIER_LOCATION)
                    const drivingDistanceKm = drivingResult.distance / 1000
                    if (drivingDistanceKm > REASSIGNMENT_RULES.MAX_RETURN_DISTANCE) {
                        continue // Too far to return by road
                    }
                } catch (error) {
                    console.error('Error checking driving distance for reassignment:', error)
                    // Fallback to straight-line check (already passed)
                }
            }
        }

        // Calculate efficiency gain using Google Maps
        const currentDistanceKm = currentRoute.total_distance
        
        // Simulate adding new order to route
        const { data: orders } = await supabase
            .from('orders')
            .select('delivery_address')
            .eq('driver_id', driver.id)
            .in('status', ['assigned', 'preparing'])

        if (orders) {
            const deliveryLocations = orders
                .map(o => parseCoordinates(o.delivery_address))
                .filter(Boolean) as [number, number][]
            
            // Add new order location
            deliveryLocations.push(orderLocation)
            
            try {
                // Calculate new optimized route using Google Maps
                const newOptimized = await optimizeDeliverySequence(SUPPLIER_LOCATION, deliveryLocations)
                const newDistanceKm = newOptimized.totalDistance / 1000

                // Calculate efficiency gain
                const efficiencyGain = (currentDistanceKm - newDistanceKm) / currentDistanceKm
                
                if (efficiencyGain >= REASSIGNMENT_RULES.MIN_EFFICIENCY_GAIN) {
                    console.log(`✅ Reassignment beneficial: ${efficiencyGain.toFixed(2)} efficiency gain`)
                    return driver.id // This driver is suitable for reassignment
                }
            } catch (error) {
                console.error('Error calculating route efficiency for reassignment:', error)
                // Fallback: don't reassign if we can't calculate properly
            }
        }
    }

    return null // No suitable driver found for reassignment
}

/**
 * Main function to handle new order assignment
 */
export async function handleNewOrder(orderId: string, deliveryAddress: any): Promise<DeliveryAssignment> {
    const orderLocation = parseCoordinates(deliveryAddress)
    
    if (!orderLocation) {
        throw new Error('Invalid delivery address coordinates')
    }

    // First, check if dynamic reassignment is beneficial
    const reassignDriverId = await checkDynamicReassignment(orderId, orderLocation)
    
    if (reassignDriverId) {
        console.log(`Reassigning order ${orderId} to driver ${reassignDriverId} for efficiency`)
        return await assignOrderToDriver(orderId, reassignDriverId)
    }

    // Otherwise, use smart assignment
    console.log(`Smart assigning order ${orderId} to best available driver`)
    return await smartAssignOrder(orderId, orderLocation)
}