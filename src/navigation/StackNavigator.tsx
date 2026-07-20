import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {RootStackParamList} from "../types/RootStackParamList.ts";

// screens
import Home from "../screens/Home/Home.tsx";
import Settings from "../screens/Settings/Settings.tsx";
import Welcome from "../screens/Welcome/Welcome.tsx";
import Progression from "../screens/Progression/Progression.tsx";
import Challenges from "../screens/Challenges/Challenges.tsx";
import Shop from "../screens/Shop/Shop.tsx";
import Play from "../screens/Play/Play.tsx";
import Profile from "../screens/Profile/Profile.tsx";

const Stack = createNativeStackNavigator<RootStackParamList>();

interface StackNavigatorProps {
    initialRouteName?: keyof RootStackParamList;
}

const StackNavigator = ({initialRouteName = 'Welcome'}: StackNavigatorProps) => {
    return (
        <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{headerShown: false}}>
            <Stack.Screen
                name="Welcome"
                component={Welcome}
            />
            <Stack.Screen
                name="Home"
                component={Home}
            />
            <Stack.Screen
                name="Play"
                component={Play}
                options={{
                    animation: 'simple_push',
                }}
            />
            <Stack.Screen
                name="Settings"
                component={Settings}
                options={{
                    animation: 'ios_from_right',
                }}
            />
            <Stack.Screen
                name="Progression"
                component={Progression}
                options={{
                    animation: 'ios_from_right',
                }}
            />
            <Stack.Screen
                name="Challenges"
                component={Challenges}
                options={{
                    animation: 'ios_from_right',
                }}
            />
            <Stack.Screen
                name="Shop"
                component={Shop}
                options={{
                    animation: 'ios_from_right',
                }}
            />
            <Stack.Screen
                name="Profile"
                component={Profile}
                options={{
                    animation: 'ios_from_right',
                }}
            />
        </Stack.Navigator>
    );
};

export default StackNavigator;