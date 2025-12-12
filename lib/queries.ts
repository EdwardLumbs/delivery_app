import { Category, MenuItem } from "@/type";
import { supabase } from "./supabase";

interface GetMenuParams {
    category?: string;
    query?: string;
    limit?: number;
}

export async function getMenu(params?: GetMenuParams): Promise<MenuItem[]> {
    let queryBuilder = supabase
        .from('menu')
        .select(`
            *,
            category:categories!inner(id, name, description)
        `)

    // Filter by category if provided
    if (params?.category) {
        queryBuilder = queryBuilder.eq('categories.name', params.category)
    }

    // Search by name if query provided
    if (params?.query) {
        queryBuilder = queryBuilder.ilike('name', `%${params.query}%`)
    }

    // Limit results
    if (params?.limit) {
        queryBuilder = queryBuilder.limit(params.limit)
    }

    // Order by rating
    queryBuilder = queryBuilder.order('rating', { ascending: false })

    const { data, error } = await queryBuilder

    if (error) throw error

    return data as MenuItem[]
}

export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

    if (error) throw error

    return data as Category[]
}

export async function getMenuById(id: string): Promise<MenuItem | null> {
    const { data, error } = await supabase
        .from('menu')
        .select(`
            *,
            category:categories(id, name, description),
            customizations:menu_customizations(
                customization:customizations(*)
            )
        `)
        .eq('id', id)
        .single()

    if (error) throw error

    return data as MenuItem
}

// Order queries
export interface Order {
    id: string
    user_id: string
    order_number?: string
    status: string
    total_price: number
    delivery_fee: number
    delivery_address: any
    driver_id?: string
    assigned_at?: string
    delivery_sequence?: number
    estimated_delivery_time?: string
    created_at: string
    updated_at: string
}

export async function getUserOrders(userId: string, limit: number = 20): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw error

    return data as Order[]
}

// Get active orders (pending, preparing, out_for_delivery)
export async function getActiveOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'preparing', 'out_for_delivery'])
        .order('created_at', { ascending: false })

    if (error) throw error

    return data as Order[]
}

// Get order by ID
export async function getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

    if (error) {
        console.error('getOrderById error:', error)
        return null
    }

    return data as Order
}

// Get previous orders (delivered, cancelled)
export async function getPreviousOrders(userId: string, limit: number = 20): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['delivered', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw error

    return data as Order[]
}

export interface CreateOrderParams {
    userId: string
    totalPrice: number
    deliveryFee: number
    deliveryAddress: string
    items: {
        menuItemId: string
        quantity: number
        price: number
        customizations?: string[]
    }[]
}

export async function createOrder(params: CreateOrderParams): Promise<Order> {
    const { userId, totalPrice, deliveryFee, deliveryAddress, items } = params
    
    // Create the order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: userId,
            status: 'pending',
            total_price: totalPrice,
            delivery_fee: deliveryFee,
            delivery_address: deliveryAddress
        })
        .select()
        .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = items.map(item => ({
        order_id: order.id,
        menu_id: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        customizations: item.customizations || []
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

    if (itemsError) throw itemsError

    // Auto-assign order to driver using smart delivery system
    try {
        const { handleNewOrder } = await import('./delivery')
        await handleNewOrder(order.id, deliveryAddress)
        console.log(`Order ${order.id} successfully assigned to driver`)
    } catch (error) {
        console.error('Failed to assign order to driver:', error)
        // Order is still created, just not assigned yet
        // This can be handled manually or retried later
    }

    return order as Order
}

// User profile queries
export interface UpdateUserProfileParams {
    userId: string
    name?: string
    phone_number?: string
    avatar?: string
}

export async function updateUserProfile(params: UpdateUserProfileParams): Promise<void> {
    const { userId, ...updates } = params
    
    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

    if (error) throw error
}

export interface UpdateUserAddressParams {
    userId: string
    address_1?: string
    address_1_coords?: string
    address_2?: string
    address_2_coords?: string
}

export async function updateUserAddress(params: UpdateUserAddressParams): Promise<void> {
    const { userId, ...updates } = params
    
    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

    if (error) throw error
}

// Avatar storage functions
export async function uploadAvatar(userId: string, blob: Blob, ext: string): Promise<string> {
    const filePath = `${userId}.${ext}`
    
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
            contentType: `image/${ext}`,
            upsert: true
        })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

    return publicUrl
}

// Delivery-related queries
export interface Driver {
    id: string
    name: string
    phone?: string
    email?: string
    status: 'available' | 'busy' | 'on_delivery' | 'offline'
    current_orders: number
    max_concurrent_orders: number
    current_location?: any
    last_location_update?: string
}

export async function getOrderDriver(orderId: string): Promise<Driver | null> {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            driver_id,
            drivers!inner(
                id,
                name,
                phone,
                email,
                status,
                current_orders,
                max_concurrent_orders,
                current_location,
                last_location_update
            )
        `)
        .eq('id', orderId)
        .single()

    if (error) {
        console.error('Error fetching order driver:', error)
        return null
    }

    if (!data?.drivers) {
        return null
    }

    // Supabase returns drivers as an array even with inner join
    const driver = Array.isArray(data.drivers) ? data.drivers[0] : data.drivers
    return driver as Driver
}

export async function getDriverLocation(driverId: string): Promise<[number, number] | null> {
    const { data, error } = await supabase
        .from('drivers')
        .select('current_location')
        .eq('id', driverId)
        .single()

    if (error || !data?.current_location) {
        return null
    }

    // Parse location from PostGIS format
    try {
        if (typeof data.current_location === 'string') {
            const match = data.current_location.match(/POINT\(([^)]+)\)/)
            if (match) {
                const [lng, lat] = match[1].split(' ').map(Number)
                return [lng, lat]
            }
        }
    } catch (error) {
        console.error('Error parsing driver location:', error)
    }

    return null
}

export async function updateOrderStatus(orderId: string, status: string, driverId?: string): Promise<void> {
    const updates: any = { status }
    
    if (driverId) {
        // Add delivery tracking entry
        await supabase
            .from('delivery_tracking')
            .insert({
                order_id: orderId,
                driver_id: driverId,
                status: status,
                created_at: new Date().toISOString()
            })
    }

    const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)

    if (error) throw error
}
