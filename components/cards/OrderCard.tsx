import { Order } from '@/lib/queries'
import { router } from 'expo-router'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface OrderCardProps {
    order: Order
    isActive?: boolean
}

const OrderCard = ({ order, isActive = false }: OrderCardProps) => {
    const handlePress = () => {
        if (isActive) {
            router.push(`/order/${order.id}` as any)
        }
    }

    const Wrapper = isActive ? TouchableOpacity : View

    return (
        <Wrapper 
            className={`${isActive ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-100'} rounded-2xl p-4 mb-3 border`}
            onPress={isActive ? handlePress : undefined}
            activeOpacity={isActive ? 0.7 : 1}
        >
            <View className='flex-row justify-between items-start mb-2'>
                <View>
                    <Text className={`body-bold ${isActive ? 'text-purple-900' : 'text-dark-100'}`}>
                        Order #{order.order_number || order.id.slice(0, 8)}
                    </Text>
                    <Text className={`small-regular ${isActive ? 'text-purple-600' : 'text-gray-200'}`}>
                        {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <View className={`${isActive ? 'bg-purple-600' : 'bg-gray-100'} px-3 py-1 rounded-full`}>
                    <Text className={`small-bold capitalize ${isActive ? 'text-white' : 'text-gray-600'}`}>
                        {order.status.replace('_', ' ')}
                    </Text>
                </View>
            </View>
            <View className='flex-row justify-between items-center mt-2'>
                <Text className={`paragraph-medium ${isActive ? 'text-purple-600' : 'text-gray-200'}`}>Total</Text>
                <Text className={`h4-bold ${isActive ? 'text-purple-900' : 'text-dark-100'}`}>
                    ₱{(order.total_price + order.delivery_fee).toFixed(2)}
                </Text>
            </View>
        </Wrapper>
    )
}

export default OrderCard
