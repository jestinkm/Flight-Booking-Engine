import React, { useState, useEffect, useCallback } from 'react';
import { BellRing, BellOff, CheckCircle2, AlertTriangle, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  isPushSupported,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
  registerServiceWorker
} from '../lib/pushNotifications';
import { useAuth } from '../context/AuthContext';

export default function EnablePushNotifications({ compact = false }) {
  const { user } = useAuth();
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Sync state on load
  const checkStatus = useCallback(async () => {
    if (!isPushSupported()) {
      setSupported(false);
      return;
    }
    setSupported(true);
    setPermission(Notification.permission);

    try {
      await registerServiceWorker();
      const sub = await getExistingSubscription();
      setIsSubscribed(Boolean(sub));
    } catch {
      setIsSubscribed(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus, user]);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please log in to enable personalized flight push alerts.');
      return;
    }

    setLoading(true);
    try {
      await subscribeToPush();
      setIsSubscribed(true);
      setPermission(Notification.permission);
      toast.success('Live flight alerts enabled! You will receive instant booking updates.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to enable push notifications.');
      setPermission(Notification.permission);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      await unsubscribeFromPush();
      setIsSubscribed(false);
      toast.success('Browser push alerts disabled.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to disable notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestPush = async () => {
    setSendingTest(true);
    try {
      await sendTestPush();
      toast.success('Test notification sent! Check your desktop/phone notifications.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to dispatch test notification.');
    } finally {
      setSendingTest(false);
    }
  };

  if (!supported) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        <div>
          <p className="font-semibold text-slate-700">Push Notifications Unavailable</p>
          <p>Your current browser does not support Web Push notifications.</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isSubscribed ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-navy">
              {isSubscribed ? 'Web Push Active' : 'Enable Flight Push Alerts'}
            </p>
            <p className="text-[10px] text-slate-400">
              {isSubscribed ? 'Receiving real-time PNR & gate alerts' : 'Receive instant updates on this device'}
            </p>
          </div>
        </div>

        {isSubscribed ? (
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
          >
            Disable
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="text-xs bg-navy hover:bg-navy-light text-white font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            Enable
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-slate-50/60 border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-skyblue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
            isSubscribed ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-navy text-white shadow-navy/20'
          }`}>
            {isSubscribed ? (
              <CheckCircle2 className="w-6 h-6 animate-pulse" />
            ) : (
              <BellRing className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-navy">
                Live Flight Push Notifications
              </h3>
              {isSubscribed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Receive immediate real-time desktop & mobile notifications when your flight booking is confirmed,
              seat numbers are assigned, or e-ticket is dispatched — even when the tab is closed.
            </p>
            {permission === 'denied' && (
              <p className="text-[11px] text-amber-600 font-semibold pt-1">
                Notice: Notifications are currently blocked in your browser site permissions. Please allow notifications in site settings.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {isSubscribed ? (
            <>
              <button
                type="button"
                onClick={handleTestPush}
                disabled={sendingTest}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-navy bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {sendingTest ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-skyblue" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-skyblue" />
                )}
                <span>Test Alert</span>
              </button>

              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellOff className="w-3.5 h-3.5" />}
                <span>Disable</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-navy via-navy to-skyblue hover:shadow-lg hover:shadow-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <BellRing className="w-4 h-4 text-white" />
              )}
              <span>Enable Push Alerts</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
