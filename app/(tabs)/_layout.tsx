import FloatingCheckoutButton from "@/components/FloatingCheckoutButton";

import LocationSetupModal from "@/components/LocationSetupModal";
import SuccessModal from "@/components/SuccessModal";
import { images } from "@/constants";
import useAuthStore from "@/store/auth.store";
import { TabBarIconProps } from "@/type";
import cn from "clsx";
import { Redirect, Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";

const TabBarIcon = ({ focused, icon, title }: TabBarIconProps) => (
    <View className= "tab-icon">
        <Image 
            source={icon} 
            className="size-7" 
            resizeMode="contain"
            tintColor={focused ? '#FE8C00' : '#5D5F6D'} 
        />
        <Text className={cn('text-sm font-bold', focused ? 'text-primary': 'text-gray-200')}>
            {title}
        </Text>
    </View>
)

export default function TabLayout() {
    const { isAuthenticated, user } = useAuthStore()
    const [showLocationModal, setShowLocationModal] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [successModalContent, setSuccessModalContent] = useState({
        title: 'Success!',
        message: '',
        buttonText: 'Continue'
    })
    
    useEffect(() => {
        console.log('showSuccessModal state changed to:', showSuccessModal)
    }, [showSuccessModal])

    // Listen for location saved and profile updated events
    useEffect(() => {
        console.log('Setting up success modal listeners')
        const checkForSuccess = () => {
            const locationSaved = (global as any).locationJustSaved
            const profileUpdated = (global as any).profileJustUpdated
            
            if (locationSaved) {
                console.log('!!! Location was just saved, showing success modal !!!')
                setShowSuccessModal(true)
                setSuccessModalContent({
                    title: 'Location Saved!',
                    message: 'Your delivery address has been set successfully. You can now start ordering!',
                    buttonText: 'Start Ordering'
                })
                ;(global as any).locationJustSaved = false
            } else if (profileUpdated) {
                console.log('!!! Profile was just updated, showing success modal !!!')
                setShowSuccessModal(true)
                setSuccessModalContent({
                    title: 'Profile Updated!',
                    message: 'Your profile has been updated successfully.',
                    buttonText: 'Done'
                })
                ;(global as any).profileJustUpdated = false
            }
        }
        
        const interval = setInterval(checkForSuccess, 100)
        return () => {
            console.log('Cleaning up success modal listeners')
            clearInterval(interval)
        }
    }, [])

    // Check if user has address on mount and when user data changes
    useEffect(() => {
        if (isAuthenticated && user) {
            console.log('=== CHECKING USER ADDRESS ===')
            console.log('User:', user.email)
            console.log('Address 1:', user.address_1)
            console.log('Address 2:', user.address_2)
            
            // Check if user has at least one address (address_1 OR address_2)
            const hasAddress1 = user.address_1 && user.address_1.trim() !== ''
            const hasAddress2 = user.address_2 && user.address_2.trim() !== ''
            const hasAnyAddress = hasAddress1 || hasAddress2
            
            console.log('Has Address 1:', hasAddress1)
            console.log('Has Address 2:', hasAddress2)
            console.log('Has Any Address:', hasAnyAddress)
            
            if (!hasAnyAddress && !showLocationModal) {
                // Show modal after a short delay for better UX
                console.log('Showing location modal...')
                setTimeout(() => {
                    setShowLocationModal(true)
                }, 500)
            } else if (hasAnyAddress && showLocationModal) {
                // User now has address, hide modal
                console.log('Hiding location modal...')
                setShowLocationModal(false)
            }
        }
    }, [isAuthenticated, user, showLocationModal])

    if(!isAuthenticated) return <Redirect href={'/sign-in'} />



    return (
        <>
            <LocationSetupModal 
                visible={showLocationModal} 
                onClose={() => setShowLocationModal(false)}
            />
            
            <SuccessModal 
                visible={showSuccessModal}
                title={successModalContent.title}
                message={successModalContent.message}
                buttonText={successModalContent.buttonText}
                onClose={() => {
                    console.log('Success modal closed by user')
                    setShowSuccessModal(false)
                }}
            />
            
            <FloatingCheckoutButton />
            
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        borderTopLeftRadius: 50,
                        borderTopRightRadius: 50,
                        borderBottomLeftRadius: 50,
                        borderBottomRightRadius: 50,
                        marginHorizontal: 20,
                        height: 80,
                        position: 'absolute',
                        bottom: 40,
                        backgroundColor: 'white',
                        shadowColor: '#1a1a1a',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 5
                    }
                }}
            >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Home" icon={images.home} focused={focused}/>
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Search" icon={images.search} focused={focused}/>
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    title: 'Cart',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Cart" icon={images.bag} focused={focused}/>
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Orders',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Orders" icon={images.order} focused={focused}/>
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Profile" icon={images.person} focused={focused}/>
                }}
            />
            <Tabs.Screen
                name="edit-profile"
                options={{
                    href: null,
                }}
            />
        </Tabs>
        </>
    )
}

