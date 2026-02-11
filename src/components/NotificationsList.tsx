import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Notification } from '../lib/types';

export function NotificationsList() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        boite_lettre:boites_lettres(nom_affiche)
      `)
      .eq('destinataire_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      setNotifications(data as any);
    }
    setLoading(false);
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `destinataire_id=eq.${user!.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ lu: true })
      .eq('id', id);

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, lu: true } : n))
    );
  };

  const deleteNotification = async (id: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1B4F8A] border-t-transparent"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Aucune notification pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`bg-white rounded-lg shadow p-4 border-l-4 ${
            notif.lu ? 'border-gray-300' : 'border-[#1B4F8A]'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="font-semibold text-gray-900">
                  {notif.expediteur_nom || 'Visiteur'}
                </span>
                {!notif.lu && (
                  <span className="text-xs bg-[#1B4F8A] text-white px-2 py-0.5 rounded-full">
                    Nouveau
                  </span>
                )}
              </div>
              <p className="text-gray-700 mb-2">{notif.message}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Pour: {notif.boite_lettre?.nom_affiche}</span>
                <span>{new Date(notif.created_at).toLocaleString('fr-FR')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {!notif.lu && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                  title="Marquer comme lu"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => deleteNotification(notif.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Supprimer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
