
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState, AppDispatch } from '@/src/store';
import { signOut } from '@/src/store/authSlice';
import { authAPI } from '@/src/services/api';

export const useTokenValidation = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const validateToken = async () => {
      try {
        // Check if we have a token
        if (!token && !isAuthenticated) {
          console.log('🔒 No token found, redirecting to signin');
          router.replace('/(auth)/signin');
          return;
        }

        // Validate token with server
        if (token) {
          const storedToken = await authAPI.getStoredToken();
          if (!storedToken) {
            console.log('🔒 Token validation failed, logging out');
            dispatch(signOut());
            router.replace('/(auth)/signin');
          }
        }
      } catch (error) {
        console.error('🔒 Token validation error:', error);
        dispatch(signOut());
        router.replace('/(auth)/signin');
      }
    };

    validateToken();
  }, [token, isAuthenticated, dispatch, router]);

  return { isAuthenticated, user };
};
