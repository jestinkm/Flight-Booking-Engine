import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/axios';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Preparing Your Journey...');

  const activeRequestsRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const minDisplayTimerRef = useRef(null);
  const safetyTimeoutRef = useRef(null);
  const isDisplayingRef = useRef(false);
  const displayStartTimeRef = useRef(0);

  // Clear all pending timers safely
  const clearTimers = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (minDisplayTimerRef.current) {
      clearTimeout(minDisplayTimerRef.current);
      minDisplayTimerRef.current = null;
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  }, []);

  // Display the loader with smooth fade-in
  const triggerShow = useCallback((message = 'Preparing Your Journey...') => {
    setLoadingMessage(message);
    if (!isDisplayingRef.current) {
      isDisplayingRef.current = true;
      displayStartTimeRef.current = Date.now();
      setIsLoading(true);

      // Safety timeout: Never allow loader to stay stuck longer than 12 seconds
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = setTimeout(() => {
        isDisplayingRef.current = false;
        setIsLoading(false);
        activeRequestsRef.current = 0;
      }, 12000);
    }
  }, []);

  // Dismiss the loader with minimum display duration check to avoid jarring flashes
  const triggerHide = useCallback(() => {
    if (!isDisplayingRef.current) {
      setIsLoading(false);
      return;
    }

    const elapsed = Date.now() - displayStartTimeRef.current;
    const minDisplayTime = 550; // Ensure visible for at least 550ms for smooth perception

    if (elapsed < minDisplayTime) {
      if (minDisplayTimerRef.current) clearTimeout(minDisplayTimerRef.current);
      minDisplayTimerRef.current = setTimeout(() => {
        isDisplayingRef.current = false;
        setIsLoading(false);
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      }, minDisplayTime - elapsed);
    } else {
      isDisplayingRef.current = false;
      setIsLoading(false);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    }
  }, []);

  // Manual trigger methods for pages/flows
  const showLoading = useCallback((customMessage = 'Preparing Your Journey...') => {
    activeRequestsRef.current += 1;
    triggerShow(customMessage);
  }, [triggerShow]);

  const hideLoading = useCallback(() => {
    if (activeRequestsRef.current > 0) {
      activeRequestsRef.current -= 1;
    }
    if (activeRequestsRef.current === 0) {
      triggerHide();
    }
  }, [triggerHide]);

  // Hook into Axios global request / response cycle
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        // Skip background polling or heartbeat requests if marked
        if (config.skipLoader) return config;

        activeRequestsRef.current += 1;

        // If this is the first active request, schedule debounce display
        if (activeRequestsRef.current === 1) {
          // Determine contextual message based on URL
          let msg = 'Connecting to SKYNEXA...';
          const url = (config.url || '').toLowerCase();
          if (url.includes('/auth/login') || url.includes('/auth/google')) {
            msg = 'Authenticating with SKYNEXA...';
          } else if (url.includes('/auth/register')) {
            msg = 'Creating Your Voyager Account...';
          } else if (url.includes('/flights/search')) {
            msg = 'Searching Flights Across India...';
          } else if (url.includes('/bookings') && config.method === 'post') {
            msg = 'Securing Flight Reservation...';
          } else if (url.includes('/confirm-payment') || url.includes('/payment')) {
            msg = 'Confirming Payment & Seat Allocation...';
          } else {
            msg = 'Preparing Your Journey...';
          }

          // Debounce: Only show loader if request takes longer than 280ms
          // This avoids flickering on fast 50-150ms cached responses
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            triggerShow(msg);
          }, 280);
        }

        return config;
      },
      (error) => {
        activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);
        if (activeRequestsRef.current === 0) {
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          triggerHide();
        }
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        if (!response.config?.skipLoader) {
          activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);
          if (activeRequestsRef.current === 0) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            triggerHide();
          }
        }
        return response;
      },
      (error) => {
        if (!error.config?.skipLoader) {
          activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);
          if (activeRequestsRef.current === 0) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            triggerHide();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
      clearTimers();
    };
  }, [triggerShow, triggerHide, clearTimers]);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        showLoading,
        hideLoading
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    return {
      isLoading: false,
      loadingMessage: 'Preparing Your Journey...',
      showLoading: () => {},
      hideLoading: () => {}
    };
  }
  return context;
};

export default LoadingContext;
