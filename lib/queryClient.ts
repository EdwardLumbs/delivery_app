import { QueryClient } from '@tanstack/react-query'

/**
 * React Query Client Configuration
 * 
 * Default settings:
 * - staleTime: 0 (data is immediately stale)
 * - cacheTime: 5 minutes (unused data stays in cache)
 * - refetchOnWindowFocus: true (refetch when app comes to foreground)
 * - retry: 3 (retry failed requests 3 times)
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // How long data is considered fresh (no refetch needed)
            staleTime: 5 * 60 * 1000, // 5 minutes for most queries
            
            // How long unused data stays in cache
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            
            // Refetch when app comes to foreground
            refetchOnWindowFocus: true,
            
            // Refetch when network reconnects
            refetchOnReconnect: true,
            
            // Retry failed requests
            retry: 1, // Only retry once for faster feedback
            
            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
        },
        mutations: {
            // Retry failed mutations once
            retry: 1,
        },
    },
})
