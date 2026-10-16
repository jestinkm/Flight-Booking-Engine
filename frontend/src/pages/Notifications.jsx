import React from 'react';
import { Bell, CheckCheck, Plane, Tag, ShieldCheck, Clock, Ticket } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const Notifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const displayList = Array.isArray(notifications) ? notifications : [];

  const getIcon = (type) => {
    switch (type) {
      case 'FLIGHT':
        return <Plane className="w-5 h-5 text-skyblue" />;
      case 'PROMO':
        return <Tag className="w-5 h-5 text-amber-500" />;
      case 'SECURITY':
        return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      default:
        return <Ticket className="w-5 h-5 text-skyblue" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-4">
          <div>
            <h1 className="text-3xl font-black text-navy flex items-center gap-2.5">
              <Bell className="w-8 h-8 text-skyblue" /> Notifications
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live updates regarding your flight schedule, boarding announcements, and special offers.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-navy rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>

        {displayList.length > 0 ? (
          <div className="space-y-3">
            {displayList.map((notif) => {
              const isUnread = !notif.isRead && !notif.read;
              return (
                <div
                  key={notif.id || notif._id}
                  onClick={() => markAsRead(notif.id || notif._id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                    isUnread
                      ? 'bg-white border-skyblue/40 shadow-xs'
                      : 'bg-white/60 border-slate-200/70 hover:bg-white'
                  }`}
                >
                  <div className="p-3 rounded-xl bg-slate-100 shrink-0">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-bold ${isUnread ? 'text-navy' : 'text-slate-700'}`}>
                        {notif.title}
                      </h3>
                      {isUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-skyblue shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Just now'}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-4">
            <div className="w-14 h-14 rounded-full bg-skyblue-light text-skyblue flex items-center justify-center mx-auto">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-navy">No Notifications</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You are all caught up! New updates regarding flight schedules and booking confirmations will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
