import React, { useState, useEffect, useRef, useCallback } from 'react';

export function useAndroidBackExit({
  isInfoOpen = false,
  setIsInfoOpen,
  isScopeOpen = false,
  setIsScopeOpen,
  isLangMenuOpen = false,
  setIsLangMenuOpen,
  mobileView = 'search',
  setMobileView,
  exitMessage = 'Press back again to exit',
  isRTL = false
}) {
  const [showExitToast, setShowExitToast] = useState(false);

  const latestStateRef = useRef({
    isInfoOpen,
    isScopeOpen,
    isLangMenuOpen,
    mobileView
  });

  // Tracks whether a sub-view layer is currently pushed above the root guard
  const subLayerPushedRef = useRef(false);
  const ignoringPopRef = useRef(false);
  const lastBackTimeRef = useRef(0);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    latestStateRef.current = {
      isInfoOpen,
      isScopeOpen,
      isLangMenuOpen,
      mobileView
    };
  }, [isInfoOpen, isScopeOpen, isLangMenuOpen, mobileView]);

  const hasActiveSubLayer = useCallback((state) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    return Boolean(
      state.isInfoOpen ||
      state.isScopeOpen ||
      state.isLangMenuOpen ||
      (isMobile && state.mobileView === 'results')
    );
  }, []);

  // Push a sub-layer entry onto history whenever entering Results or opening an overlay,
  // and pop it cleanly if the user closes that layer via an on-screen button.
  useEffect(() => {
    const active = hasActiveSubLayer({
      isInfoOpen,
      isScopeOpen,
      isLangMenuOpen,
      mobileView
    });

    if (active && !subLayerPushedRef.current) {
      window.history.pushState({ orotLayer: 'sub' }, '');
      subLayerPushedRef.current = true;
    } else if (!active && subLayerPushedRef.current) {
      subLayerPushedRef.current = false;
      if (window.history.state?.orotLayer === 'sub') {
        ignoringPopRef.current = true;
        window.history.back();
      }
    }
  }, [isInfoOpen, isScopeOpen, isLangMenuOpen, mobileView, hasActiveSubLayer]);

  useEffect(() => {
    // Establish root guard entry once on mount
    if (!window.history.state?.orotRoot && !window.history.state?.orotLayer) {
      window.history.pushState({ orotRoot: true }, '');
    }

    const handlePopState = () => {
      // Ignore synthetic history.back() triggered when closing a modal via UI click
      if (ignoringPopRef.current) {
        ignoringPopRef.current = false;
        return;
      }

      const current = latestStateRef.current;

      // 1. Close language dropdown if open
      if (current.isLangMenuOpen && typeof setIsLangMenuOpen === 'function') {
        subLayerPushedRef.current = false;
        setIsLangMenuOpen(false);
        lastBackTimeRef.current = 0;
        setShowExitToast(false);
        return;
      }

      // 2. Close Info modal if open
      if (current.isInfoOpen && typeof setIsInfoOpen === 'function') {
        subLayerPushedRef.current = false;
        setIsInfoOpen(false);
        lastBackTimeRef.current = 0;
        setShowExitToast(false);
        return;
      }

      // 3. Close Comparison Scopes overlay if open
      if (current.isScopeOpen && typeof setIsScopeOpen === 'function') {
        subLayerPushedRef.current = false;
        setIsScopeOpen(false);
        lastBackTimeRef.current = 0;
        setShowExitToast(false);
        return;
      }

      // 4. Step back from mobile Results screen to Search screen
      const isMobile = window.innerWidth <= 768;
      if (isMobile && current.mobileView === 'results' && typeof setMobileView === 'function') {
        subLayerPushedRef.current = false;
        setMobileView('search');
        lastBackTimeRef.current = 0;
        setShowExitToast(false);
        return;
      }

      // 5. At root Search screen: second Back press within 2 seconds exits
      const now = Date.now();
      if (now - lastBackTimeRef.current < 2000) {
        setShowExitToast(false);
        if (window.Capacitor?.Plugins?.App?.exitApp) {
          window.Capacitor.Plugins.App.exitApp();
        } else {
          window.history.back();
        }
        return;
      }

      // First Back press at root Search screen: re-arm root guard and show toast
      lastBackTimeRef.current = now;
      window.history.pushState({ orotRoot: true }, '');
      setShowExitToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setShowExitToast(false);
      }, 2000);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [setIsInfoOpen, setIsScopeOpen, setIsLangMenuOpen, setMobileView]);

  const ExitToast = showExitToast ? (
    <div
      role="status"
      aria-live="polite"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        color: '#ffffff',
        padding: '10px 18px',
        borderRadius: '999px',
        fontSize: '13px',
        fontWeight: '600',
        boxShadow: '0 6px 20px rgba(15, 23, 42, 0.28)',
        zIndex: 9999,
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}
    >
      {exitMessage}
    </div>
  ) : null;

  return { ExitToast };
}