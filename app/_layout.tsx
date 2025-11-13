// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SecureStorageProvider } from "@/contexts/SecureStorageContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="safe-mode" options={{ headerShown: false }} />
      <Stack.Screen name="contacts" options={{ title: "Emergency Contacts", presentation: "modal" }} />
      <Stack.Screen name="notes" options={{ title: "Secure Notes", presentation: "modal" }} />
      <Stack.Screen name="add-note" options={{ title: "Add Note", presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SecureStorageProvider>
          <RootLayoutNav />
        </SecureStorageProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
