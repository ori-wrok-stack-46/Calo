  import { Dimensions, Platform, PixelRatio } from 'react-native';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import { useCallback, useMemo, useRef } from 'react';
  
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  
  // Layout constants for consistent spacing
  export const LAYOUT = {
    // Screen dimensions
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    
    // Standard spacing scale (8px base)
    SPACING: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    
    // Border radius scale
    RADIUS: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      round: 9999,
    },
    
    // Typography scale
    FONT_SIZE: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    
    // Component dimensions
    TAB_BAR_HEIGHT: 70,
    HEADER_HEIGHT: 60,
    BUTTON_HEIGHT: 48,
    INPUT_HEIGHT: 56,
    
    // Breakpoints for responsive design
    BREAKPOINTS: {
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
    },
  };
  
  // Responsive design utilities
  export class ResponsiveUtils {
    // Get responsive font size based on screen width
    static getFontSize(baseSize: number): number {
      const scale = SCREEN_WIDTH / 375; // Base iPhone width
      const newSize = baseSize * scale;
      
      // Ensure minimum and maximum font sizes
      return Math.max(12, Math.min(28, newSize));
    }
    
    // Get responsive spacing
    static getSpacing(multiplier: number = 1): number {
      const baseSpacing = 8;
      const scale = Math.min(SCREEN_WIDTH / 375, 1.2); // Cap scaling
      return baseSpacing * multiplier * scale;
    }
    
    // Check if device is tablet
    static isTablet(): boolean {
      const pixelDensity = PixelRatio.get();
      const adjustedWidth = SCREEN_WIDTH * pixelDensity;
      const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
      
      if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
        return true;
      }
      
      return (
        (SCREEN_WIDTH >= 768 && SCREEN_HEIGHT >= 1024) ||
        (SCREEN_WIDTH >= 1024 && SCREEN_HEIGHT >= 768)
      );
    }
    
    // Get optimal number of columns for grid layouts
    static getOptimalColumns(itemWidth: number, spacing: number = 16): number {
      const availableWidth = SCREEN_WIDTH - (spacing * 2);
      const columns = Math.floor(availableWidth / (itemWidth + spacing));
      return Math.max(1, Math.min(4, columns)); // Between 1-4 columns
    }
  }
  
  // RTL layout utilities
  export class RTLUtils {
    // Get proper flex direction for RTL
    static getFlexDirection(isRTL: boolean, defaultDirection: 'row' | 'column' = 'row') {
      if (defaultDirection === 'column') return 'column';
      return isRTL ? 'row-reverse' : 'row';
    }
    
    // Get proper text alignment for RTL
    static getTextAlign(isRTL: boolean, defaultAlign: 'left' | 'center' | 'right' = 'left') {
      if (defaultAlign === 'center') return 'center';
      return isRTL ? 'right' : 'left';
    }
    
    // Get proper margin/padding for RTL
    static getHorizontalSpacing(isRTL: boolean, leftValue: number, rightValue: number) {
      return isRTL 
        ? { marginLeft: rightValue, marginRight: leftValue }
        : { marginLeft: leftValue, marginRight: rightValue };
    }
    
    // Get proper positioning for RTL
    static getPosition(isRTL: boolean, leftValue?: number, rightValue?: number) {
      if (leftValue !== undefined && rightValue !== undefined) {
        return isRTL 
          ? { left: rightValue, right: leftValue }
          : { left: leftValue, right: rightValue };
      }
      
      if (leftValue !== undefined) {
        return isRTL ? { right: leftValue } : { left: leftValue };
      }
      
      if (rightValue !== undefined) {
        return isRTL ? { left: rightValue } : { right: rightValue };
      }
      
      return {};
    }
    
    // Transform values for RTL (useful for animations)
    static transformForRTL(isRTL: boolean, value: number): number {
      return isRTL ? -value : value;
    }
  }
  
  // Safe area utilities
  export const useSafeLayout = () => {
    const insets = useSafeAreaInsets();
    
    return useMemo(() => ({
      // Safe area padding
      safeTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 24),
      safeBottom: Math.max(insets.bottom, 16),
      safeLeft: Math.max(insets.left, 16),
      safeRight: Math.max(insets.right, 16),
      
      // Content padding (safe area + extra spacing)
      contentPadding: {
        paddingTop: Math.max(insets.top, 20) + LAYOUT.SPACING.md,
        paddingBottom: Math.max(insets.bottom, 16) + LAYOUT.SPACING.md,
        paddingLeft: Math.max(insets.left, 16) + LAYOUT.SPACING.md,
        paddingRight: Math.max(insets.right, 16) + LAYOUT.SPACING.md,
      },
      
      // Header height including safe area
      headerHeight: LAYOUT.HEADER_HEIGHT + Math.max(insets.top, 20),
      
      // Tab bar height including safe area
      tabBarHeight: LAYOUT.TAB_BAR_HEIGHT + Math.max(insets.bottom, 16),
    }), [insets]);
  };
  
  // Responsive hook for dynamic layouts
  export const useResponsiveLayout = () => {
    return useMemo(() => {
      const isTablet = ResponsiveUtils.isTablet();
      const scale = SCREEN_WIDTH / 375;
      
      return {
        isTablet,
        scale,
        
        // Responsive dimensions
        containerPadding: ResponsiveUtils.getSpacing(isTablet ? 3 : 2),
        cardPadding: ResponsiveUtils.getSpacing(isTablet ? 2.5 : 2),
        buttonHeight: isTablet ? 56 : 48,
        
        // Responsive typography
        titleSize: ResponsiveUtils.getFontSize(isTablet ? 28 : 24),
        bodySize: ResponsiveUtils.getFontSize(16),
        captionSize: ResponsiveUtils.getFontSize(14),
        
        // Grid layouts
        getColumns: (itemWidth: number) => ResponsiveUtils.getOptimalColumns(itemWidth),
      };
    }, []);
  };
  
  // Animation performance hook
  export const useOptimizedAnimation = () => {
    return useMemo(() => ({
      // Standard spring animation
      spring: {
        tension: 300,
        friction: 25,
        useNativeDriver: true,
      },
      
      // Fast animation for UI feedback
      fast: {
        duration: 150,
        useNativeDriver: true,
      },
      
      // Smooth animation for transitions
      smooth: {
        duration: 300,
        useNativeDriver: true,
      },
      
      // Slow animation for emphasis
      slow: {
        duration: 500,
        useNativeDriver: true,
      },
    }), []);
  };
  
  // Layout measurement utilities
  export const useLayoutMeasurement = () => {
    const measureRef = useRef<any>(null);
    
    const measureLayout = useCallback(() => {
      return new Promise<{ width: number; height: number; x: number; y: number }>((resolve) => {
        if (measureRef.current) {
          measureRef.current.measure((x: number, y: number, width: number, height: number) => {
            resolve({ x, y, width, height });
          });
        }
      });
    }, []);
    
    return { measureRef, measureLayout };
  };
  
  // Keyboard handling utilities
  export const KeyboardUtils = {
    // Get keyboard avoiding behavior based on platform
    getKeyboardBehavior: () => {
      return Platform.OS === 'ios' ? 'padding' : 'height';
    },
    
    // Get keyboard offset for different screen sizes
    getKeyboardOffset: (isTablet: boolean = false) => {
      if (Platform.OS === 'ios') {
        return isTablet ? 20 : 0;
      }
      return isTablet ? 40 : 20;
    },
  };
  
  // Color utilities for consistent theming
  export const ColorUtils = {
    // Add opacity to hex color
    addOpacity: (color: string, opacity: number): string => {
      const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
      return `${color}${alpha}`;
    },
    
    // Get contrast color (black or white) for given background
    getContrastColor: (backgroundColor: string): string => {
      // Simple contrast calculation
      const hex = backgroundColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      return brightness > 128 ? '#000000' : '#FFFFFF';
    },
    
    // Interpolate between two colors
    interpolateColor: (color1: string, color2: string, factor: number): string => {
      // Basic color interpolation (simplified)
      return factor < 0.5 ? color1 : color2;
    },
  };