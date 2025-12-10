import { useCartStore } from '@/store/cart.store'
import { router, useSegments } from 'expo-router'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

const FloatingCheckoutButton = () => {
    const { items, getTotalPrice, hasVisitedCheckout } = useCartStore()
    const segments = useSegments()
    
    // Filter out excluded items
    const activeItems = items.filter(item => !item.isExcluded)
    const totalItems = activeItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = getTotalPrice()
    
    // Don't show if:
    // - No items or all excluded
    // - User hasn't visited checkout page yet
    // - Currently on cart, checkout, or edit-profile pages
    const currentRoute = segments.join('/')
    if (totalItems === 0 || !hasVisitedCheckout || currentRoute.includes('cart') || currentRoute.includes('checkout') || currentRoute.includes('edit-profile')) return null

    return (
        <View className='absolute bottom-36 left-5 right-5 z-50'>
            <TouchableOpacity
                onPress={() => router.push('/checkout')}
                className='bg-primary rounded-2xl p-4 flex-row justify-between items-center shadow-lg'
                activeOpacity={0.8}
            >
                <View>
                    <Text className='body-bold text-white'>
                        {totalItems} item{totalItems > 1 ? 's' : ''} in cart
                    </Text>
                    <Text className='small-regular text-white/80'>
                        Tap to checkout
                    </Text>
                </View>
                <Text className='h4-bold text-white'>
                    ₱{totalPrice.toFixed(2)}
                </Text>
            </TouchableOpacity>
        </View>
    )
}

export default FloatingCheckoutButton