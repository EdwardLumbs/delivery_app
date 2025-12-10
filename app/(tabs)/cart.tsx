import CartItem from '@/components/cards/CartItem'
import CustomButton from '@/components/misc/CustomButton'
import CustomHeader from '@/components/misc/CustomHeader'
import PaymentSummary from '@/components/ui/PaymentSummary'
import { images } from '@/constants'
import { useCartStore } from '@/store/cart.store'
import { router } from 'expo-router'
import { FlatList, Image, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Cart = () => {
    const { items, getTotalItems, getTotalPrice } = useCartStore()

    const totalItems = getTotalItems()
    const totalPrice = getTotalPrice()
    
    // Check if all items are excluded
    const allExcluded = items.length > 0 && items.every(item => item.isExcluded)
    const hasIncludedItems = totalPrice > 0
    
    const deliveryFee = hasIncludedItems ? 5 : 0
    const discount = hasIncludedItems ? 0.5 : 0

    return (
        <SafeAreaView className='bg-white h-full'>
            <FlatList
                data={items}
                renderItem={({item}) => <CartItem item={item} />}
                keyExtractor={(item) => item.id}
                contentContainerClassName='pb-64 px-5 pt-5'
                ListHeaderComponent={() => <CustomHeader title="Your Cart" />}
                ListEmptyComponent={() => (
                    <View className='items-center'>
                        <Image 
                            className='w-48 h-48'
                            source={images.emptyState}
                            resizeMode='contain'
                        />
                        <Text className='h3-bold text-dark-100'>Your cart is empty</Text>
                        <CustomButton
                            title="Ready to dig in?"
                            onPress={() => router.push('/(tabs)/search')}
                            style="mt-5 bg-primary/10"
                            textStyle="text-primary"
                        />
                    </View>
                )}
                ListFooterComponent={() => totalItems > 0 && (
                    <View className='mt-6'>
                        <PaymentSummary
                            subtotal={totalPrice}
                            deliveryFee={deliveryFee}
                            discount={discount}
                            totalItems={totalItems}
                            buttonTitle={allExcluded ? 'No Items Selected' : 'Checkout'}
                            onButtonPress={() => {
                                if (!allExcluded) {
                                    router.push('/checkout')
                                }
                            }}
                            buttonDisabled={allExcluded}
                        />
                    </View>
                )}
            />
        </SafeAreaView>
    )
}

export default Cart