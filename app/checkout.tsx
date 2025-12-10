import CheckoutItem from '@/components/cards/CheckoutItem'
import CustomHeader from '@/components/misc/CustomHeader'
import SuccessModal from '@/components/modals/SuccessModal'
import PaymentSummary from '@/components/ui/PaymentSummary'
import { parseCoordinates } from '@/lib/helpers'
import { createOrder } from '@/lib/queries'
import useAuthStore from '@/store/auth.store'
import { useCartStore } from '@/store/cart.store'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'

const Checkout = () => {
    const { items, getTotalPrice, setHasVisitedCheckout, clearCart } = useCartStore()
    const { user } = useAuthStore()
    const [isPlacingOrder, setIsPlacingOrder] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    
    // Mark that user has visited checkout (for floating button)
    useEffect(() => {
        setHasVisitedCheckout(true)
    }, [setHasVisitedCheckout])
    
    // Filter out excluded items for checkout
    const checkoutItems = items.filter(item => !item.isExcluded)
    
    const subtotal = getTotalPrice()
    const deliveryFee = 50 // Placeholder for now

    const handlePlaceOrder = async () => {
        try {
            setIsPlacingOrder(true)
            
            if (!user?.id) {
                Alert.alert('Error', 'User not found')
                return
            }

            if (!user?.address_1) {
                Alert.alert('Error', 'Delivery address is required')
                return
            }

            if (checkoutItems.length === 0) {
                Alert.alert('Error', 'No items in cart')
                return
            }

            // Prepare order data
            const orderItems = checkoutItems.map(item => ({
                menuItemId: item.id,
                quantity: 1, // Each cart item represents 1 quantity
                price: item.price,
                customizations: (item.customizations || []).map(c => c.name)
            }))

            // Create the order
            const order = await createOrder({
                userId: user.id,
                totalPrice: subtotal + deliveryFee,
                deliveryFee: deliveryFee,
                deliveryAddress: user.address_1,
                items: orderItems
            })

            console.log('Order created successfully:', order.id)
            
            // Clear cart and show success modal
            clearCart()
            setShowSuccessModal(true)

        } catch (error: any) {
            console.log('Place order error:', error)
            Alert.alert('Error', 'Failed to place order. Please try again.')
        } finally {
            setIsPlacingOrder(false)
        }
    }

    return (
        <SafeAreaView className='bg-white h-full'>
            <FlatList
                data={checkoutItems}
                renderItem={({ item }) => <CheckoutItem item={item} />}
                keyExtractor={(item) => item.id}
                contentContainerClassName='pb-64 px-5 pt-5'
                ListHeaderComponent={() => (
                    <View>
                        <CustomHeader title="Checkout" />
                        
                        {/* Delivery Address */}
                        <View className='border border-gray-200 p-5 rounded-2xl'>
                            <View className='flex-row justify-between items-center mb-3'>
                                <Text className='h3-bold text-dark-100'>Delivery Address</Text>
                                <TouchableOpacity 
                                    onPress={() => router.push({
                                        pathname: '/address-picker',
                                        params: {
                                            returnTo: '/checkout',
                                            isRequired: 'false'
                                        }
                                    })}
                                    className='px-3 py-1 bg-primary/10 rounded-full'
                                >
                                    <Text className='small-bold text-primary'>Change</Text>
                                </TouchableOpacity>
                            </View>
                            
                            {(() => {
                                const coords = parseCoordinates(user?.address_1_coords || null)
                                
                                if (coords) {
                                    return (
                                        <View className='mb-3 rounded-lg overflow-hidden border border-gray-200'>
                                            <MapView
                                                style={{ width: '100%', height: 100 }}
                                                region={{
                                                    latitude: coords[1],
                                                    longitude: coords[0],
                                                    latitudeDelta: 0.005,
                                                    longitudeDelta: 0.005,
                                                }}
                                                scrollEnabled={false}
                                                zoomEnabled={false}
                                                rotateEnabled={false}
                                                pitchEnabled={false}
                                            >
                                                <Marker
                                                    coordinate={{
                                                        latitude: coords[1],
                                                        longitude: coords[0],
                                                    }}
                                                    title="Delivery Address"
                                                />
                                            </MapView>
                                            <View className='p-3 bg-white'>
                                                <Text className='small-bold text-gray-300'>Delivering to</Text>
                                                <Text className='paragraph-medium text-dark-100 mt-1'>
                                                    {user?.address_1 || 'No address set'}
                                                </Text>
                                            </View>
                                        </View>
                                    )
                                } else {
                                    return (
                                        <View className='mb-3 p-3 bg-gray-50 rounded-lg flex-row items-center'>
                                            <View className='w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-3'>
                                                <Text className='text-primary text-lg'>📍</Text>
                                            </View>
                                            <View className='flex-1'>
                                                <Text className='small-bold text-gray-300'>Delivering to</Text>
                                                <Text className='paragraph-medium text-dark-100 mt-1'>
                                                    {user?.address_1 || 'No address set'}
                                                </Text>
                                            </View>
                                        </View>
                                    )
                                }
                            })()}
                            
                            {user?.address_2 && (
                                <Text className='small-regular text-gray-200 mt-2'>
                                    Additional info: {user.address_2}
                                </Text>
                            )}
                        </View>

                        <Text className='h3-bold text-dark-100 mt-6 mb-4'>Order Summary</Text>
                    </View>
                )}
                ListFooterComponent={() => (
                    <View className='mt-6'>
                        <PaymentSummary
                            subtotal={subtotal}
                            deliveryFee={deliveryFee}
                            totalItems={checkoutItems.length}
                            buttonTitle='Place Order'
                            onButtonPress={handlePlaceOrder}
                            isLoading={isPlacingOrder}
                        />
                    </View>
                )}
            />

            <SuccessModal
                visible={showSuccessModal}
                title="Order Placed Successfully!"
                message="Your order has been placed and is waiting for confirmation. You can track your order in the Orders tab."
                buttonText="View Orders"
                onClose={() => {
                    setShowSuccessModal(false)
                    router.replace('/(tabs)/orders')
                }}
            />
        </SafeAreaView>
    )
}

export default Checkout