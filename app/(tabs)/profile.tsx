import CustomButton from '@/components/CustomButton'
import CustomHeader from '@/components/CustomHeader'
import { images } from '@/constants'
import { signOut } from '@/lib/supabase'
import useAuthStore from '@/store/auth.store'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Image, ScrollView, Text, View } from 'react-native'
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

    }

    return (
        <SafeAreaView className='bg-white h-full'>
            <ScrollView contentContainerClassName='pb-28 px-5 pt-5'>
                <CustomHeader title='Profile' />
                <View className='gap-5 items-center'>
                    <Image 
                        className='profile-avatar'
                        source={user?.avatar ? { uri: user.avatar } : images.person}
                    />
                    <View className='bg-white p-5 rounded-xl gap-5 w-full'>
                        <View className='profile-field'>
                            <View className='profile-field__icon'>
                                <Image
                                    source={images.user}
                                    className={'size-5'}
                                    resizeMode={"contain"}
                                />
                            </View>
                            <View>
                                <Text className='body-medium text-gray-100'>Full Name</Text>
                                <Text className='base-regular'>{user?.name}</Text>
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
                            <View>
                                <Text className='body-medium text-gray-100'>Email</Text>
                                <Text className='base-regular'>{user?.email}</Text>
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
                            <View>
                                <Text className='body-medium text-gray-100'>Phone Number</Text>
                                <Text className='base-regular'>{user?.phone_number}</Text>
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
                            <View>
                                <Text className='body-medium text-gray-100'>Address 1</Text>
                                <Text className='base-regular'>{user?.address_1}</Text>
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
                            <View>
                                <Text className='body-medium text-gray-100'>Address 2</Text>
                                <Text className='base-regular'>{user?.address_2}</Text>
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
                                    className='profile-field__icon size-6'
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
