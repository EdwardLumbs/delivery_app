import React from 'react'
import { Image, Text, View } from 'react-native'

interface CheckoutItemProps {
    item: {
        id: string
        name: string
        price: number
        quantity: number
        image_url: string
    }
}

const CheckoutItem = ({ item }: CheckoutItemProps) => {
    return (
        <View className='flex-row items-center py-3 border-b border-gray-100'>
            <Image
                source={{ uri: item.image_url }}
                className='w-12 h-12 rounded-lg mr-3'
                resizeMode='cover'
            />
            <View className='flex-1'>
                <Text className='body-bold text-dark-100'>{item.name}</Text>
                <Text className='small-regular text-gray-200'>Qty: {item.quantity}</Text>
            </View>
            <Text className='paragraph-bold text-dark-100'>
                ₱{(item.price * item.quantity).toFixed(2)}
            </Text>
        </View>
    )
}

export default CheckoutItem