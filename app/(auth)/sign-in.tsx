import CustomButton from '@/components/CustomButton';
import CustomInput from '@/components/CustomInput';
import { images } from '@/constants';
import { signIn } from '@/lib/supabase';
import useAuthStore from '@/store/auth.store';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Modal, Text, View } from 'react-native';

const SignIn = () => {
    const { fetchAuthenticatedUser } = useAuthStore()
    
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [form, setForm] = useState({ email: '', password: ''})

    const submit = async () => {
        const { email, password } = form

        if(!email || !password) return Alert.alert('Error', 'Please enter valid email address & password')
    
        setIsSubmitting(true)

        try {
            await signIn({ email, password })
            // Don't fetch user yet - wait for modal
            setShowSuccessModal(true)
        } catch (error: any) {
            Alert.alert('Error', error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleGoToHome = async () => {
        setShowSuccessModal(false)
        // Fetch user now, which will trigger auth redirect
        await fetchAuthenticatedUser()
        router.replace('/')
    }

    return (
        <View className='gap-10 bg-white rounded-lg p-5 mt-5'>
            <CustomInput 
                placeholder="Enter your email"
                value={form.email}
                onChangeText={(text) => setForm((prev) => ({
                    ...prev, email: text
                }))}
                label="Email"
                keyboardType="email-address"
            />
            <CustomInput 
                placeholder="Enter your password"
                value={form.password}
                onChangeText={(text) => setForm((prev) => ({
                    ...prev, password: text
                }))}
                label="Password"
                secureTextEntry={true}
            />
            <CustomButton 
                title='Sign In'
                isLoading={isSubmitting}
                onPress={submit}
            />

            <View className='flex justify-center flex-row gap-2'>
                <Text className='base-regular text-gray-100'>
                    {"Don't have an account?"}
                </Text>
                <Link href='/sign-up' className="base-bold text-primary">
                    Sign Up
                </Link>
            </View>

            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
            >
                <View className="flex-1 bg-black/50 items-center justify-center px-5">
                    <View className="bg-white p-8 rounded-2xl items-center gap-4 w-full max-w-sm">
                        <Image source={images.success} className="size-24" resizeMode="contain" />
                        <Text className="h3-bold text-dark-100">Login Successful!</Text>
                        <Text className="paragraph-medium text-gray-200 text-center">
                            Welcome back! Ready to order some delicious food?
                        </Text>
                        <CustomButton 
                            title="Go to Homepage"
                            onPress={handleGoToHome}
                            style="w-full"
                        />
                    </View>
                </View>
            </Modal>
        </View>
    )
}
export default SignIn
