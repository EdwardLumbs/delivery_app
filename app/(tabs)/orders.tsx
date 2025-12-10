import CustomHeader from '@/components/CustomHeader'
import OrderCard from '@/components/OrderCard'
import { images } from '@/constants'
import { getActiveOrders, getPreviousOrders, Order } from '@/lib/queries'
import { subscribeToOrderUpdates } from '@/lib/realtime'
import useAuthStore from '@/store/auth.store'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Image, RefreshControl, SectionList, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Orders = () => {
    const { user } = useAuthStore()
    const [activeOrders, setActiveOrders] = useState<Order[]>([])
    const [previousOrders, setPreviousOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Fetch orders on mount
    useEffect(() => {
        if (user?.id) {
            fetchOrders()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id])

    // Set up real-time subscription for active orders
    useEffect(() => {
        if (!user?.id) return

        const unsubscribe = subscribeToOrderUpdates(user.id, handleOrderUpdate)

        return unsubscribe
    }, [user?.id])

    const handleOrderUpdate = (updatedOrder: Order) => {
        const isActive = ['pending', 'preparing', 'out_for_delivery'].includes(updatedOrder.status)
        
        if (isActive) {
            // Update or add to active orders
            setActiveOrders(prev => {
                const exists = prev.find(o => o.id === updatedOrder.id)
                if (exists) {
                    return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o)
                }
                return [updatedOrder, ...prev]
            })
            // Remove from previous orders if it was there
            setPreviousOrders(prev => prev.filter(o => o.id !== updatedOrder.id))
        } else {
            // Move to previous orders
            setPreviousOrders(prev => {
                const exists = prev.find(o => o.id === updatedOrder.id)
                if (exists) {
                    return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o)
                }
                return [updatedOrder, ...prev]
            })
            // Remove from active orders
            setActiveOrders(prev => prev.filter(o => o.id !== updatedOrder.id))
        }
    }

    const fetchOrders = async () => {
        try {
            setIsLoading(true)
            const [active, previous] = await Promise.all([
                getActiveOrders(user!.id),
                getPreviousOrders(user!.id, 20)
            ])
            setActiveOrders(active)
            setPreviousOrders(previous)
        } catch (error) {
            console.error('Error fetching orders:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchOrders()
        setIsRefreshing(false)
    }

    const sections = [
        { title: 'Active Orders', data: activeOrders },
        { title: 'Past Orders', data: previousOrders }
    ].filter(section => section.data.length > 0)

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
            <SectionList
                sections={sections}
                renderItem={({ item }) => <OrderCard order={item} />}
                renderSectionHeader={({ section: { title } }) => renderSectionHeader(title)}
                keyExtractor={(item) => item.id}
                contentContainerClassName='pb-28 px-5 pt-5'
                ListHeaderComponent={() => <CustomHeader title="Your Orders" />}
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
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={['#FE8C00']}
                        tintColor='#FE8C00'
                    />
                }
            />
        </SafeAreaView>
    )
}

export default Orders
