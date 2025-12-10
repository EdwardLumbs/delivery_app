import CustomButton from '@/components/misc/CustomButton'
import { images } from '@/constants'
import { BackHandler, Image, Modal, Text, View } from 'react-native'

interface OutsideDeliveryZoneModalProps {
    visible: boolean
    onTryAgain: () => void
    showExitButton?: boolean
}

const OutsideDeliveryZoneModal = ({ visible, onTryAgain, showExitButton = true }: OutsideDeliveryZoneModalProps) => {
    const handleExit = () => {
        BackHandler.exitApp()
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
        >
            <View className='flex-1 bg-black/50 items-center justify-center px-5'>
                <View className='bg-white rounded-3xl p-6 w-full max-w-md items-center'>
                    {/* Icon */}
                    <View className='size-24 bg-red-500/10 rounded-full items-center justify-center mb-4'>
                        <Image 
                            source={images.location} 
                            className='size-12' 
                            resizeMode='contain' 
                            tintColor='#EF4444'
                        />
                    </View>

                    {/* Title */}
                    <Text className='h3-bold text-dark-100 text-center mb-2'>
                        Outside Delivery Area
                    </Text>

                    {/* Description */}
                    <Text className='base-regular text-gray-200 text-center mb-6'>
                        Sorry, we don&apos;t deliver to this location yet. Please select an address within the highlighted delivery zone on the map.
                    </Text>

                    {/* Buttons */}
                    <View className='w-full gap-3'>
                        <CustomButton 
                            title='Try Again'
                            onPress={onTryAgain}
                            style='w-full'
                        />
                        {showExitButton && (
                            <CustomButton 
                                title='Exit App'
                                onPress={handleExit}
                                style='w-full bg-gray-100'
                                textStyle='text-dark-100'
                            />
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    )
}

export default OutsideDeliveryZoneModal
