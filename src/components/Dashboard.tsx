import React, { useState, useEffect } from 'react';
import { Home, Bell, Mail, Plus, LogOut, Edit, Trash2, Eye, EyeOff, Circle, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CreateMailbox } from './CreateMailbox';
import { NotificationsList } from './NotificationsList';
import { ContactRequestsList } from './ContactRequestsList';
import { Directory } from './Directory';
import { PublicProfile } from './PublicProfile';
import { AccountSettings } from './AccountSettings';
import type { BoiteLettre } from '../lib/types';

type Tab = 'mes-boites' | 'annuaire' | 'notifications' | 'demandes' | 'compte';

export function Dashboard() {
  const { profile, signOut, isPasswordRecovery } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('mes-boites');
  const [showCreateMailbox, setShowCreateMailbox] = useState(false);
  const [selectedBoiteId, setSelectedBoiteId] = useState<string | null>(null);
  const [boites, setBoites] = useState<BoiteLettre[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPasswordRecovery) {
      setActiveTab('compte');
    }
  }, [isPasswordRecovery]);

  useEffect(() => {
    if (profile?.id) {
      loadBoites();
      loadUnreadCounts();
    } else {
      setLoading(false);
    }
  }, [profile?.id]);

  const loadBoites = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('boites_lettres')
        .select(`
          *,
          adresse:adresses(housenumber, street, city, postcode)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setBoites(data as any);
      }
    } catch (error) {
      console.error('Error loading boites:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCounts = async () => {
    const { count: notifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('destinataire_id', profile!.id)
      .eq('lu', false);

    const { count: reqCount } = await supabase
      .from('demandes_contact')
      .select('*', { count: 'exact', head: true })
      .eq('destinataire_id', profile!.id)
      .eq('statut', 'en_attente');

    setUnreadNotifications(notifCount || 0);
    setPendingRequests(reqCount || 0);
  };

  const toggleVisibility = async (id: string, currentVisibility: boolean) => {
    await supabase
      .from('boites_lettres')
      .update({ visible_annuaire: !currentVisibility })
      .eq('id', id);

    loadBoites();
  };

  const updateStatus = async (id: string, statut: 'present' | 'absent' | 'ne_pas_deranger') => {
    await supabase
      .from('boites_lettres')
      .update({ statut })
      .eq('id', id);

    loadBoites();
  };

  const deleteBoite = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette boîte aux lettres ?')) {
      await supabase.from('boites_lettres').delete().eq('id', id);
      loadBoites();
    }
  };

  if (selectedBoiteId) {
    return (
      <PublicProfile
        boiteId={selectedBoiteId}
        onBack={() => setSelectedBoiteId(null)}
      />
    );
  }

  if (showCreateMailbox) {
    return (
      <CreateMailbox
        onSuccess={() => {
          setShowCreateMailbox(false);
          loadBoites();
        }}
        onCancel={() => setShowCreateMailbox(false)}
      />
    );
  }

  const tabs = [
    { id: 'mes-boites' as Tab, label: 'Mes boîtes', icon: Home, badge: null },
    { id: 'annuaire' as Tab, label: 'Annuaire', icon: Home, badge: null },
    { id: 'notifications' as Tab, label: 'Sonneries', icon: Bell, badge: unreadNotifications },
    { id: 'demandes' as Tab, label: 'Demandes', icon: Mail, badge: pendingRequests },
    { id: 'compte' as Tab, label: 'Mon compte', icon: Settings, badge: null },
  ];

  const statutOptions: Array<{ value: 'present' | 'absent' | 'ne_pas_deranger'; label: string; color: string }> = [
    { value: 'present', label: 'Présent', color: 'text-green-600' },
    { value: 'absent', label: 'Absent', color: 'text-orange-600' },
    { value: 'ne_pas_deranger', label: 'Ne pas déranger', color: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4F8A]">MonAdresse.fr</h1>
              <p className="text-sm text-gray-600">
                Bienvenue, {profile?.prenom ? profile.prenom.charAt(0).toUpperCase() + profile.prenom.slice(1).toLowerCase() : ''} {profile?.nom ? profile.nom.charAt(0).toUpperCase() + profile.nom.slice(1).toLowerCase() : ''}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition relative ${
                  activeTab === tab.id
                    ? 'bg-[#1B4F8A] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === 'mes-boites' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Mes boîtes aux lettres
                </h2>
                <button
                  onClick={() => setShowCreateMailbox(true)}
                  className="flex items-center gap-2 bg-[#1B4F8A] text-white px-4 py-2 rounded-lg hover:bg-[#153d6e] transition"
                >
                  <Plus className="w-5 h-5" />
                  Créer une boîte
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1B4F8A] border-t-transparent"></div>
                </div>
              ) : boites.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">
                    Vous n'avez pas encore de boîte aux lettres
                  </p>
                  <button
                    onClick={() => setShowCreateMailbox(true)}
                    className="inline-flex items-center gap-2 bg-[#1B4F8A] text-white px-6 py-3 rounded-lg hover:bg-[#153d6e] transition"
                  >
                    <Plus className="w-5 h-5" />
                    Créer ma première boîte
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {boites.map((boite) => (
                    <div
                      key={boite.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#1B4F8A] transition"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {boite.nom_affiche}
                          </h3>
                          <p className="text-gray-600 flex items-center gap-1 mt-1">
                            <Circle className="w-3 h-3" />
                            {boite.adresse?.housenumber && `${boite.adresse.housenumber} `}
                            {boite.adresse?.street && `${boite.adresse.street}, `}
                            {boite.adresse?.city} ({boite.adresse?.postcode})
                          </p>
                        </div>
                        <button
                          onClick={() => deleteBoite(boite.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <select
                          value={boite.statut}
                          onChange={(e) => updateStatus(boite.id, e.target.value as any)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none"
                        >
                          {statutOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => toggleVisibility(boite.id, boite.visible_annuaire)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                            boite.visible_annuaire
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {boite.visible_annuaire ? (
                            <>
                              <Eye className="w-4 h-4" />
                              Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Masquée
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'annuaire' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Annuaire des résidents
              </h2>
              <Directory onSelectBoite={setSelectedBoiteId} />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Sonneries d'interphone
              </h2>
              <NotificationsList />
            </div>
          )}

          {activeTab === 'demandes' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Demandes de contact
              </h2>
              <ContactRequestsList />
            </div>
          )}

          {activeTab === 'compte' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Mon compte
              </h2>
              <AccountSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
