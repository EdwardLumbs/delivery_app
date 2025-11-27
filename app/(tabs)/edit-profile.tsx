import CustomButton from '@/components/CustomButton'
import CustomHeader from '@/components/CustomHeader'
import CustomInput from '@/components/CustomInput'
import { images } from '@/constants'
import { supabase } from '@/lib/supabase'
import useAuthStore from '@/store/auth.store'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const EditProfile = () => {
    const { user, fetchAuthenticatedUser } = useAuthStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone_number: user?.phone_number || '',
        address_1: user?.address_1 || '',
        address_2: user?.address_2 || ''
    })

    // Format phone number as user types: +63 922 813 5697
    const formatPhoneNumber = (text: string) => {
        // Remove all non-digits
        const cleaned = text.replace(/\D/g, '')
        
        // If empty, return empty
        if (cleaned.length === 0) {
            return ''
        }
        
        // Handle different input formats
        let digits = cleaned
        
        // If starts with 0, replace with 63
        if (cleaned.startsWith('0')) {
            digits = '63' + cleaned.substring(1)
        }
        // If doesn't start with 63, prepend 63
        else if (!cleaned.startsWith('63')) {
            digits = '63' + cleaned
        }
        
        // Limit to 12 digits (63 + 10 digits)
        digits = digits.substring(0, 12)
        
        // Format as: +63 922 813 5697
        let result = '+63'
        
        if (digits.length > 2) {
            result += ' ' + digits.substring(2, 5)
        }
        if (digits.length > 5) {
            result += ' ' + digits.substring(5, 8)
        }
        if (digits.length > 8) {
            result += ' ' + digits.substring(8, 12)
        }
        
        return result
    }

    const handlePhoneChange = (text: string) => {
        // Only allow if empty or contains digits
        if (text === '' || /\d/.test(text)) {
            const formatted = formatPhoneNumber(text)
            setFormData({...formData, phone_number: formatted})
        }
    }

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please allow access to your photo library.')
                return
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            })

            if (!result.canceled && result.assets[0]) {
                setSelectedImage(result.assets[0].uri)
            }
        } catch (error) {
            console.log('pickImage error:', error)
            Alert.alert('Error', 'Failed to pick image')
        }
    }

    const uploadImage = async (uri: string): Promise<string> => {
        try {
            setIsUploadingImage(true)
            
            // Get file extension
            const ext = uri.split('.').pop()
            const fileName = `${user?.id}-${Date.now()}.${ext}`
            const filePath = `avatars/${fileName}`

            // Fetch the image as blob
            const response = await fetch(uri)
            const blob = await response.blob()

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, {
                    contentType: `image/${ext}`,
                    upsert: true
                })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            return publicUrl
        } catch (error) {
            console.log('uploadImage error:', error)
            throw error
        } finally {
            setIsUploadingImage(false)
        }
    }

    const handleSave = async () => {
        try {
            setIsSubmitting(true)
            console.log('handleSave: Updating user profile...')

            if (!user?.id) {
                Alert.alert('Error', 'User not found')
                return
            }

            // Validation
            if (!formData.name.trim()) {
                Alert.alert('Validation Error', 'Name is required')
                return
            }

            if (formData.name.length > 100) {
                Alert.alert('Validation Error', 'Name must be less than 100 characters')
                return
            }

            // Validate phone format if provided
            if (formData.phone_number) {
                const phoneDigits = formData.phone_number.replace(/\D/g, '')
                if (phoneDigits.length < 11 || phoneDigits.length > 13) {
                    Alert.alert('Validation Error', 'Phone number must be 11-13 digits')
                    return
                }
                if (!phoneDigits.startsWith('63') && !phoneDigits.startsWith('0')) {
                    Alert.alert('Validation Error', 'Phone number must start with 63 or 0')
                    return
                }
            }

            if (formData.address_1 && formData.address_1.length > 255) {
                Alert.alert('Validation Error', 'Address 1 must be less than 255 characters')
                return
            }

            if (formData.address_2 && formData.address_2.length > 255) {
                Alert.alert('Validation Error', 'Address 2 must be less than 255 characters')
                return
            }

            // Upload image if selected
            let avatarUrl = user.avatar
            if (selectedImage) {
                avatarUrl = await uploadImage(selectedImage)
            }

            // Store phone without spaces
            const phoneToStore = formData.phone_number ? formData.phone_number.replace(/\s/g, '') : null

            // Update user in database
            const { error } = await supabase
                .from('users')
                .update({
                    name: formData.name.trim(),
                    phone_number: phoneToStore,
                    address_1: formData.address_1.trim() || null,
                    address_2: formData.address_2.trim() || null,
                    avatar: avatarUrl
                })
                .eq('id', user.id)

            if (error) {
                console.log('handleSave error:', error)
                throw error
            }

            console.log('handleSave: Profile updated successfully!')
            
            // Refresh user data in store
            await fetchAuthenticatedUser()
            
            Alert.alert('Success', 'Profile updated successfully!')
            router.replace('/profile')
        } catch (error: any) {
            console.log('handleSave error:', error)
            Alert.alert('Error', 'Failed to update profile. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDiscard = () => {
        setFormData({
            name: user?.name || '',
            phone_number: user?.phone_number || '',
            address_1: user?.address_1 || '',
            address_2: user?.address_2 || ''
        })
        setSelectedImage(null)
        router.replace('/profile')
    }

    return (
        <SafeAreaView className='bg-white h-full'>
            <ScrollView contentContainerClassName='pb-28 px-5 pt-5'>
                <CustomHeader title='Edit Profile' />
                <View className='gap-5 items-center'>
                    <TouchableOpacity onPress={pickImage} disabled={isUploadingImage}>
                        <Image 
                            className='profile-avatar'
                            source={selectedImage ? { uri: selectedImage } : (user?.avatar ? { uri: user.avatar } : images.person)}
                        />
                        <View className='profile-edit'>
                            {isUploadingImage ? (
                                <ActivityIndicator size='small' color='white' />
                            ) : (
                                <Image 
                                    source={images.pencil}
                                    className='size-4'
                                />
                            )}
                        </View>
                    </TouchableOpacity>

                    <View className='w-full gap-5'>
                        <CustomInput 
                            label='Full Name'
                            placeholder='Enter your name'
                            value={formData.name}
                            onChangeText={(text) => {
                                if (text.length <= 100) {
                                    setFormData({...formData, name: text})
                                }
                            }}
                        />

                        <View className='opacity-50 pointer-events-none'>
                            <CustomInput 
                                label='Email'
                                placeholder='Email cannot be changed'
                                value={user?.email || ''}
                                keyboardType='email-address'
                            />
                        </View>

                        <CustomInput 
                            label='Phone Number'
                            placeholder='+63 922 813 5697'
                            value={formData.phone_number}
                            onChangeText={handlePhoneChange}
                            keyboardType='phone-pad'
                        />

                        <CustomInput 
                            label='Address 1'
                            placeholder='Enter your primary address'
                            value={formData.address_1}
                            onChangeText={(text) => {
                                if (text.length <= 255) {
                                    setFormData({...formData, address_1: text})
                                }
                            }}
                        />

                        <CustomInput 
                            label='Address 2'
                            placeholder='Enter your secondary address (optional)'
                            value={formData.address_2}
                            onChangeText={(text) => {
                                if (text.length <= 255) {
                                    setFormData({...formData, address_2: text})
                                }
                            }}
                        />
                    </View>

                    <View className='gap-3 w-full mt-5'>
                        <CustomButton 
                            title='Save Changes'
                            isLoading={isSubmitting}
                            onPress={handleSave}
                        />
                        <CustomButton 
                            title='Discard Changes'
                            isLoading={isSubmitting}
                            onPress={handleDiscard}
                            style='bg-[#f24141]'
                            textStyle='paragraph-semibold text-white'
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default EditProfile
