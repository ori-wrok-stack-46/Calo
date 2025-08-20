import React from "react";
import { deviceConnectionService } from "../src/services/deviceConnections";

// Custom hook for Google Fit authentication
export const useGoogleFitAuth = () => {
  const connectGoogleFit = async () => {
    try {
      console.log("🔄 Starting Google Fit authentication via hook...");

      // Use the service method directly
      const result = await deviceConnectionService.connectGoogleFit();

      return result;
    } catch (error) {
      console.error("💥 Google Fit connection error in hook:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  };

  return {
    connectGoogleFit,
  };
};
