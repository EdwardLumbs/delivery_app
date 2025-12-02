import { images } from '@/constants'
import React from 'react'
import { Image, Text, View } from 'react-native'

const StarRating = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating)
    const hasPartialStar = rating % 1 !== 0
    const partialStarWidth = (rating % 1) * 100

    return (
        <View className='flex-row items-center gap-1'>
            {[1, 2, 3, 4, 5].map((star) => (
                <View key={star} className='relative w-5 h-5'>
                    {star <= fullStars ? (
                        <Image 
                            source={images.star} 
                            className='w-5 h-5' 
                            tintColor='#FE8C00'
                            resizeMode='contain'
                        />
                    ) : star === fullStars + 1 && hasPartialStar ? (
                        <>
                            <Image 
                                source={images.star} 
                                className='w-5 h-5 absolute' 
                                tintColor='#E0E0E0'
                                resizeMode='contain'
                            />
                            <View className='overflow-hidden absolute' style={{ width: `${partialStarWidth}%` }}>
                                <Image 
                                    source={images.star} 
                                    className='w-5 h-5' 
                                    tintColor='#FE8C00'
                                    resizeMode='contain'
                                />
                            </View>
                        </>
                    ) : (
                        <Image 
                            source={images.star} 
                            className='w-5 h-5' 
                            tintColor='#E0E0E0'
                            resizeMode='contain'
                        />
                    )}
                </View>
            ))}
            <Text className='paragraph-semibold text-dark-100 ml-1'>{rating.toFixed(1)}</Text>
        </View>
    )
}

export default StarRating
