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
