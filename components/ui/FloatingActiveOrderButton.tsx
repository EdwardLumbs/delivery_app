import { images } from '@/constants'
import { getActiveOrders } from '@/lib/queries'
import useAuthStore from '@/store/auth.store'
import { useCartStore } from '@/store/cart.store'
import { useQuery } from '@tanstack/react-query'
import { router, useSegments } from 'expo-router'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

const FloatingActiveOrderButton = () => {
    const { user } = useAuthStore()
    const { items, hasVisitedCheckout } = useCartStore()
    const segments = useSegments()
    
    // Fetch active orders
    const { data: activeOrders = [] } = useQuery({
        queryKey: ['active-orders', user?.id],
        queryFn: () => getActiveOrders(user!.id),
        enabled: !!user?.id,
        staleTime: 30 * 1000,
    })

    // Check if we have active orders
    const hasActiveOrders = activeOrders.length > 0
    const activeOrder = activeOrders[0] // Most recent order for display
    const hasMultipleOrders = activeOrders.length > 1
    
    // Check if checkout button should be visible
    const activeItems = items.filter(item => !item.isExcluded)
    const totalItems = activeItems.reduce((sum, item) => sum + item.quantity, 0)
    const currentRoute = segments.join('/')
    const shouldShowCheckoutButton = totalItems > 0 && hasVisitedCheckout && 
        !currentRoute.includes('cart') && !currentRoute.includes('checkout') && !currentRoute.includes('edit-profile')
    
    // Don't show if:
    // - No active orders
    // - Currently on orders, order detail, menu, edit-profile, or profile pages
    if (!hasActiveOrders || currentRoute.includes('orders') || currentRoute.includes('order/') || 
        currentRoute.includes('menu') || currentRoute.includes('edit-profile') || currentRoute.includes('profile')) return null

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Pending'
            case 'preparing': return 'Preparing'
            case 'out_for_delivery': return 'On the way'
            default: return status
        }
    }

    // Position based on whether checkout button is visible
    const bottomPosition = shouldShowCheckoutButton ? 'bottom-56' : 'bottom-36'

    const handlePress = () => {
        if (hasMultipleOrders) {
            // Multiple orders: go to orders page to see all
            router.push('/(tabs)/orders')
        } else {
            // Single order: go directly to order detail
            router.push(`/order/${activeOrder.id}` as any)
        }
    }

    return (
        <View className={`absolute ${bottomPosition} left-5 right-5 z-50`}>
            <TouchableOpacity
                onPress={handlePress}
                className='bg-purple-600 rounded-2xl p-4 flex-row justify-between items-center shadow-lg'
                activeOpacity={0.8}
            >
                <View className='flex-row items-center flex-1'>
                    <Image 
                        source={images.bag}
                        className='size-6 mr-3'
                        tintColor='white'
                    />
                    <View className='flex-1'>
                        <Text className='body-bold text-white'>
                            {hasMultipleOrders ? `${activeOrders.length} Active Orders` : 'Active Order'}
                        </Text>
                        <Text className='small-regular text-white/80'>
                            {hasMultipleOrders 
                                ? 'Tap to view all orders' 
                                : `${getStatusText(activeOrder.status)} • Tap to track`
                            }
                        </Text>
                    </View>
                </View>
                <Image 
                    source={images.arrowBack}
                    className='size-5 rotate-180'
                    tintColor='white'
                />
            </TouchableOpacity>
        </View>
    )
}

export default FloatingActiveOrderButton
