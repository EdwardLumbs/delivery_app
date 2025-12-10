import CustomButton from '@/components/CustomButton'
import CustomHeader from '@/components/CustomHeader'
import { images } from '@/constants'
import { signOut } from '@/lib/supabase'
import useAuthStore from '@/store/auth.store'
import cn from 'clsx'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Profile = () => {
    const { clearAuth, user } = useAuthStore()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleLogout = async () => {
        try {
            setIsSubmitting(true)
            console.log('handleLogout: Signing out from Supabase...')
            
            // 1. Sign out from Supabase (clears session)
            await signOut()
            
            // 2. Clear Zustand state
            clearAuth()
            
            console.log('handleLogout: Redirecting to sign-in...')
            // 3. Redirect to sign-in
            router.replace('/sign-in')
        } catch (error: any) {
            console.log('handleLogout error:', error)
            Alert.alert('Error', 'Failed to logout. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = () => {
        router.push('/edit-profile')
    }

    return (
        <SafeAreaView className='bg-white h-full'>
            <ScrollView contentContainerClassName='pb-28 px-5 pt-5'>
                <CustomHeader title='Profile' />
                <View className='gap-5 items-center'>
                    <TouchableOpacity>
                        <Image 
                            className='profile-avatar'
                            source={user?.avatar ? { uri: user.avatar } : images.person}
                            onError={(error) => {
                                console.log('=== PROFILE PAGE IMAGE ERROR ===')
                                console.log('Error loading avatar:', error.nativeEvent.error)
                                console.log('Avatar URL was:', user?.avatar)
                            }}
                            onLoad={() => {
                                console.log('=== PROFILE PAGE IMAGE LOADED ===')
                                console.log('Successfully loaded avatar from:', user?.avatar)
                            }}
                        />
                        <View className='profile-edit'>
                            <Image 
                                source={images.pencil}
                                className='size-4'
                            />
                        </View>
                    </TouchableOpacity>
                    <View className='bg-white p-5 rounded-xl gap-5 w-full'>
                        <View className='profile-field'>
                            <View className='profile-field__icon'>
                                <Image
                                    source={images.user}
                                    className={'size-5'}
                                    resizeMode={"contain"}
                                />
                            </View>
                            <View className='flex-1'>
                                <Text className='body-medium text-gray-100'>Full Name</Text>
                                <Text className='base-regular' numberOfLines={2} ellipsizeMode='tail'>{user?.name}</Text>
                            </View>
                        </View>
                        <View className='profile-field'>
                            <View className='profile-field__icon'>
                                <Image
                                    source={images.envelope}
                                    className={'size-5'}
                                    resizeMode={"contain"}
                                />
                            </View>
                            <View className='flex-1'>
                                <Text className='body-medium text-gray-100'>Email</Text>
                                <Text className='base-regular' numberOfLines={2} ellipsizeMode='tail'>{user?.email}</Text>
                            </View>
                        </View>
                        <View className='profile-field'>
                            <View className='profile-field__icon'>
                                <Image
                                    source={images.phone}
                                    className={'size-5'}
                                    resizeMode={"contain"}
                                />
                            </View>
                            <View className='flex-1'>
                                <Text className='body-medium text-gray-100'>Phone Number</Text>
                                <Text 
                                    className={cn('base-regular', !user?.phone_number && 'text-gray-200')}
                                    numberOfLines={2}
                                    ellipsizeMode='tail'
                                >
                                    {user?.phone_number || 'No Phone Number Registered'}
                                </Text>
                            </View>
                        </View>
                        <View className='profile-field'>
                            <View className='profile-field__icon'>
                                <Image
                                    source={images.location}
                                    className={'size-5'}
                                    resizeMode={"contain"}
                                />
                            </View>
                            <View className='flex-1'>
                                <Text className='body-medium text-gray-100'>Address 1</Text>
                                <Text 
                                    className={cn('base-regular', !user?.address_1 && 'text-gray-200')}
                                    numberOfLines={2}
                                    ellipsizeMode='tail'
                                >
                                    {user?.address_1 || 'No Address Registered'}
                                </Text>
                            </View>
                        </View>
                        <View className='profile-field'>
                            <View className='profile-field__icon'>
                                <Image
                                    source={images.location}
                                    className={'size-5'}
                                    resizeMode={"contain"}
                                />
                            </View>
                            <View className='flex-1'>
                                <Text className='body-medium text-gray-100'>Address 2</Text>
                                <Text 
                                    className={cn('base-regular', !user?.address_2 && 'text-gray-200')}
                                    numberOfLines={2}
                                    ellipsizeMode='tail'
                                >
                                    {user?.address_2 || 'No Address Registered'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View className='gap-3 w-full'>
                        <CustomButton 
                            title='Edit Profile'
                            isLoading={isSubmitting}
                            onPress={handleEdit}
                            style='bg-primary/10 border-primary border'
                            textStyle='paragraph-semibold text-primary'
                        />
                        <CustomButton 
                            title='Logout'
                            isLoading={isSubmitting}
                            leftIcon={
                                <Image 
                                    className='size-6 rounded-full flex items-center justify-center mr-3'
                                    source={images.logout}
                                />
                            }
                            onPress={handleLogout}
                            style={'custom-btn items-center bg-[#f24141]/10 border-[#f24141] border'}
                            textStyle='paragraph-semibold text-[#f24141]'
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Profile
