import { images } from "@/constants";
import useAuthStore from "@/store/auth.store";
import { Redirect, Slot } from "expo-router";
import React from 'react';
import { Dimensions, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

export default function AuthLayout() {
    const { isAuthenticated } = useAuthStore()

    if (isAuthenticated) return <Redirect href="/" />

    return (
        <View className="relative h-screen">
            <ImageBackground source={images.loginGraphic} className="size-full" resizeMode="cover" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                className="absolute bottom-0 left-0 right-0 z-20"
                style={{height: Dimensions.get('screen').height * 0.64}}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View className="absolute -top-24 z-30 left-0 right-0 items-center">
                    <Image source={images.logo} className="size-48" resizeMode="contain" />
                </View>
                <ScrollView 
                    className="bg-white rounded-t-3xl flex-1" 
                    keyboardShouldPersistTaps="handled"
                    contentContainerClassName="pt-9"
                >
                    <Slot />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}
