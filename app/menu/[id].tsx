import CustomButton from '@/components/misc/CustomButton'
import CustomHeader from '@/components/misc/CustomHeader'
import StarRating from '@/components/ui/StarRating'
import { images } from '@/constants'
import { getMenuById } from '@/lib/queries'
import { useCartStore } from '@/store/cart.store'
import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useState } from 'react'
import { Image, Modal, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'


const MenuPage = () => {
    const { id } = useLocalSearchParams()
    const { addItem } = useCartStore()
    const [quantity, setQuantity] = useState(0)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [addedQuantity, setAddedQuantity] = useState(0)
    
    const { data: menuItem, isLoading } = useQuery({
        queryKey: ['menu-item', id],
        queryFn: () => getMenuById(id as string),
        enabled: !!id, // Only run query if id exists
        staleTime: 10 * 60 * 1000, // 10 minutes (menu items don't change often)
    })

    if (isLoading) {
        return (
            <SafeAreaView className='flex-1 items-center justify-center'>
                <Text className='h1-bold'>Loading...</Text>
            </SafeAreaView>
        )
    }

    if (!menuItem) {
        return (
            <SafeAreaView className='flex-1 items-center justify-center'>
                <CustomHeader />
                <Text className='h1-bold'>Menu item not found</Text>
            </SafeAreaView>
        )
    }

    const {name, description, image_url, price, rating, calories, protein } = menuItem
    const totalPrice = quantity * price
    
    return (
        <SafeAreaView className='flex-1 bg-white'>
            <View className='p-5'>
                <CustomHeader />
            </View>
            <View className='flex-row'>
                <View className='w-2/5 pl-5 gap-4 z-10'>
                    <Text className='h1-bold text-dark-100'>{name}</Text>
                    
                    <StarRating rating={rating} />
                    
                    <View className='flex-row items-baseline'>
                        <Text className='h1-bold text-primary'>$</Text>
                        <Text className='h1-bold text-dark-100'>{price.toFixed(2)}</Text>
                    </View>
                    
                    <View className='flex-row gap-6'>
                        <View>
                            <Text className='body-medium text-gray-200'>Calories</Text>
                            <Text className='base-bold text-dark-100'>{calories}</Text>
                        </View>
                        <View>
                            <Text className='body-medium text-gray-200'>Protein</Text>
                            <Text className='base-bold text-dark-100'>{protein}g</Text>
                        </View>
                    </View>
                </View>
                
                <View className='flex-1 h-96 justify-center'>
                    <Image 
                        source={{ uri: image_url }}
                        className='w-full h-full'
                        resizeMode='center'
                    />
                </View>
            </View>
            
            <View className='leading-6 px-5 pb-5'>
                <Text className='h3-bold'>
                    Description:
                </Text>
                <Text className='paragraph-medium text-gray-200 pt-2 pb-5'>
                    {description}
                </Text>
            </View>

            <View className='flex-row justify-between mx-5 px-4 py-2 bg-primary/10 rounded-full'>
                <View className='flex-row items-center'>
                    <Image
                        source={images.dollar}
                        className='size-8'
                        resizeMode='contain'
                    />
                    <Text>
                        Free Delivery
                    </Text>
                </View>
                <View className='gap-2 flex-row items-center'>
                    <Image
                        source={images.clock}
                        className='size-5'
                        resizeMode='contain'
                    />
                    <Text>
                        20-30 mins
                    </Text>
                </View>
                <View className='gap-2 flex-row items-center'>
                    <Image
                        source={images.star}
                        className='size-5'
                        resizeMode='contain'
                    />
                    <Text>
                        {rating}
                    </Text>
                </View>
            </View>

            <View className='mx-5 mt-5 gap-4'>
                <View className='flex-row items-center justify-center gap-6'>
                    <TouchableOpacity
                        onPress={() => setQuantity(Math.max(0, quantity - 1))}
                        className='size-12 bg-primary/10 rounded-full items-center justify-center'
                    >
                        <Image
                            source={images.minus}
                            className='size-5'
                            resizeMode='contain'
                            tintColor='#FF9C01'
                        />
                    </TouchableOpacity>

                    <Text className='h3-bold text-dark-100'>{quantity}</Text>

                    <TouchableOpacity
                        onPress={() => setQuantity(quantity + 1)}
                        className='size-12 bg-primary/10 rounded-full items-center justify-center'
                    >
                        <Image
                            source={images.plus}
                            className='size-5'
                            resizeMode='contain'
                            tintColor='#FF9C01'
                        />
                    </TouchableOpacity>
                </View>

                <CustomButton 
                    title={`Add to Cart ($${totalPrice.toFixed(2)})`}
                    leftIcon={
                        <Image
                            source={images.bag}
                            className='size-5 mr-2'
                            resizeMode='contain'
                            tintColor='white'
                        />
                    }
                    onPress={() => {
                        for (let i = 0; i < quantity; i++) {
                            addItem({id: menuItem.id, name, price, image_url, customizations: []})
                        }
                        setAddedQuantity(quantity)
                        setQuantity(0)
                        setShowSuccessModal(true)
                    }}
                    disabled={quantity === 0}
                />
            </View>

            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
            >
                <View className="flex-1 bg-black/50 items-center justify-center px-5">
                    <View className="bg-white p-8 rounded-2xl items-center gap-4 w-full max-w-sm">
                        <Image source={images.success} className="size-24" resizeMode="contain" />
                        <Text className="h3-bold text-dark-100">Added to Cart!</Text>
                        <Text className="paragraph-medium text-gray-200 text-center">
                            {addedQuantity} item(s) successfully added to your cart
                        </Text>
                        <View className="w-full gap-3">
                            <CustomButton 
                                title="Continue Shopping"
                                onPress={() => {
                                    setShowSuccessModal(false)
                                    router.push('/(tabs)/search')
                                }}
                                style="bg-primary/10 border-primary border"
                                textStyle="paragraph-semibold text-primary"
                            />
                            <CustomButton 
                                title="Checkout"
                                onPress={() => {
                                    setShowSuccessModal(false)
                                    router.push('/(tabs)/cart')
                                }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

export default MenuPage