import CustomButton from '@/components/misc/CustomButton'
import { images } from '@/constants'
import React from 'react'
import { Image, Modal, Text, View } from 'react-native'

interface SuccessModalProps {
    visible: boolean
    title: string
    message: string
    buttonText?: string
    onClose: () => void
}

const SuccessModal = ({ 
    visible, 
    title, 
    message, 
    buttonText = 'Continue',
    onClose 
}: SuccessModalProps) => {
    console.log('SuccessModal render - visible:', visible, 'title:', title)
    
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className='flex-1 bg-black/50 items-center justify-center px-5'>
                <View className='bg-white rounded-3xl p-6 w-full max-w-md items-center'>
                    {/* Success Icon */}
                    <View className='size-24 bg-green-500/10 rounded-full items-center justify-center mb-4'>
                        <Image 
                            source={images.check} 
                            className='size-12' 
                            resizeMode='contain' 
                            tintColor='#22c55e'
                        />
                    </View>

                    {/* Title */}
                    <Text className='h3-bold text-dark-100 text-center mb-2'>
                        {title}
                    </Text>

                    {/* Message */}
                    <Text className='base-regular text-gray-200 text-center mb-6'>
                        {message}
                    </Text>

                    {/* Button */}
                    <CustomButton 
                        title={buttonText}
                        onPress={onClose}
                        style='w-full'
                    />
                </View>
            </View>
        </Modal>
    )
}

export default SuccessModal
