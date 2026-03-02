import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {RootStackParamList} from "../types/RootStackParamList.ts";

// screens
import Home from "../screens/Home/Home.tsx";
import Settings from "../screens/Settings/Settings.tsx";
import Welcome from "../screens/Welcome/Welcome.tsx";

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="Home" screenOptions={{headerShown: false}}>
            <Stack.Screen
                name="Welcome"
                component={Welcome}
            />
            <Stack.Screen
                name="Home"
                component={Home}
            />
            <Stack.Screen
                name="Settings"
                component={Settings}
                options={{
                    animation: 'slide_from_right', // 'slide_from_right' | 'slide_from_left' | 'slide_from_bottom' | 'fade'
                }}
            />
        </Stack.Navigator>
    );
};

export default StackNavigator;