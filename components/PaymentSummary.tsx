import CustomButton from '@/components/CustomButton'
import { PaymentInfoStripeProps } from '@/type'
import cn from 'clsx'
import React from 'react'
import { Text, View } from 'react-native'

const PaymentInfoStripe = ({ label, value, labelStyle, valueStyle }: PaymentInfoStripeProps) => (
    <View className="flex-between flex-row my-1">
        <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>
            {label}
        </Text>
        <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>
            {value}
        </Text>
    </View>
)

interface PaymentSummaryProps {
    subtotal: number
    deliveryFee: number
    discount?: number
    totalItems: number
    buttonTitle: string
    onButtonPress: () => void
    buttonDisabled?: boolean
    isLoading?: boolean
}

const PaymentSummary = ({
    subtotal,
    deliveryFee,
    discount = 0,
    totalItems,
    buttonTitle,
    onButtonPress,
    buttonDisabled = false,
    isLoading = false
}: PaymentSummaryProps) => {
    const finalTotal = subtotal + deliveryFee - discount

    return (
        <View className='border border-gray-200 p-5 rounded-2xl'>
            <Text className='h3-bold text-dark-100 mb-5'>Payment Summary</Text>
            
            <PaymentInfoStripe 
                label={`Total Items (${totalItems})`}
                value={`₱${subtotal.toFixed(2)}`}
            />
            <PaymentInfoStripe 
                label="Delivery Fee"
                value={`₱${deliveryFee.toFixed(2)}`}
            />
            {discount > 0 && (
                <PaymentInfoStripe 
                    label="Discount"
                    value={`- ₱${discount.toFixed(2)}`}
                    valueStyle='!text-success'
                />
            )}
            
            <View className='border-t border-gray-300 my-2' />
            
            <PaymentInfoStripe 
                label={`Total (${totalItems})`}
                value={`₱${finalTotal.toFixed(2)}`}
                labelStyle='base-bold !text-dark-100'
                valueStyle='base-bold !text-dark-100 !text-right'
            />
            
            <CustomButton 
                title={buttonTitle}
                onPress={onButtonPress}
                style={buttonDisabled ? 'opacity-50 mt-5' : 'mt-5'}
                isLoading={isLoading}
                disabled={buttonDisabled}
            />
        </View>
    )
}

export default PaymentSummary