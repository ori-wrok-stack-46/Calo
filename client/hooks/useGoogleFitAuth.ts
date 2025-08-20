import React from "react";
import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";

// Custom hook for Google Fit authentication
export const useGoogleFitAuth = () => {
  const config = {
    clientId:
      process.env.EXPO_PUBLIC_GOOGLE_FIT_CLIENT_ID ||
      "68705076317-s2vqnmlnpu7r2qlr95bhkh4f2lbfqhg1.apps.googleusercontent.com",
    clientSecret: process.env.EXPO_PUBLIC_GOOGLE_FIT_CLIENT_SECRET || "",
    scopes: [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.body.read",
      "https://www.googleapis.com/auth/fitness.heart_rate.read",
      "https://www.googleapis.com/auth/fitness.location.read",
    ],
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: config.clientId,
      scopes: config.scopes,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
      },
      redirectUri: "",
    },
    {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    }
  );

  const exchangeCodeForToken = async (code: string, redirectUri: string) => {
    try {
      const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      });

      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: body.toString(),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `Token exchange failed: ${response.status} ${responseText}`
        );
      }

      const tokenData = JSON.parse(responseText);

      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      return tokenData;
    } catch (error) {
      console.error("💥 Error exchanging Google Fit code:", error);
      throw error;
    }
  };

  const storeTokens = async (accessToken: string, refreshToken?: string) => {
    try {
      await SecureStore.setItemAsync("device_token_GOOGLE_FIT", accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(
          "device_refresh_GOOGLE_FIT",
          refreshToken
        );
      }
    } catch (error) {
      console.error("💥 Failed to store tokens:", error);
      throw error;
    }
  };

  const connectGoogleFit = async () => {
    try {
      if (!config.clientSecret) {
        throw new Error("Google Fit client secret not configured");
      }

      console.log("🔄 Starting Google Fit authentication...");

      const result = await promptAsync();

      console.log("🔄 Auth result:", result.type);

      if (result.type === "success" && result.params.code) {
        console.log("✅ Got authorization code, exchanging for token...");

        const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
        const tokenResponse = await exchangeCodeForToken(
          result.params.code,
          redirectUri
        );

        if (tokenResponse.access_token) {
          await storeTokens(
            tokenResponse.access_token,
            tokenResponse.refresh_token
          );

          return {
            success: true,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in,
          };
        }
      } else if (result.type === "cancel") {
        throw new Error("Authorization cancelled by user");
      } else {
        throw new Error(`Authorization failed: ${result.type}`);
      }

      throw new Error("No access token received");
    } catch (error) {
      console.error("💥 Google Fit connection error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  };

  return {
    connectGoogleFit,
    request,
    response,
  };
};
