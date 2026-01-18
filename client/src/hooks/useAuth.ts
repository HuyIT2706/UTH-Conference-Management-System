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
  useEffect(() => {
    const checkToken = () => {
      const currentHasToken = tokenUtils.hasToken();
      if (currentHasToken !== hasToken) {
        setHasToken(currentHasToken);
      }
    };
    checkToken();
    const interval = setInterval(checkToken, 100);
    
    return () => clearInterval(interval);
  }, [hasToken]);
  const [logoutMutation] = useLogoutMutation();

  const logout = async () => {
    const refreshToken = tokenUtils.getRefreshToken();
    
    // Clear tokens first to prevent any API calls
    tokenUtils.clearTokens();
    setHasToken(false);
    dispatch(apiSlice.util.resetApiState());
    
    // Navigate immediately
    navigate('/login', { replace: true });
    
    // Call logout API in background (don't wait)
    if (refreshToken) {
      logoutMutation({ refreshToken }).catch(() => {});
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

