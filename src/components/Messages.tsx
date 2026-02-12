import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Message } from '../lib/types';

interface MessagesProps {
  contactUserId: string;
  contactName: string;
  notificationId?: string | null;
  onBack: () => void;
}

export function Messages({ contactUserId, contactName, notificationId, onBack }: MessagesProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && contactUserId) {
      loadMessages();
      markMessagesAsRead();
    }
  }, [user, contactUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        expediteur:profiles!messages_expediteur_id_fkey(nom_complet),
        destinataire:profiles!messages_destinataire_id_fkey(nom_complet)
      `)
      .or(`and(expediteur_id.eq.${user!.id},destinataire_id.eq.${contactUserId}),and(expediteur_id.eq.${contactUserId},destinataire_id.eq.${user!.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as any);
    }
    setLoading(false);
  };

  const markMessagesAsRead = async () => {
    await supabase
      .from('messages')
      .update({ lu: true })
      .eq('destinataire_id', user!.id)
      .eq('expediteur_id', contactUserId)
      .eq('lu', false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          expediteur_id: user!.id,
          destinataire_id: contactUserId,
          notification_id: notificationId || null,
          contenu: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => [...prev, data as any]);
        setNewMessage('');
      }
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1B4F8A] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)]">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          Conversation avec {contactName}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucun message</p>
            <p className="text-sm text-gray-500 mt-1">
              Envoyez votre premier message pour démarrer la conversation
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.expediteur_id === user!.id;
            return (
              <div
                key={message.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-lg ${
                    isMe
                      ? 'bg-[#1B4F8A] text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.contenu}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMe ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-[#1B4F8A] text-white px-6 py-3 rounded-lg hover:bg-[#153d6e] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
}
