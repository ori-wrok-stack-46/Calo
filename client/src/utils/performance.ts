import { InteractionManager, Platform } from 'react-native';
import { useMemo, useCallback, useRef, useEffect } from 'react';

// Performance optimization utilities
export class PerformanceUtils {
  // Debounce function calls to prevent excessive API requests
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle function calls to limit execution frequency
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Run expensive operations after interactions complete
  static runAfterInteractions(callback: () => void): void {
    InteractionManager.runAfterInteractions(callback);
  }

  // Optimize image loading for better performance
  static optimizeImageUri(uri: string, width?: number, height?: number): string {
    if (!uri) return '';
    
    // For web, we can add resize parameters
    if (Platform.OS === 'web' && (width || height)) {
      const params = new URLSearchParams();
      if (width) params.append('w', width.toString());
      if (height) params.append('h', height.toString());
      params.append('q', '80'); // Quality
      
      return uri.includes('?') 
        ? `${uri}&${params.toString()}`
        : `${uri}?${params.toString()}`;
    }
    
    return uri;
  }

  // Memory management for large lists
  static getOptimalListConfig(itemCount: number) {
    const baseConfig = {
      removeClippedSubviews: true,
      maxToRenderPerBatch: 10,
      updateCellsBatchingPeriod: 50,
      initialNumToRender: 10,
      windowSize: 10,
    };

    if (itemCount > 100) {
      return {
        ...baseConfig,
        maxToRenderPerBatch: 5,
        initialNumToRender: 5,
        windowSize: 5,
      };
    }

    return baseConfig;
  }
}

// Custom hooks for performance optimization
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const throttledCallback = useRef<T>();
  const lastRan = useRef<number>(0);

  return useMemo(() => {
    return ((...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = Date.now();
      }
    }) as T;
  }, [callback, delay]);
};

export const useMemoizedSelector = <T>(
  selector: (state: any) => T,
  equalityFn?: (left: T, right: T) => boolean
) => {
  return useMemo(() => selector, [selector]);
};

// Layout optimization utilities
export const LayoutUtils = {
  // Calculate optimal dimensions for responsive design
  getResponsiveDimensions: (baseWidth: number, baseHeight: number) => {
    const { width: screenWidth, height: screenHeight } = require('react-native').Dimensions.get('window');
    
    const widthRatio = screenWidth / 375; // Base iPhone width
    const heightRatio = screenHeight / 812; // Base iPhone height
    
    return {
      width: baseWidth * widthRatio,
      height: baseHeight * heightRatio,
      fontSize: Math.min(widthRatio, heightRatio),
    };
  },

  // Get safe area padding for different screen sizes
  getSafeAreaPadding: (insets: any) => ({
    paddingTop: Math.max(insets.top, 20),
    paddingBottom: Math.max(insets.bottom, 20),
    paddingLeft: Math.max(insets.left, 16),
    paddingRight: Math.max(insets.right, 16),
  }),

  // Calculate optimal font sizes for accessibility
  getAccessibleFontSize: (baseSize: number, scale: number = 1) => {
    const minSize = 12;
    const maxSize = 28;
    const scaledSize = baseSize * scale;
    return Math.max(minSize, Math.min(maxSize, scaledSize));
  },
};

// Animation performance utilities
export const AnimationUtils = {
  // Standard animation configurations
  spring: {
    tension: 300,
    friction: 25,
    useNativeDriver: true,
  },
  
  timing: {
    duration: 250,
    useNativeDriver: true,
  },

  // Optimized animation for large lists
  listAnimation: {
    duration: 150,
    useNativeDriver: true,
  },

  // Smooth page transitions
  pageTransition: {
    duration: 300,
    useNativeDriver: true,
  },
};

// Memory management utilities
export const MemoryUtils = {
  // Clear unused images from memory
  clearImageCache: () => {
    if (Platform.OS === 'ios') {
      // iOS specific image cache clearing
      console.log('Clearing iOS image cache');
    } else if (Platform.OS === 'android') {
      // Android specific image cache clearing
      console.log('Clearing Android image cache');
    }
  },

  // Monitor memory usage
  monitorMemory: () => {
    if (__DEV__) {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        console.log('Memory usage:', {
          used: Math.round(memoryInfo.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memoryInfo.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memoryInfo.jsHeapSizeLimit / 1048576) + ' MB',
        });
      }
    }
  },
};

// Network optimization utilities
export const NetworkUtils = {
  // Retry logic for failed requests
  retryRequest: async <T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError!;
  },

  // Check network connectivity
  isNetworkAvailable: async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        return navigator.onLine;
      }
      
      // For React Native, you'd use @react-native-community/netinfo
      return true; // Fallback
    } catch {
      return false;
    }
  },
};

// Import useState for useDebounce hook
import { useState } from 'react';