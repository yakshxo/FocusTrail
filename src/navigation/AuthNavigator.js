import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#f7f9f7"
        },
        headerTintColor: "#1f2a1f",
        headerTitleStyle: {
          fontWeight: "600"
        }
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: "FocusTrail Login" }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ title: "Create Account" }}
      />
    </Stack.Navigator>
  );
}