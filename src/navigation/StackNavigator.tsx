import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {RootStackParamList} from "../types/RootStackParamList.ts";
import Home from "../screens/Home/Home.tsx";

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="Home" screenOptions={{headerShown: false}}>
            <Stack.Screen
                name="Home"
                component={Home}
            />
        </Stack.Navigator>
    );
};

export default StackNavigator;