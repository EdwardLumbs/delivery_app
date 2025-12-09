import CustomHeader from '@/components/CustomHeader'
import { images } from '@/constants'
import { getUserOrders, Order } from '@/lib/queries'
import useAuthStore from '@/store/auth.store'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Orders = () => {
    const { user } = useAuthStore()
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (user?.id) {
            fetchOrders()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id])

    const fetchOrders = async () => {
        try {
            setIsLoading(true)
            const data = await getUserOrders(user!.id, 20)
            setOrders(data)
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Separate active and past orders
    const activeOrders = orders.filter(order => 
        !['delivered', 'cancelled'].includes(order.status)
    )
    const pastOrders = orders.filter(order => 
        ['delivered', 'cancelled'].includes(order.status)
    )

    const renderOrder = ({ item }: { item: Order }) => (
        <View className='bg-white rounded-2xl p-4 mb-3 border border-gray-100'>
            <View className='flex-row justify-between items-start mb-2'>
                <View>
                    <Text className='body-bold text-dark-100'>
                        Order #{item.order_number || item.id.slice(0, 8)}
                    </Text>
                    <Text className='small-regular text-gray-200'>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <View className='bg-primary/10 px-3 py-1 rounded-full'>
                    <Text className='small-bold text-primary capitalize'>
                        {item.status}
                    </Text>
                </View>
            </View>
            <View className='flex-row justify-between items-center mt-2'>
                <Text className='paragraph-medium text-gray-200'>Total</Text>
                <Text className='h4-bold text-dark-100'>
                    ₱{(item.total_price + item.delivery_fee).toFixed(2)}
                </Text>
            </View>
        </View>
    )

    const renderSectionHeader = (title: string) => (
        <View className='mb-3'>
            <Text className='body-bold text-dark-100'>{title}</Text>
            <View className='h-[1px] bg-gray-100 mt-2' />
        </View>
    )

    if (isLoading) {
        return (
            <SafeAreaView className='bg-white h-full'>
                <View className='p-5'>
                    <CustomHeader title="Your Orders" />
                </View>
                <View className='flex-1 items-center justify-center'>
                    <ActivityIndicator size='large' color='#FE8C00' />
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className='bg-white h-full'>
            <FlatList
                data={[...activeOrders, ...pastOrders]}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                contentContainerClassName='pb-28 px-5 pt-5'
                ListHeaderComponent={() => (
                    <>
                        <CustomHeader title="Your Orders" />
                        {activeOrders.length > 0 && renderSectionHeader('Active Orders')}
                    </>
                )}
                ListEmptyComponent={() => (
                    <View className='items-center justify-center' style={{ minHeight: 400 }}>
                        <Image 
                            source={images.emptyState} 
                            className='w-48 h-48' 
                            resizeMode='contain'
                        />
                        <Text className='h3-bold text-dark-100 mt-4'>No Orders Yet</Text>
                        <Text className='base-regular text-gray-200 text-center mt-2'>
                            Your order history will appear here
                        </Text>
                    </View>
                )}
                ItemSeparatorComponent={() => {
                    // Show divider between active and past orders
                    const currentIndex = orders.findIndex(order => 
                        ['delivered', 'cancelled'].includes(order.status)
                    )
                    if (currentIndex === activeOrders.length && pastOrders.length > 0) {
                        return renderSectionHeader('Past Orders')
                    }
                    return null
                }}
            />
        </SafeAreaView>
    )
}

export default Orders
