import CustomButton from '@/components/misc/CustomButton'
import { useCartStore } from '@/store/cart.store'
import { MenuItem } from '@/type'
import { Image, Platform, Text, TouchableOpacity } from 'react-native'

const MenuCard = ({item: { id, image_url, name, price }, onPress}: { item: MenuItem, onPress?: () => void }) => {
    const { addItem } = useCartStore()

    return (
        <TouchableOpacity
            onPress={onPress} 
            className='menu-card' 
            style={Platform.OS === 'android' ? 
                { elevation: 10, shadowColor: '#878787' } : 
                {}}
        >
            <Image 
                source={{uri: image_url}}
                className='size-32 absolute -top-10'
                resizeMode='contain'
            />
            <Text 
                className='text-center base-bold text-dark-100 mb-2'
                numberOfLines={1}
            >
                {name}
            </Text>
            <Text className='body-regular text-gray-200 mb-4'>From ${price}</Text>
            <CustomButton
                title="Add to Cart +"
                onPress={() => addItem({id, name, price, image_url, customizations: []})}
                style="bg-transparent p-0"
                textStyle="text-primary paragraph-bold"
            />
        </TouchableOpacity>
    )
}


export default MenuCard