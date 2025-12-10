import CustomButton from '@/components/CustomButton'
import OutsideDeliveryZoneModal from '@/components/OutsideDeliveryZoneModal'
import { images } from '@/constants'
import { getDeliveryZonePolygon, isWithinDeliveryZone } from '@/lib/geospatial'
import { parseCoordinates } from '@/lib/helpers'
import { updateUserAddress } from '@/lib/queries'
import useAuthStore from '@/store/auth.store'
import * as Location from 'expo-location'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from 'react-native'
import MapView, { Polygon, Region } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'

const AddressPicker = () => {
    const params = useLocalSearchParams()
    const returnTo = (params.returnTo as string) || '/edit-profile'
    const addressField = (params.addressField as string) || 'address_1'
    const isRequired = params.isRequired === 'true' // If true, user can't go back without selecting
    const { user, fetchAuthenticatedUser } = useAuthStore()
    const [address, setAddress] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdatingAddress, setIsUpdatingAddress] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [region, setRegion] = useState<Region>({
        latitude: 14.4444,
        longitude: 120.9025,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    })
    const [deliveryZone, setDeliveryZone] = useState<{latitude: number, longitude: number}[] | null>(null)
    const [showOutsideZoneModal, setShowOutsideZoneModal] = useState(false)
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        initializeMap()
        
        // Cleanup timer on unmount
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const initializeMap = async () => {
        setIsLoading(true)
        
        // Load delivery zone polygon
        const polygon = await getDeliveryZonePolygon()
        if (polygon) {
            setDeliveryZone(polygon)
        }
        
        // Check if user has saved coordinates for this address field
        let initialLat = 14.4444  // Default Kawit
        let initialLng = 120.9025
        
        if (user) {
            let coordsToUse = null
            
            if (addressField === 'address_1' && user.address_1_coords) {
                coordsToUse = user.address_1_coords
            } else if (addressField === 'address_2' && user.address_2_coords) {
                coordsToUse = user.address_2_coords
            }
            
            // Parse coordinates (handles both GeoJSON and WKB formats)
            if (coordsToUse) {
                const parsedCoords = parseCoordinates(coordsToUse)
                if (parsedCoords) {
                    initialLng = parsedCoords[0]  // longitude
                    initialLat = parsedCoords[1]  // latitude
                }
            }
        }
        
        // Set region to saved address or default
        setRegion({
            latitude: initialLat,
            longitude: initialLng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        })
        
        // Get address for the initial location
        await reverseGeocode(initialLat, initialLng)
        
        setIsLoading(false)
    }

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.')
                return
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            })

            const { latitude, longitude } = currentLocation.coords

            setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            })

            await reverseGeocode(latitude, longitude)
        } catch (error) {
            console.log('getCurrentLocation error:', error)
            Alert.alert('Error', 'Failed to get current location')
        }
    }

    const reverseGeocode = async (latitude: number, longitude: number) => {
        try {
            setIsUpdatingAddress(true)
            const result = await Location.reverseGeocodeAsync({ latitude, longitude })
            
            if (result[0]) {
                const addr = [
                    result[0].street,
                    result[0].city,
                    result[0].region,
                    result[0].country
                ].filter(Boolean).join(', ')
                
                setAddress(addr)
            }
        } catch (error) {
            console.log('reverseGeocode error:', error)
        } finally {
            setIsUpdatingAddress(false)
        }
    }

    const handleRegionChange = (newRegion: Region) => {
        setRegion(newRegion)
        setIsUpdatingAddress(true)
        
        // Clear previous timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
        }
        
        // Set new timer - only update address after user stops dragging for 800ms
        debounceTimer.current = setTimeout(() => {
            reverseGeocode(newRegion.latitude, newRegion.longitude)
        }, 800)
    }

    const saveLocationDirectlyQuiet = async (addressText: string, geoJson: any) => {
        try {
            setIsSaving(true)
            console.log('=== SAVING LOCATION DIRECTLY (QUIET) ===')
            console.log('Address:', addressText)
            console.log('GeoJSON:', geoJson)

            if (!user?.id) {
                Alert.alert('Error', 'User not found')
                return
            }

            // Convert GeoJSON to WKT format for database
            const wkt = `POINT(${geoJson.coordinates[0]} ${geoJson.coordinates[1]})`
            console.log('WKT:', wkt)

            // Update user address in database
            await updateUserAddress({
                userId: user.id,
                address_1: addressText.trim(),
                address_1_coords: wkt
            })

            console.log('Address updated successfully')
            
            // Refresh user data FIRST so the store has the new address
            await fetchAuthenticatedUser();
            console.log('User data refreshed');
            
            // NO success modal for quiet save
            
        } catch (error) {
            console.error('saveLocationDirectlyQuiet error:', error)
            Alert.alert('Error', 'Failed to save location')
        } finally {
            setIsSaving(false)
        }
    }

    const saveLocationDirectly = async (addressText: string, geoJson: any) => {
        try {
            setIsSaving(true)
            console.log('=== SAVING LOCATION DIRECTLY ===')
            console.log('Address:', addressText)
            console.log('GeoJSON:', geoJson)

            if (!user?.id) {
                Alert.alert('Error', 'User not found')
                return
            }

            // Convert GeoJSON to WKT
            const [lon, lat] = geoJson.coordinates
            const wkt = `POINT(${lon} ${lat})`
            console.log('WKT:', wkt)

            // Save to database
            await updateUserAddress({
                userId: user.id,
                address_1: addressText.trim(),
                address_1_coords: wkt
            })

            console.log('Location saved successfully!');
            
            // Refresh user data FIRST so the store has the new address
            await fetchAuthenticatedUser();
            console.log('User data refreshed');
            
            // Set global flag for success modal (will be picked up by tab layout)
            (global as any).locationJustSaved = true;
            console.log('Set global.locationJustSaved = true');
            
            // Navigate to home (modal will show there)
            router.replace('/(tabs)');
            console.log('Navigated to home');
        } catch (error: any) {
            console.log('saveLocationDirectly error:', error)
            Alert.alert('Error', `Failed to save location: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleConfirm = async () => {
        console.log('=== HANDLE CONFIRM ===')
        console.log('returnTo:', returnTo)
        console.log('isRequired:', isRequired)
        console.log('address:', address)
        
        if (!address) {
            Alert.alert('Error', 'Please select a location on the map')
            return
        }

        // Check if location is within delivery zone
        setIsSaving(true)
        const isInZone = await isWithinDeliveryZone(region.longitude, region.latitude)
        setIsSaving(false)

        if (!isInZone) {
            setShowOutsideZoneModal(true)
            return
        }

        // Create GeoJSON Point from map center (note: coordinates are [longitude, latitude])
        const geoJsonPoint = {
            type: 'Point',
            coordinates: [region.longitude, region.latitude]
        }

        // Navigate back with the selected address and GeoJSON coordinates
        if (returnTo === '/checkout') {
            console.log('→ Saving directly and returning to checkout')
            // Coming from checkout - save directly to database and go back (no success modal)
            await saveLocationDirectlyQuiet(address, geoJsonPoint)
            router.replace('/checkout')
        } else if (returnTo === '/edit-profile' && !isRequired) {
            console.log('→ Going back to edit-profile with preview (not saving yet)')
            // Coming from edit profile - return with preview data, don't save yet
            router.push({
                pathname: '/(tabs)/edit-profile',
                params: { 
                    selectedAddress: address,
                    geoJson: JSON.stringify(geoJsonPoint),
                    addressField: addressField
                }
            })
        } else if (returnTo === '/edit-profile' && isRequired) {
            console.log('→ Going to edit-profile (initial setup)')
            router.push({
                pathname: '/(tabs)/edit-profile',
                params: { 
                    selectedAddress: address,
                    geoJson: JSON.stringify(geoJsonPoint),
                    addressField: addressField
                }
            })
        } else if (returnTo === '/' && isRequired) {
            console.log('→ Saving directly (from location setup)')
            // Coming from location setup - save directly to database
            saveLocationDirectly(address, geoJsonPoint)
        } else {
            console.log('→ Going back')
            router.back()
        }
    }



    if (isLoading) {
        return (
            <SafeAreaView className='flex-1 items-center justify-center bg-white'>
                <ActivityIndicator size='large' color='#FE8C00' />
                <Text className='paragraph-medium text-gray-200 mt-4'>Getting your location...</Text>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className='flex-1 bg-white'>
            <View className='p-5'>
                <View className='flex-row items-center justify-between mb-4'>
                    {!isRequired ? (
                        <TouchableOpacity onPress={() => router.back()}>
                            <Image source={images.arrowBack} className='size-6' resizeMode='contain' />
                        </TouchableOpacity>
                    ) : (
                        <View className='size-6' />
                    )}
                    <Text className='h3-bold text-dark-100'>Select Delivery Address</Text>
                    <View className='size-6' />
                </View>
            </View>

            <View className='flex-1 relative'>
                <MapView
                    style={{ flex: 1 }}
                    initialRegion={region}
                    onRegionChange={handleRegionChange}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                >
                    {deliveryZone && (
                        <Polygon
                            coordinates={deliveryZone}
                            fillColor="rgba(254, 140, 0, 0.15)"
                            strokeColor="#FE8C00"
                            strokeWidth={2}
                        />
                    )}
                </MapView>

                {/* Fixed center pin that stays in middle of screen */}
                <View className='absolute top-0 left-0 right-0 bottom-0 items-center justify-center pointer-events-none'>
                    <View className='items-center' style={{ marginBottom: 40 }}>
                        <Image 
                            source={images.location} 
                            className='size-12' 
                            resizeMode='contain' 
                            tintColor='#FE8C00'
                        />
                    </View>
                </View>

                {/* GPS button */}
                <TouchableOpacity 
                    className='absolute top-4 right-4 size-12 bg-white rounded-full items-center justify-center shadow-lg'
                    onPress={getCurrentLocation}
                >
                    <Image source={images.location} className='size-6' resizeMode='contain' tintColor='#FE8C00' />
                </TouchableOpacity>
            </View>

            <View className='bg-white p-5 gap-4'>
                <View className='flex-row items-start gap-3'>
                    <Image source={images.location} className='size-6 mt-1' resizeMode='contain' tintColor='#FE8C00' />
                    <View className='flex-1'>
                        <Text className='body-medium text-gray-200'>Selected Address</Text>
                        {isUpdatingAddress ? (
                            <ActivityIndicator size='small' color='#FE8C00' />
                        ) : (
                            <Text className='base-regular text-dark-100'>
                                {address || 'Drag the map to select your delivery location'}
                            </Text>
                        )}
                    </View>
                </View>

                <CustomButton 
                    title='Confirm Address'
                    onPress={handleConfirm}
                    disabled={!address || isUpdatingAddress}
                    isLoading={isSaving}
                />
            </View>

            <OutsideDeliveryZoneModal 
                visible={showOutsideZoneModal}
                onTryAgain={() => setShowOutsideZoneModal(false)}
                showExitButton={isRequired}
            />
        </SafeAreaView>
    )
}

export default AddressPicker
