import { CreateUserParams, SignInParams, User } from "@/type"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

export const supabaseConfig = {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_KEY!,
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
        console.log('1. Starting sign up for:', email)
        
        // Sign up the user (this also creates a session automatically!)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                }
            }
        })

        if (authError) {
            console.log('2. Sign up error:', authError)
            throw authError
        }
        
        if (!authData.user) {
            console.log('2. No user returned from signUp')
            throw new Error('User creation failed')
        }

        console.log('2. Auth user created:', authData.user.id)
        console.log('3. Session created:', !!authData.session)

        // Create user profile in database
        console.log('4. Creating user profile...')
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

        if (userError) {
            console.log('5. Profile creation error:', userError)
            throw userError
        }

        console.log('5. Profile created successfully!')
        console.log('6. User is now signed in automatically (no need to call signIn)!')
        
        // No need to call signIn() - user is already signed in from signUp()!
        
        return userData
    } catch (error: any) {
        console.log('createUser failed:', error)
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
        console.log('signOut initializing...')

        const { error } = await supabase.auth.signOut()
        if (error) {
            console.log('signOut error: ', error)
            throw error
        } else {
            console.log('signOut: Sign Out successful!')
            return true
        }
    } catch (error: any) {
        console.log('signOut error: ', error)
        throw new Error(error.message)
    }
}

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        console.log('getCurrentUser: Checking for session...')
        
        // Get current auth user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError) {
            console.log('getCurrentUser: Auth error:', authError)
            throw authError
        }
        
        if (!authUser) {
            console.log('getCurrentUser: No auth user found (not signed in)')
            return null
        }

        console.log('getCurrentUser: Auth user found:', authUser.id)
        console.log('getCurrentUser: Fetching profile from database...')

        // Get user profile from database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

        if (userError) {
            console.log('getCurrentUser: Profile fetch error:', userError)
            
            // If profile doesn't exist, sign out (orphaned auth user)
            console.log('getCurrentUser: Profile not found, signing out orphaned session...')
            await supabase.auth.signOut()
            
            throw userError
        }

        console.log('getCurrentUser: Profile found successfully!')
        return userData as User
    } catch (error) {
        console.log('getCurrentUser error:', error)
        return null
    }
}

export const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
        console.log('updateUser: Updating user profile...', userId)

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single()

        if (error) {
            console.log('updateUser error:', error)
            throw error
        }

        console.log('updateUser: Profile updated successfully!')
        return data as User
    } catch (error: any) {
        console.log('updateUser failed:', error)
        throw new Error(error.message)
    }
}
