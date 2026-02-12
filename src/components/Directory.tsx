import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { BoiteLettre } from '../lib/types';

interface DirectoryProps {
  onSelectBoite: (boiteId: string) => void;
}

export function Directory({ onSelectBoite }: DirectoryProps) {
  const [filteredBoites, setFilteredBoites] = useState<BoiteLettre[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const searchBoites = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFilteredBoites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const searchTerm = query.toLowerCase();

    const { data, error } = await supabase
      .from('boites_lettres')
      .select(`
        *,
        adresse:adresses(housenumber, street, city, postcode)
      `)
      .eq('visible_annuaire', true)
      .order('created_at', { ascending: false });

    if (data) {
      const filtered = (data as any).filter((boite: any) => {
        const nomMatch = boite.nom_affiche.toLowerCase().includes(searchTerm);
        const cityMatch = boite.adresse?.city.toLowerCase().includes(searchTerm);
        const postcodeMatch = boite.adresse?.postcode.includes(searchTerm);
        const streetMatch = boite.adresse?.street?.toLowerCase().includes(searchTerm);
        return nomMatch || cityMatch || postcodeMatch || streetMatch;
      });
      setFilteredBoites(filtered);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchBoites(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchBoites]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1B4F8A] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom ou ville..."
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none text-lg"
          />
        </div>
      </div>

      {filteredBoites.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            {searchQuery ? 'Aucun résultat trouvé' : 'Entrez un nom ou une ville pour rechercher'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBoites.map((boite) => (
            <button
              key={boite.id}
              onClick={() => onSelectBoite(boite.id)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 text-left border border-gray-200 hover:border-[#1B4F8A] group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1B4F8A] to-[#2563a8] rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {boite.nom_affiche.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-[#1B4F8A] transition">
                    {boite.nom_affiche}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  {boite.adresse?.housenumber && `${boite.adresse.housenumber} `}
                  {boite.adresse?.street && `${boite.adresse.street}, `}
                  {boite.adresse?.city} ({boite.adresse?.postcode})
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
