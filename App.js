import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import HomeScreenAdmin from "./src/screens/HomeScreenAdmin";
import ProfileScreen from "./src/screens/ProfileScreen";
import ScanScreen from "./src/screens/ScanScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ReportScreen from "./src/screens/ReportScreen";

const Stack = createStackNavigator();

export default function App() {
  console.log("App.js carregado.");
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerStyle: { backgroundColor: "#f1901d" } }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerTitle: "" }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerTitle: "" }} />
        <Stack.Screen name="HomeAdmin" component={HomeScreenAdmin} options={{ headerTitle: "" }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerTitle: "" }} />
        <Stack.Screen name="ScanScreen" component={ScanScreen} options={{ headerTitle: "" }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerTitle: "" }} />
        <Stack.Screen name="ReportScreen" component={ReportScreen} options={{ headerTitle: "" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}