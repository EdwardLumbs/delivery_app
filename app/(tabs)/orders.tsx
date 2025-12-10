import CustomHeader from '@/components/misc/CustomHeader'
import OrderCard from '@/components/cards/OrderCard'
import { images } from '@/constants'
import { getActiveOrders, getPreviousOrders, Order } from '@/lib/queries'
import { queryClient } from '@/lib/queryClient'
import { subscribeToOrderUpdates } from '@/lib/realtime'
import useAuthStore from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import { ActivityIndicator, Image, RefreshControl, SectionList, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Orders = () => {
    const { user } = useAuthStore()

    // Fetch active orders with React Query
    const { data: activeOrders = [], isLoading: isLoadingActive, refetch: refetchActive } = useQuery({
        queryKey: ['active-orders', user?.id],
        queryFn: () => getActiveOrders(user!.id),
        enabled: !!user?.id,
        staleTime: 30 * 1000, // 30 seconds (orders change frequently)
    })

    // Fetch previous orders with React Query
    const { data: previousOrders = [], isLoading: isLoadingPrevious, refetch: refetchPrevious } = useQuery({
        queryKey: ['previous-orders', user?.id],
        queryFn: () => getPreviousOrders(user!.id, 20),
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes (previous orders don't change often)
    })

    const isLoading = isLoadingActive || isLoadingPrevious

    // Set up real-time subscription to update React Query cache
    useEffect(() => {
        if (!user?.id) return

        const unsubscribe = subscribeToOrderUpdates(user.id, (updatedOrder) => {
            const isActive = ['pending', 'preparing', 'out_for_delivery'].includes(updatedOrder.status)
            
            if (isActive) {
                // Update active orders cache
                queryClient.setQueryData(['active-orders', user.id], (old: Order[] = []) => {
                    const exists = old.find(o => o.id === updatedOrder.id)
                    if (exists) {
                        return old.map(o => o.id === updatedOrder.id ? updatedOrder : o)
                    }
                    return [updatedOrder, ...old]
                })
                
                // Remove from previous orders cache if it was there
                queryClient.setQueryData(['previous-orders', user.id], (old: Order[] = []) => {
                    return old.filter(o => o.id !== updatedOrder.id)
                })
            } else {
                // Move to previous orders cache
                queryClient.setQueryData(['previous-orders', user.id], (old: Order[] = []) => {
                    const exists = old.find(o => o.id === updatedOrder.id)
                    if (exists) {
                        return old.map(o => o.id === updatedOrder.id ? updatedOrder : o)
                    }
                    return [updatedOrder, ...old]
                })
                
                // Remove from active orders cache
                queryClient.setQueryData(['active-orders', user.id], (old: Order[] = []) => {
                    return old.filter(o => o.id !== updatedOrder.id)
                })
            }
        })

        return unsubscribe
    }, [user?.id])

    const handleRefresh = async () => {
        await Promise.all([refetchActive(), refetchPrevious()])
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
                renderItem={({ item, section }) => (
                    <OrderCard 
                        order={item} 
                        isActive={section.title === 'Active Orders'}
                    />
                )}
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
                        refreshing={isLoadingActive || isLoadingPrevious}
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
