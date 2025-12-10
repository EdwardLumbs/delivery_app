import CustomHeader from '@/components/misc/CustomHeader'
import { images } from '@/constants'
import { getOrderById, Order } from '@/lib/queries'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const OrderDetail = () => {
    const { id } = useLocalSearchParams()

    // Fetch order details
    const { data: order, isLoading } = useQuery<Order | null>({
        queryKey: ['order', id],
        queryFn: () => getOrderById(id as string),
        enabled: !!id,
        staleTime: 30 * 1000, // 30 seconds
    })

    if (isLoading) {
        return (
            <SafeAreaView className='bg-white h-full'>
                <View className='p-5'>
                    <CustomHeader title="Order Details" />
                </View>
                <View className='flex-1 items-center justify-center'>
                    <ActivityIndicator size='large' color='#FE8C00' />
                </View>
            </SafeAreaView>
        )
    }

    if (!order) {
        return (
            <SafeAreaView className='bg-white h-full'>
                <View className='p-5'>
                    <CustomHeader title="Order Details" />
                </View>
                <View className='flex-1 items-center justify-center'>
                    <Text className='h3-bold text-dark-100'>Order not found</Text>
                </View>
            </SafeAreaView>
        )
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500'
            case 'preparing': return 'bg-blue-500'
            case 'out_for_delivery': return 'bg-purple-500'
            case 'delivered': return 'bg-green-500'
            case 'cancelled': return 'bg-red-500'
            default: return 'bg-gray-500'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Pending Confirmation'
            case 'preparing': return 'Preparing Your Order'
            case 'out_for_delivery': return 'Out for Delivery'
            case 'delivered': return 'Delivered'
            case 'cancelled': return 'Cancelled'
            default: return status
        }
    }

    return (
        <SafeAreaView className='bg-white h-full'>
            <ScrollView contentContainerClassName='pb-28'>
                <View className='p-5'>
                    <CustomHeader title="Order Details" />
                </View>

                {/* Order Status */}
                <View className='px-5 mb-5'>
                    <View className={`${getStatusColor(order.status)} p-4 rounded-xl`}>
                        <Text className='base-bold text-white text-center'>
                            {getStatusText(order.status)}
                        </Text>
                    </View>
                </View>

                {/* Map Placeholder */}
                <View className='mx-5 mb-5 h-48 bg-gray-100 rounded-xl items-center justify-center border border-gray-200'>
                    <Image 
                        source={images.location}
                        className='size-12 mb-2'
                        tintColor='#9CA3AF'
                    />
                    <Text className='base-regular text-gray-400'>Rider location coming soon</Text>
                </View>

                {/* Estimated Delivery Time */}
                <View className='mx-5 mb-5 p-4 bg-primary/10 rounded-xl flex-row items-center'>
                    <Image 
                        source={images.clock}
                        className='size-6 mr-3'
                        tintColor='#FE8C00'
                    />
                    <View>
                        <Text className='small-bold text-gray-300'>Estimated Delivery</Text>
                        <Text className='base-bold text-dark-100'>20-30 minutes</Text>
                    </View>
                </View>

                {/* Order Summary */}
                <View className='mx-5 mb-5'>
                    <Text className='h3-bold text-dark-100 mb-3'>Order Summary</Text>
                    
                    {/* Order Items - Placeholder */}
                    <View className='bg-white border border-gray-200 rounded-xl p-4 mb-3'>
                        <View className='flex-row justify-between items-center mb-2'>
                            <Text className='base-regular text-dark-100'>2x Burger Deluxe</Text>
                            <Text className='base-bold text-dark-100'>$24.98</Text>
                        </View>
                        <View className='flex-row justify-between items-center'>
                            <Text className='base-regular text-dark-100'>1x Fries</Text>
                            <Text className='base-bold text-dark-100'>$4.99</Text>
                        </View>
                    </View>

                    {/* Totals */}
                    <View className='bg-white border border-gray-200 rounded-xl p-4'>
                        <View className='flex-row justify-between items-center mb-2'>
                            <Text className='base-regular text-gray-200'>Subtotal</Text>
                            <Text className='base-regular text-dark-100'>₱{((order.total_price || 0) - (order.delivery_fee || 0)).toFixed(2)}</Text>
                        </View>
                        <View className='flex-row justify-between items-center mb-2'>
                            <Text className='base-regular text-gray-200'>Delivery Fee</Text>
                            <Text className='base-regular text-dark-100'>₱{(order.delivery_fee || 0).toFixed(2)}</Text>
                        </View>
                        <View className='h-[1px] bg-gray-200 my-2' />
                        <View className='flex-row justify-between items-center'>
                            <Text className='base-bold text-dark-100'>Total</Text>
                            <Text className='base-bold text-primary'>₱{(order.total_price || 0).toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Delivery Address */}
                <View className='mx-5'>
                    <Text className='h3-bold text-dark-100 mb-3'>Delivery Address</Text>
                    <View className='bg-white border border-gray-200 rounded-xl p-4 flex-row items-start'>
                        <Image 
                            source={images.location}
                            className='size-5 mr-3 mt-1'
                            tintColor='#FE8C00'
                        />
                        <Text className='base-regular text-dark-100 flex-1'>
                            {order.delivery_address || 'No address provided'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default OrderDetail
