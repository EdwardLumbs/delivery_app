import CartButton from '@/components/misc/CartButton'
import Filter from '@/components/ui/Filter'
import MenuCard from '@/components/cards/MenuCard'
import SearchBar from '@/components/ui/SearchBar'
import { images } from '@/constants'
import { getCategories, getMenu } from '@/lib/queries'
import { MenuItem } from '@/type'
import { useQuery } from '@tanstack/react-query'
import cn from 'clsx'
import { router, useLocalSearchParams } from 'expo-router'
import { FlatList, Image, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Search = () => {
    const {category, query} = useLocalSearchParams<{query: string; category: string}>()

    // Fetch menu items with React Query
    const { data: menuItems = [], isLoading: isLoadingMenu } = useQuery({
        queryKey: ['menu', category, query],
        queryFn: () => getMenu({ 
            category: category || '', 
            query: query || '', 
            limit: 6 
        }),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    // Fetch categories with React Query
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
        staleTime: 30 * 60 * 1000, // 30 minutes (categories rarely change)
    })

    const isLoading = isLoadingMenu

    // Filter menu items based on current category and query
    const filteredMenuItems = menuItems.filter(item => {
        // Find the category object to get its ID
        const selectedCategory = categories.find(cat => cat.name === category)
        const matchesCategory = !category || category === 'All' || item.category_id === selectedCategory?.id
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
