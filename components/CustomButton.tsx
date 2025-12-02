import { CustomButtonProps } from '@/type'
import cn from 'clsx'
import React from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

const CustomButton = ({
    onPress,
    title="Click me",
    style,
    textStyle,
    leftIcon,
    isLoading = false,
    disabled = false
}: CustomButtonProps) => {
    return (
        <TouchableOpacity 
            className={cn('custom-btn', style, disabled && 'opacity-50')} 
            onPress={onPress}
            disabled={disabled || isLoading}
        >
            {leftIcon}

            <View className='flex-center flex-row'>
                {isLoading ? (
                    <ActivityIndicator size='small' color='white' />
                ): (
                    <Text className={cn('paragraph-semibold', textStyle || 'text-white-100')}>
                        {title}
                    </Text>
                )}
            </View>
            
        </TouchableOpacity>
    )
}

export default CustomButton