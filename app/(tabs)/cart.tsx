import CartItem from '@/components/CartItem'
import CustomButton from '@/components/CustomButton'
import CustomHeader from '@/components/CustomHeader'
import { images } from '@/constants'
import { useCartStore } from '@/store/cart.store'
import { PaymentInfoStripeProps } from '@/type'
import cn from 'clsx'
import { router } from 'expo-router'
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const PaymentInfoStripe = ({ label,  value,  labelStyle,  valueStyle, }: PaymentInfoStripeProps) => (
    <View className="flex-between flex-row my-1">
        <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>
            {label}
        </Text>
        <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>
            {value}
        </Text>
    </View>
);

const Cart = () => {
    const { items, getTotalItems, getTotalPrice } = useCartStore()

    const totalItems = getTotalItems()
    const totalPrice = getTotalPrice()
    
    // Check if all items are excluded
    const allExcluded = items.length > 0 && items.every(item => item.isExcluded)
    const hasIncludedItems = totalPrice > 0
    
    const deliveryFee = hasIncludedItems ? 5 : 0
    const discount = hasIncludedItems ? 0.5 : 0
    const finalTotal = totalPrice + deliveryFee - discount

    return (
        <SafeAreaView
            className='bg-white h-full'
        >
            <FlatList
                data={items}
                renderItem={({item}) => <CartItem item={item} />}
                keyExtractor={(item) => item.id}
                contentContainerClassName='pb-28 px-5 pt-5'
                ListHeaderComponent={() => <CustomHeader title="Your Cart" />}
                ListEmptyComponent={() => (
                    <View className='items-center'>
                        <Image 
                            className='w-48 h-48'
                            source={images.emptyState}
                            resizeMode='contain'
                        />
                        <Text className='h3-bold text-dark-100'>Your cart is empty</Text>
                        <TouchableOpacity 
                            onPress={() => router.push('/(tabs)/search')}
                            className='mt-5 p-3 bg-primary/10 rounded-full items-center'
                            activeOpacity={0.7}
                        >
                            <Text className='paragraph-semibold text-primary'>
                                Ready to dig in?
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListFooterComponent={() => totalItems > 0 && (
                    <View className='gap-5'>
                        <View className='mt-6 border border-gray-200 p-5 rounded-2xl'>
                            <Text className='h3-bold text-dark-100 mb-5'>
                                Payment Summary
                            </Text>
                            <PaymentInfoStripe 
                                label={`Total Items (${totalItems})`}
                                value={`$${totalPrice.toFixed(2)}`}
                            />
                            <PaymentInfoStripe 
                                label={`Delivery Fee`}
                                value={`$${deliveryFee.toFixed(2)}`}
                            />
                            <PaymentInfoStripe 
                                label={`Discount`}
                                value={`- $${discount.toFixed(2)}`}
                                valueStyle='!text-success'
                            />
                            <View className='border-t border-gray-300 my-2' />
                            <PaymentInfoStripe 
                                label={`Total (${totalItems})`}
                                value={`$${finalTotal.toFixed(2)}`}
                                labelStyle='base-bold !text-dark-100'
                                valueStyle='base-bold !text-dark-100 !text-right'
                            />
                            <CustomButton 
                                title={allExcluded ? 'No Items Selected' : 'Order Now'}
                                onPress={() => {}}
                                style={allExcluded ? 'opacity-50 mt-5' : 'mt-5'}
                            />
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    )
}

export default Cart
