import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="email-verification" />
      <Stack.Screen name="forgotPassword" />
      <Stack.Screen name="resetPassword" />
    </Stack>
  );
}
