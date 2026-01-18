import { useGetMeQuery, useLogoutMutation, useCheckSessionMutation } from '../redux/api/authApi';
import { tokenUtils } from '../utils/token';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { apiSlice } from '../redux/api/apiSlice';
import { useState, useEffect, useRef } from 'react';
import { showToast } from '../utils/toast';

const SESSION_CHECK_INTERVAL = 10000; 

export const useAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [hasToken, setHasToken] = useState(() => tokenUtils.hasToken());
  const isLoggingOut = useRef(false);
  const hasCheckedSession = useRef(false);
  
  const { data, isLoading, error, refetch } = useGetMeQuery(undefined, {
    skip: !hasToken, 
  });

  useEffect(() => {
    const checkToken = () => {
      const currentHasToken = tokenUtils.hasToken();
      if (currentHasToken !== hasToken) {
        setHasToken(currentHasToken);
        hasCheckedSession.current = false; 
      }
    };
    checkToken();
    const interval = setInterval(checkToken, 100);
    
    return () => clearInterval(interval);
  }, [hasToken]);

  const [logoutMutation] = useLogoutMutation();
  const [checkSessionMutation] = useCheckSessionMutation();

  const forceLogout = (message?: string) => {
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
  };

  useEffect(() => {
    if (!hasToken) return;
    let isMounted = true;
    const checkSession = async () => {
      const refreshToken = tokenUtils.getRefreshToken();
      if (!refreshToken || isLoggingOut.current || !isMounted) return;

      try {
        await checkSessionMutation({ refreshToken }).unwrap();
      } catch {
        if (isMounted) {
          forceLogout('Phiên đăng nhập đã hết hạn hoặc bạn đã đăng nhập ở thiết bị khác');
        }
      }
    };
    const initialTimeout = setTimeout(() => {
      if (isMounted && !hasCheckedSession.current) {
        hasCheckedSession.current = true;
        checkSession();
      }
    }, 100);

    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    return () => {
      isMounted = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [hasToken]);

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

