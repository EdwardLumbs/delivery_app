import CustomButton from '@/components/misc/CustomButton'
import { images } from '@/constants'
import { router } from 'expo-router'
import React from 'react'
import { Image, Modal, Text, View } from 'react-native'

interface AddToCartSuccessModalProps {
    visible: boolean
    onClose: () => void
    addedQuantity: number
}

const AddToCartSuccessModal = ({ visible, onClose, addedQuantity }: AddToCartSuccessModalProps) => {
    return (
        <Modal
            visible={visible}
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
                                onClose()
                                router.push('/(tabs)/search')
                            }}
                            style="bg-primary/10 border-primary border"
                            textStyle="paragraph-semibold text-primary"
                        />
                        <CustomButton 
                            title="Go to cart"
                            onPress={() => {
                                onClose()
                                router.push('/(tabs)/cart')
                            }}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    )
}

export default AddToCartSuccessModal