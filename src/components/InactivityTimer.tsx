/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSociety } from '../context/SocietyContext';
import { ShieldAlert, Clock, LogOut } from 'lucide-react';

export default function InactivityTimer() {
  const { currentUser, logout, language } = useSociety();
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);

  const lastActivityTime = useRef<number>(Date.now());
  const checkIntervalRef = useRef<any>(null);

  const INACTIVITY_LIMIT_MS = 28 * 60 * 1000; // 28 minutes
  const LOGOUT_LIMIT_MS = 30 * 60 * 1000;     // 30 minutes

  // Reset activity function
  const resetActivity = () => {
    lastActivityTime.current = Date.now();
    if (isWarningOpen) {
      setIsWarningOpen(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      // If no user is logged in, do not track inactivity
      setIsWarningOpen(false);
      return;
    }

    // List of events that characterize user interaction
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    // Add event listeners
    const handleUserActivity = () => {
      // If warning modal is open, we don't automatically reset on random background mouse moves
      // to avoid accidentally dismissing the warning if user just bumped their mouse.
      // They must explicitly click "Extend Session" or press a key.
      if (!isWarningOpen) {
        resetActivity();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Reset initial timer
    lastActivityTime.current = Date.now();
    setIsWarningOpen(false);

    // Run active checker interval (every 1 second for precision countdown and state checking)
    checkIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const inactiveDuration = now - lastActivityTime.current;

      if (inactiveDuration >= LOGOUT_LIMIT_MS) {
        // Log out immediately if the full 30 mins has been exceeded
        clearInterval(checkIntervalRef.current);
        logout();
      } else if (inactiveDuration >= INACTIVITY_LIMIT_MS) {
        // Show warning modal and update remaining countdown seconds dynamically
        setIsWarningOpen(true);
        const remainingSeconds = Math.max(0, Math.ceil((LOGOUT_LIMIT_MS - inactiveDuration) / 1000));
        setSecondsRemaining(remainingSeconds);
      } else {
        // Ensure warning is closed if active event was registered
        if (isWarningOpen) {
          setIsWarningOpen(false);
        }
      }
    }, 1000);

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [currentUser, isWarningOpen, logout]);

  // Handle Extend Session button click
  const handleExtendSession = () => {
    resetActivity();
  };

  // Handle immediate Manual Logout
  const handleManualLogout = () => {
    logout();
  };

  if (!currentUser || !isWarningOpen) return null;

  // Render modal
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" id="inactivity-warning-overlay">
      <div 
        className="w-full max-w-md overflow-hidden rounded-2xl border border-red-950/20 bg-zinc-950 text-white shadow-2xl"
        id="inactivity-warning-container"
      >
        {/* Urgent Header Warning Strip */}
        <div className="bg-gradient-to-r from-amber-600 via-red-600 to-amber-600 h-1.5 w-full" />
        
        <div className="p-6">
          {/* Main Visual Warning Icon with glow */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-950/40 border border-red-500/30 text-amber-500 mb-4 animate-pulse" id="warning-icon-wrapper">
            <ShieldAlert className="h-7 w-7" />
          </div>

          {/* Warning Content */}
          <h3 className="text-center text-lg font-bold tracking-tight text-white font-sans" id="inactivity-warning-title">
            {language === 'bn' 
              ? 'নিষ্ক্রিয়তার কারণে সেশন বন্ধ হচ্ছে!' 
              : 'Security Alert: Inactivity Detected'}
          </h3>
          
          <p className="mt-3 text-center text-xs text-neutral-400 font-sans leading-relaxed" id="inactivity-warning-description">
            {language === 'bn' 
              ? 'নিরাপত্তার স্বার্থে, আস্থা মেম্বার পোর্টাল ব্যবহারের কোনো নতুন সক্রিয়তা না পাওয়ায় সেশনটি স্বয়ংক্রিয়ভাবে বন্ধ হতে চলেছে।' 
              : 'For your security, we automatically log sessions out after some idle time. Your session will close soon.'}
          </p>

          {/* Countdown Display Box */}
          <div className="my-5 flex flex-col items-center justify-center py-4 px-6 rounded-xl bg-neutral-900 border border-neutral-800 text-center" id="countdown-display-block">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#D4AF37]/80 mb-1">
              {language === 'bn' ? 'স্বয়ংক্রিয় লগ আউট শুরু হবে' : 'Automatic Logout In'}
            </span>
            <div className="flex items-center gap-2 text-2xl font-black font-mono text-red-500">
              <Clock className="h-5 w-5 animate-pulse text-red-500" />
              <span>{secondsRemaining}s</span>
            </div>
          </div>

          {/* Confirmation Options */}
          <div className="flex flex-col gap-2.5 mt-5" id="inactivity-action-buttons">
            <button
              id="btn-extend-inactivity-session"
              type="button"
              onClick={handleExtendSession}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl border border-[#D4AF37]/35 cursor-pointer text-xs transition-all transform active:scale-95 shadow-md shadow-emerald-950/25 flex items-center justify-center gap-2"
            >
              <span>{language === 'bn' ? 'সক্রিয় থাকুন (সেশন বর্ধিত করুন)' : 'Extend Session (Stay Online)'}</span>
            </button>
            
            <button
              id="btn-logout-inactivity-immediate"
              type="button"
              onClick={handleManualLogout}
              className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-red-400 hover:text-red-300 font-bold rounded-xl border border-red-950/30 cursor-pointer text-xs transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{language === 'bn' ? 'এখনই লগ আউট হন' : 'Log Out Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
