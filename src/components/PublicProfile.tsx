import React, { useState, useEffect } from 'react';
import { Bell, MapPin, Circle, Send, ArrowLeft, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { sendEmailNotification } from '../lib/emailNotifications';
import type { BoiteLettre } from '../lib/types';

interface PublicProfileProps {
  boiteId: string;
  onBack: () => void;
}

export function PublicProfile({ boiteId, onBack }: PublicProfileProps) {
  const { user, profile } = useAuth();
  const [boite, setBoite] = useState<BoiteLettre & {
    adresse?: { housenumber?: string; street?: string; city: string; postcode: string };
    profile?: { nom_complet: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIntercom, setShowIntercom] = useState(false);
  const [showContactRequest, setShowContactRequest] = useState(false);
  const [intercomMessage, setIntercomMessage] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [partagerTelephone, setPartagerTelephone] = useState(false);
  const [partagerEmail, setPartagerEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBoite();
  }, [boiteId]);

  const loadBoite = async () => {
    const { data, error } = await supabase
      .from('boites_lettres')
      .select(`
        *,
        adresse:adresses(housenumber, street, city, postcode),
        profile:profiles(nom_complet)
      `)
      .eq('id', boiteId)
      .maybeSingle();

    if (data) {
      setBoite(data as any);
    }
    setLoading(false);
  };

  const handleRingIntercom = async () => {
    if (!intercomMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          destinataire_id: boite!.user_id,
          boite_lettre_id: boiteId,
          expediteur_id: user?.id || null,
          expediteur_nom: user ? profile?.nom_complet : senderName,
          message: intercomMessage,
          partager_telephone: user && partagerTelephone,
          partager_email: user && partagerEmail,
        });

      if (error) throw error;

      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('email, email_notifications_enabled, telephone')
        .eq('id', boite!.user_id)
        .maybeSingle();

      if (recipientProfile?.email && recipientProfile?.email_notifications_enabled) {
        const expediteurNom = user ? profile?.nom_complet : senderName;
        let contactInfo = '';

        if (user && partagerTelephone && profile?.telephone) {
          contactInfo += `<p><strong>Téléphone:</strong> ${profile.telephone}</p>`;
        }

        if (user && partagerEmail && profile?.email) {
          contactInfo += `<p><strong>Email:</strong> ${profile.email}</p>`;
        }

        await sendEmailNotification({
          to: recipientProfile.email,
          subject: 'Sonnerie d\'interphone - MonAdresse',
          html: `<h2>Quelqu'un sonne à votre interphone</h2>
                 <p><strong>${expediteurNom || 'Un visiteur'}</strong> a sonné à votre boîte aux lettres <strong>${boite!.nom_affiche}</strong>.</p>
                 <p><strong>Message:</strong></p>
                 <p>${intercomMessage}</p>
                 ${contactInfo ? '<hr>' + contactInfo : ''}
                 ${!contactInfo ? '<p style="color: #666; font-size: 14px;">Le visiteur n\'a pas partagé ses coordonnées.</p>' : ''}`,
          type: 'notification',
        });
      }

      setSuccess('Sonnerie envoyée avec succès');
      setShowIntercom(false);
      setIntercomMessage('');
      setSenderName('');
      setPartagerTelephone(false);
      setPartagerEmail(false);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const handleContactRequest = async () => {
    if (!contactMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('demandes_contact')
        .insert({
          expediteur_id: user?.id,
          expediteur_nom: user ? undefined : senderName,
          destinataire_id: boite!.user_id,
          boite_lettre_id: boiteId,
          message: contactMessage,
          partager_telephone: user && partagerTelephone,
          partager_email: user && partagerEmail,
        });

      if (error) throw error;

      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('email, email_notifications_enabled')
        .eq('id', boite!.user_id)
        .maybeSingle();

      if (recipientProfile?.email && recipientProfile?.email_notifications_enabled) {
        const expediteurNom = user ? profile?.nom_complet : senderName;
        let contactInfo = '';

        if (user && partagerTelephone && profile?.telephone) {
          contactInfo += `<p><strong>Téléphone:</strong> ${profile.telephone}</p>`;
        }

        if (user && partagerEmail && profile?.email) {
          contactInfo += `<p><strong>Email:</strong> ${profile.email}</p>`;
        }

        await sendEmailNotification({
          to: recipientProfile.email,
          subject: 'Nouvelle demande de contact - MonAdresse',
          html: `<h2>Nouvelle demande de contact</h2>
                 <p><strong>${expediteurNom || 'Un visiteur'}</strong> souhaite vous contacter concernant votre boîte aux lettres <strong>${boite!.nom_affiche}</strong>.</p>
                 <p><strong>Message:</strong></p>
                 <p>${contactMessage}</p>
                 ${contactInfo ? '<hr>' + contactInfo : ''}
                 ${!contactInfo ? '<p style="color: #666; font-size: 14px;">Le visiteur n\'a pas partagé ses coordonnées.</p>' : ''}
                 <p>Connectez-vous à MonAdresse pour répondre à cette demande.</p>`,
          type: 'contact_request',
        });
      }

      setSuccess('Demande de contact envoyée');
      setShowContactRequest(false);
      setContactMessage('');
      setSenderName('');
      setPartagerTelephone(false);
      setPartagerEmail(false);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1B4F8A] border-t-transparent"></div>
      </div>
    );
  }

  if (!boite) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Boîte aux lettres introuvable</p>
      </div>
    );
  }

  const statutConfig = {
    present: { label: 'Présent', color: 'text-green-600', bgColor: 'bg-green-100' },
    absent: { label: 'Absent', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    ne_pas_deranger: { label: 'Ne pas déranger', color: 'text-red-600', bgColor: 'bg-red-100' },
  };

  const statut = statutConfig[boite.statut];

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 text-gray-600 hover:text-gray-900 transition flex items-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour à l'annuaire
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#1B4F8A] to-[#2563a8] p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <UserIcon className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{boite.nom_affiche}</h1>
              <div className="flex items-center gap-2 mt-2 text-white/90">
                <MapPin className="w-4 h-4" />
                <span>
                  {boite.adresse?.housenumber && `${boite.adresse.housenumber} `}
                  {boite.adresse?.street && `${boite.adresse.street}, `}
                  {boite.adresse?.city} ({boite.adresse?.postcode})
                </span>
              </div>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 ${statut.bgColor} ${statut.color} px-4 py-2 rounded-full text-sm font-medium`}>
            <Circle className="w-3 h-3 fill-current" />
            {statut.label}
          </div>
        </div>

        <div className="p-8">
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <div className="space-y-4">
            {!showIntercom && !showContactRequest && (
              <>
                <button
                  onClick={() => setShowIntercom(true)}
                  disabled={boite.statut === 'ne_pas_deranger'}
                  className="w-full bg-[#1B4F8A] text-white py-4 rounded-lg font-semibold hover:bg-[#153d6e] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                >
                  <Bell className="w-6 h-6" />
                  Sonner l'interphone
                </button>

                <button
                  onClick={() => setShowContactRequest(true)}
                  disabled={boite.statut === 'ne_pas_deranger'}
                  className="w-full bg-white text-[#1B4F8A] border-2 border-[#1B4F8A] py-4 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                >
                  <Send className="w-6 h-6" />
                  Demander le contact
                </button>
              </>
            )}

            {showIntercom && (
              <div className="space-y-4 border-2 border-[#1B4F8A] rounded-lg p-6">
                <h3 className="font-semibold text-lg text-gray-900">
                  Sonner l'interphone
                </h3>
                {!user && (
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none"
                    required
                  />
                )}
                <textarea
                  value={intercomMessage}
                  onChange={(e) => setIntercomMessage(e.target.value)}
                  placeholder="Message (ex: Colis à remettre, Visite...)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none resize-none"
                  rows={3}
                  required
                />
                {user && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      Partager mes coordonnées (optionnel)
                    </p>
                    {profile?.telephone && (
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={partagerTelephone}
                          onChange={(e) => setPartagerTelephone(e.target.checked)}
                          className="mt-1 w-4 h-4 text-[#1B4F8A] border-gray-300 rounded focus:ring-[#1B4F8A]"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Partager mon téléphone</p>
                          <p className="text-xs text-gray-600">{profile.telephone}</p>
                        </div>
                      </label>
                    )}
                    {profile?.email && (
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={partagerEmail}
                          onChange={(e) => setPartagerEmail(e.target.checked)}
                          className="mt-1 w-4 h-4 text-[#1B4F8A] border-gray-300 rounded focus:ring-[#1B4F8A]"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Partager mon email</p>
                          <p className="text-xs text-gray-600">{profile.email}</p>
                        </div>
                      </label>
                    )}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowIntercom(false);
                      setIntercomMessage('');
                      setSenderName('');
                      setPartagerTelephone(false);
                      setPartagerEmail(false);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleRingIntercom}
                    disabled={sending || !intercomMessage.trim() || (!user && !senderName.trim())}
                    className="flex-1 px-4 py-3 bg-[#1B4F8A] text-white rounded-lg hover:bg-[#153d6e] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </div>
            )}

            {showContactRequest && (
              <div className="space-y-4 border-2 border-[#1B4F8A] rounded-lg p-6">
                <h3 className="font-semibold text-lg text-gray-900">
                  Demander le contact
                </h3>
                <p className="text-sm text-gray-600">
                  Le résident recevra votre demande et pourra choisir de partager ses coordonnées avec vous.
                </p>
                {!user && (
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none"
                    required
                  />
                )}
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Motif de votre demande..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none resize-none"
                  rows={4}
                  required
                />
                {user && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      Partager mes coordonnées (optionnel)
                    </p>
                    {profile?.telephone && (
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={partagerTelephone}
                          onChange={(e) => setPartagerTelephone(e.target.checked)}
                          className="mt-1 w-4 h-4 text-[#1B4F8A] border-gray-300 rounded focus:ring-[#1B4F8A]"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Partager mon téléphone</p>
                          <p className="text-xs text-gray-600">{profile.telephone}</p>
                        </div>
                      </label>
                    )}
                    {profile?.email && (
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={partagerEmail}
                          onChange={(e) => setPartagerEmail(e.target.checked)}
                          className="mt-1 w-4 h-4 text-[#1B4F8A] border-gray-300 rounded focus:ring-[#1B4F8A]"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Partager mon email</p>
                          <p className="text-xs text-gray-600">{profile.email}</p>
                        </div>
                      </label>
                    )}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowContactRequest(false);
                      setContactMessage('');
                      setSenderName('');
                      setPartagerTelephone(false);
                      setPartagerEmail(false);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleContactRequest}
                    disabled={sending || !contactMessage.trim() || (!user && !senderName.trim())}
                    className="flex-1 px-4 py-3 bg-[#1B4F8A] text-white rounded-lg hover:bg-[#153d6e] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
