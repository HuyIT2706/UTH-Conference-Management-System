import { useGetMeQuery, useLogoutMutation, useCheckSessionMutation } from '../services/authApi';
import { tokenUtils } from '../utils/token';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { apiSlice } from '../services/apiSlice';
import { useState, useEffect, useRef } from 'react';
import { showToast } from '../utils/toast';

const SESSION_CHECK_INTERVAL = 10000;


let isCheckingSession = false;
let isLoggingOutGlobal = false;

export const useAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [hasToken, setHasToken] = useState(() => tokenUtils.hasToken());
  
  const { data, isLoading, error, refetch } = useGetMeQuery(undefined, {
    skip: !hasToken || isLoggingOutGlobal, 
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

  const forceLogout = (message?: string) => {
    if (isLoggingOutGlobal) return;
    isLoggingOutGlobal = true;
    
    tokenUtils.clearTokens();
    setHasToken(false);
    setTimeout(() => {
      dispatch(apiSlice.util.resetApiState());
    }, 0);
    navigate('/login', { replace: true });
    
    if (message) {
      showToast.error(message);
    }
    
    setTimeout(() => {
      isLoggingOutGlobal = false;
    }, 1000);
  };

  useEffect(() => {
    if (!hasToken) return;

    let isMounted = true;

    const checkSession = async () => {
      const refreshToken = tokenUtils.getRefreshToken();
      if (!refreshToken || isLoggingOutGlobal || !isMounted || isCheckingSession) return;

      isCheckingSession = true;
      try {
        await checkSessionMutation({ refreshToken }).unwrap();
      } catch {
        if (isMounted) {
          forceLogout('Phiên đăng nhập đã hết hạn hoặc bạn đã đăng nhập ở thiết bị khác');
        }
      } finally {
        isCheckingSession = false;
      }
    };

    const initialTimeout = setTimeout(checkSession, 500);

    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    return () => {
      isMounted = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [hasToken]);
  const logout = async () => {
    isLoggingOutGlobal = true;
    const refreshToken = tokenUtils.getRefreshToken();
    if (refreshToken) {
      try {
        await logoutMutation({ refreshToken }).unwrap();
      } catch {
      }
    }
    tokenUtils.clearTokens();
    setHasToken(false);
    setTimeout(() => {
      dispatch(apiSlice.util.resetApiState());
    }, 0);
    navigate('/login', { replace: true });
    
    setTimeout(() => {
      isLoggingOutGlobal = false;
    }, 1000);
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

