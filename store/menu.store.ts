import { getCategories, getMenu } from '@/lib/queries'
import { Category, MenuItem } from '@/type'
import { create } from 'zustand'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface MenuStore {
    menuItems: MenuItem[]
    categories: Category[]
    lastFetched: number | null
    isLoading: boolean

    fetchMenu: (params: { category: string; query: string; limit?: number }) => Promise<void>
    fetchCategories: () => Promise<void>
    shouldRefetch: () => boolean
    clearCache: () => void
}

const useMenuStore = create<MenuStore>((set, get) => ({
    menuItems: [],
    categories: [],
    lastFetched: null,
    isLoading: false,

    shouldRefetch: () => {
        const { lastFetched } = get()
        if (!lastFetched) return true
        return Date.now() - lastFetched > CACHE_TTL
    },

    fetchMenu: async (params) => {
        try {
            set({ isLoading: true })
            console.log('Fetching menu from database...')
            const data = await getMenu(params)
            set({ 
                menuItems: data || [], 
                lastFetched: Date.now(),
                isLoading: false 
            })
            console.log('Menu cached successfully')
        } catch (error) {
            console.error('fetchMenu error:', error)
            set({ isLoading: false })
        }
    },

    fetchCategories: async () => {
        try {
            console.log('Fetching categories from database...')
            const data = await getCategories()
            set({ categories: data || [] })
            console.log('Categories cached successfully')
        } catch (error) {
            console.error('fetchCategories error:', error)
        }
    },

    clearCache: () => {
        console.log('Clearing menu cache')
        set({ 
            menuItems: [], 
            categories: [], 
            lastFetched: null 
        })
    }
}))

export default useMenuStore
