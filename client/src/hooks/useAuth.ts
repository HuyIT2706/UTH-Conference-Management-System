import { useGetMeQuery, useLogoutMutation } from '../redux/api/authApi';
import { tokenUtils } from '../utils/token';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { apiSlice } from '../redux/api/apiSlice';
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [hasToken, setHasToken] = useState(() => tokenUtils.hasToken());
  
  const { data, isLoading, error, refetch } = useGetMeQuery(undefined, {
    skip: !hasToken, 
  });

  // Update hasToken when token changes
  useEffect(() => {
    const checkToken = () => {
      const currentHasToken = tokenUtils.hasToken();
      if (currentHasToken !== hasToken) {
        setHasToken(currentHasToken);
      }
    };
    
    // Check immediately
    checkToken();
    
    // Also check periodically (in case token is set from another tab/window)
    const interval = setInterval(checkToken, 100);
    
    return () => clearInterval(interval);
  }, [hasToken]);
  const [logoutMutation] = useLogoutMutation();

  const logout = async () => {
    try {
      // Lưu refreshToken trước khi clear
      const refreshToken = tokenUtils.getRefreshToken();
      
      // Clear tokens trước để skip query ngay lập tức
      tokenUtils.clearTokens();
      
      // Update state để skip query ngay lập tức
      setHasToken(false);
      
      // Unsubscribe tất cả queries để tránh gọi API sau khi logout
      dispatch(apiSlice.util.resetApiState());
      
      // Navigate ngay lập tức để unmount components và tránh gọi API
      navigate('/login', { replace: true });
      
      // Gọi logout API nếu có refreshToken (sau khi navigate để không block UI)
      if (refreshToken) {
        try {
          await logoutMutation({ refreshToken }).unwrap();
        } catch (error) {
          // Ignore logout API error, vì đã clear tokens rồi
          // Không log error để tránh noise
        }
      }
    } catch (error) {
      // Ignore errors, đảm bảo navigate luôn xảy ra
      navigate('/login', { replace: true });
    }
  };

  return {
    user: data?.user,
    isLoading,
    isAuthenticated: !!data?.user && tokenUtils.hasToken(),
    error,
    refetch,
    logout,
  };
};

