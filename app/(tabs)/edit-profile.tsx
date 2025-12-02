import CustomButton from '@/components/CustomButton'
import CustomHeader from '@/components/CustomHeader'
import CustomInput from '@/components/CustomInput'
import { images } from '@/constants'
import { supabase } from '@/lib/supabase'
import useAuthStore from '@/store/auth.store'
import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const EditProfile = () => {
    const { user, fetchAuthenticatedUser } = useAuthStore()
    const params = useLocalSearchParams()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)


    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone_number: user?.phone_number || '',
        address_1: user?.address_1 || '',
        address_2: user?.address_2 || '',
        address_1_coords: user?.address_1_coords || null,
        address_2_coords: user?.address_2_coords || null
    })

    // Handle address selection from address picker
    useEffect(() => {
        if (params.selectedAddress && params.geoJson) {
            console.log('=== RECEIVED FROM ADDRESS PICKER ===')
            console.log('Selected Address:', params.selectedAddress)
            console.log('GeoJSON:', params.geoJson)
            console.log('Auto Save:', params.autoSave)
            
            // Parse GeoJSON from string
            const geoJsonPoint = JSON.parse(params.geoJson as string)
            
            // Determine which address field to update based on addressField param
            const addressField = params.addressField as string || 'address_1'
            
            if (addressField === 'address_1') {
                setFormData(prev => {
                    const newData = {
                        ...prev,
                        address_1: params.selectedAddress as string,
                        address_1_coords: geoJsonPoint
                    }
                    console.log('Updated formData:', newData)
                    
                    // Auto-save if coming from location setup
                    if (params.autoSave === 'true') {
                        console.log('Auto-save triggered, will save in 1 second...')
                        setTimeout(async () => {
                            await handleSaveFromLocationSetup(newData)
                        }, 1000)
                    }
                    
                    return newData
                })
            } else if (addressField === 'address_2') {
                setFormData(prev => ({
                    ...prev,
                    address_2: params.selectedAddress as string,
                    address_2_coords: geoJsonPoint
                }))
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.selectedAddress, params.geoJson, params.addressField, params.autoSave])

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

            // Convert GeoJSON to WKT (Well-Known Text) for PostGIS
            // PostGIS expects: POINT(longitude latitude)
            let address1WKT = null
            let address2WKT = null
            
            if (formData.address_1_coords) {
                // Check if it's a GeoJSON object (has coordinates array)
                if (typeof formData.address_1_coords === 'object' && 'coordinates' in formData.address_1_coords && Array.isArray(formData.address_1_coords.coordinates)) {
                    const [lon, lat] = formData.address_1_coords.coordinates
                    address1WKT = `POINT(${lon} ${lat})`
                } else {
                    // If it's already in WKB/WKT format from database, keep it as is
                    address1WKT = formData.address_1_coords as any
                }
            }
            
            if (formData.address_2_coords) {
                // Check if it's a GeoJSON object (has coordinates array)
                if (typeof formData.address_2_coords === 'object' && 'coordinates' in formData.address_2_coords && Array.isArray(formData.address_2_coords.coordinates)) {
                    const [lon, lat] = formData.address_2_coords.coordinates
                    address2WKT = `POINT(${lon} ${lat})`
                } else {
                    // If it's already in WKB/WKT format from database, keep it as is
                    address2WKT = formData.address_2_coords as any
                }
            }

            // Update user in database
            const { error } = await supabase
                .from('users')
                .update({
                    name: formData.name.trim(),
                    phone_number: phoneToStore,
                    address_1: formData.address_1.trim() || null,
                    address_2: formData.address_2.trim() || null,
                    address_1_coords: address1WKT,
                    address_2_coords: address2WKT,
                    avatar: avatarUrl
                })
                .eq('id', user.id)

            if (error) {
                console.log('handleSave error:', error)
                throw error
            }

            console.log('handleSave: Profile updated successfully!')
            
            // Refresh user data in store
            await fetchAuthenticatedUser();
            
            // Set global flag for success modal
            (global as any).profileJustUpdated = true;
            console.log('Set global.profileJustUpdated = true');
            
            // Navigate to profile (modal will show there)
            router.replace('/profile');
        } catch (error: any) {
            console.log('handleSave error:', error)
            Alert.alert('Error', 'Failed to update profile. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSaveFromLocationSetup = async (dataToSave?: any) => {
        try {
            setIsSubmitting(true)
            
            // Use passed data or current formData
            const saveData = dataToSave || formData
            
            console.log('=== handleSaveFromLocationSetup START ===')
            console.log('User ID:', user?.id)
            console.log('Address 1:', saveData.address_1)
            console.log('Address 1 Coords:', saveData.address_1_coords)

            if (!user?.id) {
                console.log('ERROR: No user ID')
                Alert.alert('Error', 'User not found')
                return
            }

            if (!saveData.address_1 || !saveData.address_1.trim()) {
                console.log('ERROR: No address provided')
                Alert.alert('Error', 'No address provided')
                return
            }

            // Convert GeoJSON to WKT
            let address1WKT = null
            
            if (saveData.address_1_coords) {
                if (typeof saveData.address_1_coords === 'object' && 'coordinates' in saveData.address_1_coords && Array.isArray(saveData.address_1_coords.coordinates)) {
                    const [lon, lat] = saveData.address_1_coords.coordinates
                    address1WKT = `POINT(${lon} ${lat})`
                    console.log('Converted to WKT:', address1WKT)
                } else {
                    address1WKT = saveData.address_1_coords as any
                    console.log('Using existing format:', address1WKT)
                }
            }

            console.log('Updating database...')
            // Update only address in database
            const { data, error } = await supabase
                .from('users')
                .update({
                    address_1: saveData.address_1.trim(),
                    address_1_coords: address1WKT
                })
                .eq('id', user.id)
                .select()

            if (error) {
                console.log('DATABASE ERROR:', error)
                throw error
            }

            console.log('Database update result:', data)
            console.log('Refreshing user data...')
            
            // Refresh user data in store
            await fetchAuthenticatedUser()
            
            console.log('=== handleSaveFromLocationSetup SUCCESS ===')
            Alert.alert('Success', 'Location saved successfully!')
            
            // Navigate to home
            router.replace('/(tabs)')
        } catch (error: any) {
            console.log('=== handleSaveFromLocationSetup ERROR ===')
            console.log('Error:', error)
            Alert.alert('Error', `Failed to save location: ${error.message}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDiscard = () => {
        setFormData({
            name: user?.name || '',
            phone_number: user?.phone_number || '',
            address_1: user?.address_1 || '',
            address_2: user?.address_2 || '',
            address_1_coords: user?.address_1_coords || null,
            address_2_coords: user?.address_2_coords || null
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

                        <View>
                            <View className='flex-row items-end gap-2'>
                                <View className='flex-1'>
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
                                </View>
                                <TouchableOpacity 
                                    onPress={() => router.push({
                                        pathname: '/address-picker',
                                        params: { 
                                            returnTo: '/edit-profile',
                                            addressField: 'address_1'
                                        }
                                    })}
                                    className='bg-primary h-12 w-12 rounded-xl items-center justify-center mb-1'
                                >
                                    <Image 
                                        source={images.location}
                                        className='size-6'
                                        tintColor='white'
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View>
                            <View className='flex-row items-end gap-2'>
                                <View className='flex-1'>
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
                                <TouchableOpacity 
                                    onPress={() => router.push({
                                        pathname: '/address-picker',
                                        params: { 
                                            returnTo: '/edit-profile',
                                            addressField: 'address_2'
                                        }
                                    })}
                                    className='bg-primary h-12 w-12 rounded-xl items-center justify-center mb-1'
                                >
                                    <Image 
                                        source={images.location}
                                        className='size-6'
                                        tintColor='white'
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
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
