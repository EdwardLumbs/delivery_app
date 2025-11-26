import dummyData from "./data";
import { supabase } from "./supabase";

interface Category {
    name: string;
    description: string;
}

interface Customization {
    name: string;
    price: number;
    type: "topping" | "side" | "size" | "crust" | string;
}

interface MenuItem {
    name: string;
    description: string;
    image_url: string;
    price: number;
    rating: number;
    calories: number;
    protein: number;
    category_name: string;
    customizations: string[];
}

interface DummyData {
    categories: Category[];
    customizations: Customization[];
    menu: MenuItem[];
}

const data = dummyData as DummyData;

async function clearTable(tableName: string): Promise<void> {
    const { error } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (error) console.log(`Error clearing ${tableName}:`, error)
}

async function seed(): Promise<void> {
    console.log('🌱 Starting seed...')

    try {
        // 1. Clear all tables
        console.log('Clearing tables...')
        await clearTable('menu_customizations')
        await clearTable('menu')
        await clearTable('customizations')
        await clearTable('categories')

        // 2. Create Categories
        console.log('Creating categories...')
        const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .insert(data.categories)
            .select()

        if (categoriesError) throw categoriesError

        const categoryMap: Record<string, string> = {}
        categoriesData.forEach((cat: any) => {
            categoryMap[cat.name] = cat.id
        })

        // 3. Create Customizations
        console.log('Creating customizations...')
        const { data: customizationsData, error: customizationsError } = await supabase
            .from('customizations')
            .insert(data.customizations)
            .select()

        if (customizationsError) throw customizationsError

        const customizationMap: Record<string, string> = {}
        customizationsData.forEach((cus: any) => {
            customizationMap[cus.name] = cus.id
        })

        // 4. Create Menu Items
        console.log('Creating menu items...')
        for (const item of data.menu) {
            const { data: menuData, error: menuError } = await supabase
                .from('menu')
                .insert({
                    name: item.name,
                    description: item.description,
                    image_url: item.image_url,
                    price: item.price,
                    rating: item.rating,
                    calories: item.calories,
                    protein: item.protein,
                    category_id: categoryMap[item.category_name],
                })
                .select()
                .single()

            if (menuError) throw menuError

            // 5. Create menu_customizations relationships
            const menuCustomizations = item.customizations.map(cusName => ({
                menu_id: menuData.id,
                customization_id: customizationMap[cusName],
            }))

            if (menuCustomizations.length > 0) {
                const { error: mcError } = await supabase
                    .from('menu_customizations')
                    .insert(menuCustomizations)

                if (mcError) throw mcError
            }
        }

        console.log('✅ Seeding complete!')
    } catch (error: any) {
        console.error('❌ Seeding failed:', error.message)
        throw error
    }
}

export default seed;
