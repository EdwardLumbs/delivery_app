import { RealtimeChannel } from '@supabase/supabase-js'
import { Order } from './queries'
import { supabase } from './supabase'

/**
 * Subscribe to order updates for a specific user
 * @param userId - The user ID to listen for
 * @param onUpdate - Callback function when order is updated
 * @returns Cleanup function to unsubscribe
 */
export function subscribeToOrderUpdates(
    userId: string,
    onUpdate: (order: Order) => void
): () => void {
    console.log('Setting up real-time subscription for orders')
    
    const channel: RealtimeChannel = supabase
        .channel('order-updates')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${userId}`
        }, (payload) => {
            console.log('Order updated:', payload.new)
            onUpdate(payload.new as Order)
        })
        .subscribe()

    // Return cleanup function
    return () => {
        console.log('Cleaning up real-time subscription')
        supabase.removeChannel(channel)
    }
}
