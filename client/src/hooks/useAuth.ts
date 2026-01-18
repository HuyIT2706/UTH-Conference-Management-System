import { useGetMeQuery, useLogoutMutation, useCheckSessionMutation } from '../redux/api/authApi';
import { tokenUtils } from '../utils/token';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { apiSlice } from '../redux/api/apiSlice';
import { useState, useEffect, useCallback, useRef } from 'react';
import { showToast } from '../utils/toast';

const SESSION_CHECK_INTERVAL = 30000; // Check every 30 seconds

export const useAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [hasToken, setHasToken] = useState(() => tokenUtils.hasToken());
  const isLoggingOut = useRef(false);
  
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
  const [checkSessionMutation] = useCheckSessionMutation();

  const forceLogout = useCallback((message?: string) => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    
    tokenUtils.clearTokens();
    setHasToken(false);
    dispatch(apiSlice.util.resetApiState());
    navigate('/login', { replace: true });
    
    if (message) {
      showToast.error(message);
    }
    
    setTimeout(() => {
      isLoggingOut.current = false;
    }, 1000);
  }, [dispatch, navigate]);

  useEffect(() => {
    if (!hasToken) return;

    const checkSession = async () => {
      const refreshToken = tokenUtils.getRefreshToken();
      if (!refreshToken || isLoggingOut.current) return;

      try {
        await checkSessionMutation({ refreshToken }).unwrap();
      } catch {
        forceLogout('Phiên đăng nhập đã hết hạn hoặc bạn đã đăng nhập ở thiết bị khác');
      }
    };

    checkSession();

    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [hasToken, checkSessionMutation, forceLogout]);

  const logout = async () => {
    const refreshToken = tokenUtils.getRefreshToken();
    setHasToken(false);
    if (refreshToken) {
      try {
        await logoutMutation({ refreshToken }).unwrap();
      } catch {
      }
    }
    tokenUtils.clearTokens();
    dispatch(apiSlice.util.resetApiState());
    navigate('/login', { replace: true });
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

