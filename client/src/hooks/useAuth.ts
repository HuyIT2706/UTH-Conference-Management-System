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
      
      // Invalidate tất cả cache để tránh refetch
      dispatch(apiSlice.util.resetApiState());
      
      // Gọi logout API nếu có refreshToken
      if (refreshToken) {
        try {
          await logoutMutation({ refreshToken }).unwrap();
        } catch (error) {
          // Ignore logout API error, vì đã clear tokens rồi
          console.error('Logout API error:', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Đảm bảo navigate sau khi clear
      navigate('/login');
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

