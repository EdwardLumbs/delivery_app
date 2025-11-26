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
            category:categories(id, name, description)
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
