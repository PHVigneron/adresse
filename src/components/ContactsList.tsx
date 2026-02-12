import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, UserPlus, Trash2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Contact } from '../lib/types';

interface ContactsListProps {
  onSendMessage: (contactUserId: string, contactName: string) => void;
}

export function ContactsList({ onSendMessage }: ContactsListProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = contacts.filter((contact) => {
        const name = contact.nom_affiche.toLowerCase();
        const email = contact.contact_user?.email?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return name.includes(query) || email.includes(query);
      });
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        contact_user:profiles!contacts_contact_user_id_fkey(nom_complet, email, telephone),
        boite_lettre:boites_lettres(nom_affiche)
      `)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      setContacts(data as any);
      setFilteredContacts(data as any);
    }
    setLoading(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Supprimer ce contact ?')) return;

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (!error) {
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un contact..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none"
          />
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">
            {searchQuery ? 'Aucun contact trouvé' : 'Aucun contact sauvegardé'}
          </p>
          <p className="text-sm text-gray-500">
            Ajoutez des contacts depuis les profils de l'annuaire
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-lg shadow border border-gray-200 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {contact.nom_affiche}
                  </h3>
                  {contact.boite_lettre && (
                    <p className="text-sm text-gray-600 mb-2">
                      Boîte : {contact.boite_lettre.nom_affiche}
                    </p>
                  )}
                  {contact.contact_user?.email && (
                    <p className="text-sm text-gray-600">
                      {contact.contact_user.email}
                    </p>
                  )}
                  {contact.contact_user?.telephone && (
                    <p className="text-sm text-gray-600">
                      {contact.contact_user.telephone}
                    </p>
                  )}
                  {contact.notes && (
                    <p className="text-sm text-gray-500 mt-2 italic">
                      {contact.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSendMessage(contact.contact_user_id, contact.nom_affiche)}
                    className="flex items-center gap-2 bg-[#1B4F8A] text-white px-4 py-2 rounded-lg hover:bg-[#153d6e] transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
