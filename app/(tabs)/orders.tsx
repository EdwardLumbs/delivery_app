import CustomHeader from '@/components/CustomHeader'
import OrderCard from '@/components/OrderCard'
import { images } from '@/constants'
import { getUserOrders, Order } from '@/lib/queries'
import useAuthStore from '@/store/auth.store'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Image, SectionList, Text, View } from 'react-native'
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

    const sections = [
        { title: 'Active Orders', data: activeOrders },
        { title: 'Past Orders', data: pastOrders }
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
            />
        </SafeAreaView>
    )
}

export default Orders
