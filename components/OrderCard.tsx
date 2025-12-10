import { Order } from '@/lib/queries'
import React from 'react'
import { Text, View } from 'react-native'

interface OrderCardProps {
    order: Order
}

const OrderCard = ({ order }: OrderCardProps) => {
    return (
        <View className='bg-white rounded-2xl p-4 mb-3 border border-gray-100'>
            <View className='flex-row justify-between items-start mb-2'>
                <View>
                    <Text className='body-bold text-dark-100'>
                        Order #{order.order_number || order.id.slice(0, 8)}
                    </Text>
                    <Text className='small-regular text-gray-200'>
                        {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <View className='bg-primary/10 px-3 py-1 rounded-full'>
                    <Text className='small-bold text-primary capitalize'>
                        {order.status}
                    </Text>
                </View>
            </View>
            <View className='flex-row justify-between items-center mt-2'>
                <Text className='paragraph-medium text-gray-200'>Total</Text>
                <Text className='h4-bold text-dark-100'>
                    ₱{(order.total_price + order.delivery_fee).toFixed(2)}
                </Text>
            </View>
        </View>
    )
}

export default OrderCard
