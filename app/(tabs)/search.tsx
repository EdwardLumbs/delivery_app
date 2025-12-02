import CartButton from '@/components/CartButton'
import Filter from '@/components/Filter'
import MenuCard from '@/components/MenuCard'
import SearchBar from '@/components/SearchBar'
import { images } from '@/constants'
import useMenuStore from '@/store/menu.store'
import { MenuItem } from '@/type'
import cn from 'clsx'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { FlatList, Image, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Search = () => {
    const {category, query} = useLocalSearchParams<{query: string; category: string}>()
    const { menuItems, categories, isLoading, fetchMenu, fetchCategories, shouldRefetch } = useMenuStore()

    // Fetch data on mount or when cache is stale
    useEffect(() => {
        console.log('Search page mounted, checking cache...')
        
        // Check if we should refetch based on TTL
        if (shouldRefetch()) {
            console.log('Cache is stale or empty, fetching from database')
            fetchMenu({ category: category || '', query: query || '', limit: 6 })
        } else {
            console.log('Using cached menu data')
        }
        
        // Fetch categories if not cached (they rarely change)
        if (categories.length === 0) {
            fetchCategories()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category, query])

    // Filter menu items based on current category and query
    const filteredMenuItems = menuItems.filter(item => {
        const matchesCategory = !category || category === 'All' || item.category_id === category
        const matchesQuery = !query || item.name.toLowerCase().includes(query.toLowerCase())
        return matchesCategory && matchesQuery
    }).slice(0, 6)

    return (
        <SafeAreaView className='bg-white h-full'>
            <FlatList
                data={filteredMenuItems}
                renderItem={({item, index}) => {
                    const isFirstRightColItem = index % 2 === 0

                    return (
                        <View className={cn('flex-1 max-w-[48%]', !isFirstRightColItem ? 'mt-10': 'mt-0')}>
                            <MenuCard
                                item={item as MenuItem}
                                onPress={() => router.push(`/menu/${item.id}` as any)}
                            />
                        </View>
                    )
                }}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                numColumns={2}
                columnWrapperClassName='gap-7'
                contentContainerClassName='gap-7 px-5 pb-32'
                ListHeaderComponent={() => (
                    <View className='my-5 gap-5'>
                        <View className='flex-between flex-row w-full'>
                            <View className='flex-start'>
                                <Text className='small-bold uppercase text-primary'>Search</Text>
                                <View className='flex-start flex-row gap-x-1 mt-0.5'>
                                    <Text className='paragraph-semibold text-dark-100'>Find your favorite food</Text>
                                </View>
                            </View>
                            <CartButton/>
                        </View>

                        <SearchBar/>

                        <Filter categories={categories}/>
                    </View>
                )}
                ListEmptyComponent={() => !isLoading && (
                    <View className='items-center'>
                        <Image 
                            className='w-48 h-48'
                            source={images.emptyState}
                            resizeMode='contain'
                        />
                        <Text className='h3-bold text-dark-100'>Nothing matched your search</Text>
                        <Text className='paragraph-medium text-gray-200 mt-5'>Try a different search term or check for typos</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    )
}

export default Search
