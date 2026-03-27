import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import SessionScreen from "../screens/SessionScreen";
import MapScreen from "../screens/MapScreen";
import StatsScreen from "../screens/StatsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SessionHistoryScreen from "../screens/SessionHistoryScreen";

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#f7f9f7",
        },
        headerTintColor: "#1f2a1f",
        tabBarActiveTintColor: "#2e6f40",
        tabBarInactiveTintColor: "#777",
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Session" component={SessionScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="History" component={SessionHistoryScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}