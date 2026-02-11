import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Clock, Inbox, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { sendEmailNotification } from '../lib/emailNotifications';
import type { DemandeContact } from '../lib/types';

export function ContactRequestsList() {
  const { user } = useAuth();
  const [demandesRecues, setDemandesRecues] = useState<DemandeContact[]>([]);
  const [demandesEnvoyees, setDemandesEnvoyees] = useState<DemandeContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAcceptedEmail, setShowAcceptedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDemandes();
    }
  }, [user]);

  const loadDemandes = async () => {
    const [recuesResult, envoyeesResult] = await Promise.all([
      supabase
        .from('demandes_contact')
        .select(`
          *,
          boite_lettre:boites_lettres(nom_affiche),
          expediteur:profiles(nom_complet, email)
        `)
        .eq('destinataire_id', user!.id)
        .order('created_at', { ascending: false }),

      supabase
        .from('demandes_contact')
        .select(`
          *,
          boite_lettre:boites_lettres(nom_affiche),
          destinataire:profiles!demandes_contact_destinataire_id_fkey(nom_complet, email)
        `)
        .eq('expediteur_id', user!.id)
        .order('created_at', { ascending: false })
    ]);

    if (recuesResult.data) {
      setDemandesRecues(recuesResult.data as any);
    }
    if (envoyeesResult.data) {
      setDemandesEnvoyees(envoyeesResult.data as any);
    }
    setLoading(false);
  };

  const handleResponse = async (id: string, statut: 'acceptee' | 'refusee') => {
    const demande = demandesRecues.find(d => d.id === id);

    await supabase
      .from('demandes_contact')
      .update({ statut })
      .eq('id', id);

    setDemandesRecues(prev =>
      prev.map(d => (d.id === id ? { ...d, statut } : d))
    );

    if (demande && demande.expediteur?.email) {
      const boiteNom = demande.boite_lettre?.nom_affiche || 'la boîte aux lettres';

      if (statut === 'acceptee') {
        setShowAcceptedEmail(demande.expediteur.email);

        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('email, nom_complet')
          .eq('id', user!.id)
          .maybeSingle();

        await sendEmailNotification({
          to: demande.expediteur.email,
          subject: 'Demande de contact acceptée - MonAdresse',
          html: `<h2>Demande de contact acceptée</h2>
                 <p><strong>${recipientProfile?.nom_complet || 'Le résident'}</strong> a accepté votre demande de contact pour <strong>${boiteNom}</strong>.</p>
                 <p>Email de contact: <a href="mailto:${recipientProfile?.email}">${recipientProfile?.email}</a></p>
                 <p>Vous pouvez maintenant communiquer directement.</p>`,
          type: 'contact_response',
        });
      } else {
        await sendEmailNotification({
          to: demande.expediteur.email,
          subject: 'Demande de contact refusée - MonAdresse',
          html: `<h2>Demande de contact refusée</h2>
                 <p>Votre demande de contact pour <strong>${boiteNom}</strong> a été refusée.</p>`,
          type: 'contact_response',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1B4F8A] border-t-transparent"></div>
      </div>
    );
  }

  const renderDemande = (demande: any, isReceived: boolean) => {
    const statutConfig = {
      en_attente: {
        label: 'En attente',
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
      },
      acceptee: {
        label: 'Acceptée',
        icon: Check,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      },
      refusee: {
        label: 'Refusée',
        icon: X,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      },
    };

    const statut = statutConfig[demande.statut];
    const Icon = statut.icon;
    const contactName = isReceived
      ? (demande.expediteur?.nom_complet || demande.expediteur_nom || 'Visiteur')
      : (demande.destinataire?.nom_complet || 'Résident');

    return (
      <div
        key={demande.id}
        className={`bg-white rounded-lg shadow p-5 border ${statut.borderColor}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900">
                {contactName}
              </h3>
              <span className={`flex items-center gap-1 text-sm ${statut.color} ${statut.bgColor} px-3 py-1 rounded-full`}>
                <Icon className="w-4 h-4" />
                {statut.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {isReceived ? 'Pour' : 'À'}: {demande.boite_lettre?.nom_affiche}
            </p>
            <p className="text-gray-700 mb-2">{demande.message}</p>
            <p className="text-xs text-gray-500">
              {new Date(demande.created_at).toLocaleString('fr-FR')}
            </p>
          </div>
        </div>

        {isReceived && demande.statut === 'en_attente' && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleResponse(demande.id, 'acceptee')}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Accepter
            </button>
            <button
              onClick={() => handleResponse(demande.id, 'refusee')}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Refuser
            </button>
          </div>
        )}

        {isReceived && demande.statut === 'acceptee' && demande.expediteur?.email && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Contact partagé :</p>
            <a
              href={`mailto:${demande.expediteur.email}`}
              className="text-[#1B4F8A] hover:underline font-medium"
            >
              {demande.expediteur.email}
            </a>
          </div>
        )}

        {!isReceived && demande.statut === 'acceptee' && demande.destinataire?.email && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Contact partagé :</p>
            <a
              href={`mailto:${demande.destinataire.email}`}
              className="text-[#1B4F8A] hover:underline font-medium"
            >
              {demande.destinataire.email}
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {showAcceptedEmail && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium mb-2">
            Contact partagé avec succès
          </p>
          <p className="text-green-700 text-sm">
            Email partagé : {showAcceptedEmail}
          </p>
          <button
            onClick={() => setShowAcceptedEmail(null)}
            className="mt-3 text-sm text-green-700 hover:underline"
          >
            Fermer
          </button>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="w-5 h-5 text-[#1B4F8A]" />
          <h2 className="text-xl font-semibold text-gray-900">Demandes reçues</h2>
        </div>
        {demandesRecues.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Mail className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Aucune demande reçue</p>
          </div>
        ) : (
          <div className="space-y-4">
            {demandesRecues.map((demande) => renderDemande(demande, true))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-5 h-5 text-[#1B4F8A]" />
          <h2 className="text-xl font-semibold text-gray-900">Demandes envoyées</h2>
        </div>
        {demandesEnvoyees.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Mail className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Aucune demande envoyée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {demandesEnvoyees.map((demande) => renderDemande(demande, false))}
          </div>
        )}
      </div>
    </div>
  );
}
