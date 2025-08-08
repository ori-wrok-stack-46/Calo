import { useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState, AppDispatch } from '@/src/store';
import { signOut } from '@/src/store/authSlice';
import { authAPI } from '@/src/services/api';

export const useTokenValidation = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const lastValidationRef = useRef<number>(0);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const performLogout = useCallback(async (reason: string) => {
    console.log(`🔒 Performing logout: ${reason}`);
    
    try {
      // Clear any existing validation intervals
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
        validationIntervalRef.current = null;
      }

      // Dispatch logout action
      dispatch(signOut());
      
      // Clear stored token
      await authAPI.getStoredToken().then(async (storedToken) => {
        if (storedToken) {
          try {
            await authAPI.signOut();
          } catch (error) {
            console.warn('⚠️ Server signout failed:', error);
          }
        }
      });

      // Navigate to signin
      router.replace('/(auth)/signin');
    } catch (error) {
      console.error('💥 Logout process error:', error);
      // Force navigation even if cleanup fails
      router.replace('/(auth)/signin');
    }
  }, [dispatch, router]);

  const validateToken = useCallback(async () => {
    try {
      const now = Date.now();
      
      // Prevent too frequent validations (max once per 30 seconds)
      if (now - lastValidationRef.current < 30000) {
        return;
      }
      
      lastValidationRef.current = now;

      // If user is marked as authenticated but no token exists, force logout
      if (isAuthenticated && !token) {
        await performLogout('User authenticated but no token found');
        return;
      }

      // Check if we have a token stored locally
      if (isAuthenticated && token) {
        const storedToken = await authAPI.getStoredToken();
        
        if (!storedToken) {
          await performLogout('Token missing from storage');
          return;
        }
        
        if (storedToken !== token) {
          await performLogout('Token mismatch detected');
          return;
        }

        // Optional: Validate token with server (uncomment if needed)
        // try {
        //   await api.get('/auth/me');
        // } catch (error: any) {
        //   if (error.response?.status === 401) {
        //     await performLogout('Server rejected token');
        //     return;
        //   }
        // }
      }

      // If not authenticated and no token, redirect to signin
      if (!isAuthenticated && !token) {
        console.log('🔒 No authentication found, redirecting to signin');
        router.replace('/(auth)/signin');
        return;
      }
    } catch (error) {
      console.error('🔒 Token validation error:', error);
      await performLogout('Token validation failed');
    }
  }, [token, isAuthenticated, performLogout, router]);

  useEffect(() => {
    // Initial validation
    validateToken();

    // Set up periodic validation (every 5 minutes)
    validationIntervalRef.current = setInterval(() => {
      if (isAuthenticated && token) {
        validateToken();
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup interval on unmount
    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
        validationIntervalRef.current = null;
      }
    };
  }, [token, isAuthenticated, validateToken]);

  return { 
    isAuthenticated, 
    user,
    validateToken: () => validateToken(),
    performLogout
  };
};
