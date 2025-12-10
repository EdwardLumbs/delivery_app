import { Category } from '@/type'
import cn from 'clsx'
import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'
import { FlatList, Platform, Text, TouchableOpacity } from 'react-native'

const Filter = ({ categories }: {categories: Category[] }) => {
    const searchParams = useLocalSearchParams()
    const active = (searchParams.category as string) || 'all'

    const handlePress = (categoryName: string) => {
        if(categoryName === 'All') router.setParams({category: undefined})
        else router.setParams({category: categoryName})
    }

    const filterData: {name: string}[] = categories 
        ? [{ name: 'All' }, ...categories.map(c => ({ name: c.name }))]
        : [{ name: 'All'}]

    return (
        <FlatList 
            data={filterData}
            keyExtractor={(item) => item.name}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName='gap-x-2 pb-3'
            renderItem={({item}) => (
                <TouchableOpacity 
                    className={cn('filter', active === item.name || (active === 'all' && item.name === 'All') ? 'bg-amber-500' : 'bg-white')}
                    style={Platform.OS === 'android' ? 
                        { elevation: 5, shadowColor: '#878787'} : 
                        {}}
                    onPress={() => handlePress(item.name)}
                >
                    <Text className={cn('body-medium', active === item.name || (active === 'all' && item.name === 'All') ? 'text-white' : 'text-gray-200')}>
                        {item.name}
                    </Text>
                </TouchableOpacity>
            )}
        />
    )
}

export default Filter