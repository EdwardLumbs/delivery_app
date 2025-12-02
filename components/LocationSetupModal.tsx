import CustomButton from '@/components/CustomButton'
import { images } from '@/constants'
import { router } from 'expo-router'
import React from 'react'
import { Image, Modal, Text, View } from 'react-native'

interface LocationSetupModalProps {
    visible: boolean
    onClose?: () => void
}

const LocationSetupModal = ({ visible, onClose }: LocationSetupModalProps) => {
    const handleSetLocation = () => {
        // Navigate to address picker
        router.push({
            pathname: '/address-picker',
            params: { 
                returnTo: '/',
                addressField: 'address_1',
                isRequired: 'true'
            }
        })
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className='flex-1 bg-black/50 items-center justify-center px-5'>
                <View className='bg-white rounded-3xl p-6 w-full max-w-md items-center'>
                    {/* Icon */}
                    <View className='size-24 bg-primary/10 rounded-full items-center justify-center mb-4'>
                        <Image 
                            source={images.location} 
                            className='size-12' 
                            resizeMode='contain' 
                            tintColor='#FE8C00'
                        />
                    </View>

                    {/* Title */}
                    <Text className='h3-bold text-dark-100 text-center mb-2'>
                        Set Your Delivery Location
                    </Text>

                    {/* Description */}
                    <Text className='base-regular text-gray-200 text-center mb-6'>
                        We need your location to check if we deliver to your area and calculate delivery fees.
                    </Text>

                    {/* Info Box */}
                    <View className='bg-primary/5 rounded-xl p-4 mb-6 w-full'>
                        <Text className='body-medium text-dark-100 mb-2'>
                            📍 Why we need this:
                        </Text>
                        <Text className='base-regular text-gray-200'>
                            • Verify delivery availability{'\n'}
                            • Calculate accurate delivery fees{'\n'}
                            • Ensure timely delivery
                        </Text>
                    </View>

                    {/* Button */}
                    <CustomButton 
                        title='Set My Location'
                        onPress={handleSetLocation}
                        style='w-full'
                    />
                </View>
            </View>
        </Modal>
    )
}

export default LocationSetupModal
