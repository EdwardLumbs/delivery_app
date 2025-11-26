import { CreateUserParams, SignInParams, User } from "@/type"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

export const supabaseConfig = {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
}

export const supabase = createClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    }
)

export const createUser = async ({email, password, name}: CreateUserParams) => {
    try {
        // Sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                }
            }
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('User creation failed')

        // Sign in automatically after signup
        await signIn({ email, password })

        // Create user profile in database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                name,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            })
            .select()
            .single()

        if (userError) throw userError

        return userData
    } catch (error: any) {
        throw new Error(error.message)
    }
}

export const signIn = async ({email, password}: SignInParams) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) throw error

        return data.session
    } catch (error: any) {
        throw new Error(error.message)
    }
}

export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    } catch (error: any) {
        throw new Error(error.message)
    }
}

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        // Get current auth user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError) throw authError
        if (!authUser) return null

        // Get user profile from database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

        if (userError) throw userError

        return userData as User
    } catch (error) {
        console.log('getCurrentUser error:', error)
        return null
    }
}
