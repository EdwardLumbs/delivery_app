import { useCartStore } from '@/store/cart.store'
import { useSegments } from 'expo-router'

/**
 * Hook to determine if floating buttons are visible and return appropriate padding
 */
export function useFloatingButtonPadding(hasActiveOrders: boolean = false) {
    const { items, hasVisitedCheckout } = useCartStore()
    const segments = useSegments()
    
    // Check current route
    const currentRoute = segments.join('/')
    
    // Check if checkout button should be visible
    const activeItems = items.filter(item => !item.isExcluded)
    const totalItems = activeItems.reduce((sum, item) => sum + item.quantity, 0)
    
    const shouldShowCheckoutButton = totalItems > 0 && hasVisitedCheckout && 
        !currentRoute.includes('cart') && 
        !currentRoute.includes('checkout') && 
        !currentRoute.includes('menu') && 
        !currentRoute.includes('edit-profile') && 
        !currentRoute.includes('profile')
    
    // Check if active order button should be visible
    const shouldShowActiveOrderButton = hasActiveOrders && 
        !currentRoute.includes('orders') && 
        !currentRoute.includes('order/') && 
        !currentRoute.includes('menu') && 
        !currentRoute.includes('edit-profile') && 
        !currentRoute.includes('profile')
    
    // Return padding based on visible buttons
    if (shouldShowCheckoutButton && shouldShowActiveOrderButton) {
        return 'pb-56' // Both buttons (stacked) - larger padding
    } else if (shouldShowCheckoutButton || shouldShowActiveOrderButton) {
        return 'pb-36' // One button - small padding  
    } else {
        return 'pb-28' // No floating buttons - just tab bar
    }
}