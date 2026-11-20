import React, { useState, useEffect, useRef, useCallback } from 'react';

export function useAndroidBackExit({
  isInfoOpen = false,
  setIsInfoOpen,
  isScopeOpen = false,
  setIsScopeOpen,
  mobileView = 'search',
  setMobileView,
  exitMessage = 'Press back again to exit',
  isRTL = false
}) {
  const [showExitToast, setShowExitToast] = useState(false);

  const latestStateRef = useRef({ isInfoOpen, isScopeOpen, mobileView });
  const lastBackTimeRef = useRef(0);
  const toastTimerRef = useRef(null);
  const guardArmedRef = useRef(false);

  // Keep latest navigation state accessible inside popstate without re-binding listeners
  useEffect(() => {
    latestStateRef.current = { isInfoOpen, isScopeOpen, mobileView };
  }, [isInfoOpen, isScopeOpen, mobileView]);

  const armGuard = useCallback(() => {
    if (guardArmedRef.current) return;
    window.history.pushState({ orotBackGuard: true }, '');
    guardArmedRef.current = true;
  }, []);

  useEffect(() => {
    armGuard();

    // Ensure Chrome/Android registers user activation for history interception
    const armOnFirstGesture = () => armGuard();
    window.addEventListener('pointerdown', armOnFirstGesture, { once: true, passive: true });
    window.addEventListener('keydown', armOnFirstGesture, { once: true, passive: true });

    const handlePopState = () => {
      guardArmedRef.current = false;
      const current = latestStateRef.current;

      // 1. Close About / Info modal if open
      if (current.isInfoOpen && typeof setIsInfoOpen === 'function') {
        setIsInfoOpen(false);
        lastBackTimeRef.current = 0;
        setShowExitToast(false);
        armGuard();
        return;
      }

      // 2. Close Comparison Scopes panel if open
      if (current.isScopeOpen && typeof setIsScopeOpen === 'function') {
        setIsScopeOpen(false);
        lastBackTimeRef.current = 0;
        setShowExitToast(false);
        armGuard();
        return;
      }

      // 3. On mobile, step back from Results view to Search view
      const isMobile = window.innerWidth <= 768;
      if (isMobile && current.mobileView === 'results' && typeof setMobileView === 'function') {
        setMobileView('search');
        lastBackTimeRef.current = 0;
        setShowExitToast(false);
        armGuard();
        return;
      }

      // 4. Root Search screen: require second back press within 2 seconds to exit
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

      lastBackTimeRef.current = now;
      setShowExitToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setShowExitToast(false);
      }, 2000);

      armGuard();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pointerdown', armOnFirstGesture);
      window.removeEventListener('keydown', armOnFirstGesture);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [armGuard, setIsInfoOpen, setIsScopeOpen, setMobileView]);

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