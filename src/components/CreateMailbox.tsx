import React, { useState } from 'react';
import { Home, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AddressSearch } from './AddressSearch';
import type { BanAddress } from '../lib/types';

interface CreateMailboxProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateMailbox({ onSuccess, onCancel }: CreateMailboxProps) {
  const { user } = useAuth();
  const [selectedAddress, setSelectedAddress] = useState<BanAddress | null>(null);
  const [nomAffiche, setNomAffiche] = useState('');
  const [visibleAnnuaire, setVisibleAnnuaire] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress || !user) return;

    setLoading(true);
    setError('');

    try {
      const { data: existingAddress } = await supabase
        .from('adresses')
        .select('id')
        .eq('ban_id', selectedAddress.properties.id)
        .maybeSingle();

      let adresseId: string;

      if (existingAddress) {
        adresseId = existingAddress.id;
      } else {
        const { data: newAddress, error: adresseError } = await supabase
          .from('adresses')
          .insert({
            ban_id: selectedAddress.properties.id,
            label: selectedAddress.properties.label,
            housenumber: selectedAddress.properties.housenumber,
            street: selectedAddress.properties.street,
            postcode: selectedAddress.properties.postcode,
            city: selectedAddress.properties.city,
            citycode: selectedAddress.properties.citycode,
            latitude: selectedAddress.geometry.coordinates[1],
            longitude: selectedAddress.geometry.coordinates[0],
          })
          .select()
          .single();

        if (adresseError) throw adresseError;
        adresseId = newAddress.id;
      }

      const { error: boiteError } = await supabase
        .from('boites_lettres')
        .insert({
          user_id: user.id,
          adresse_id: adresseId,
          nom_affiche: nomAffiche,
          visible_annuaire: visibleAnnuaire,
        });

      if (boiteError) throw boiteError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">
          Créer ma boîte aux lettres
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Home className="inline w-4 h-4 mr-1" />
            Rechercher mon adresse
          </label>
          <AddressSearch
            onSelectAddress={setSelectedAddress}
            placeholder="Tapez votre adresse..."
          />
          {selectedAddress && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                Adresse sélectionnée :
              </p>
              <p className="text-sm text-green-700">
                {selectedAddress.properties.label}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline w-4 h-4 mr-1" />
            Nom sur la boîte aux lettres
          </label>
          <input
            type="text"
            value={nomAffiche}
            onChange={(e) => setNomAffiche(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none transition"
            placeholder="Ex: Famille Dupont, Jean D., Apt 12..."
            required
          />
          <p className="mt-2 text-sm text-gray-500">
            Ce nom sera visible sur votre profil public
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={visibleAnnuaire}
              onChange={(e) => setVisibleAnnuaire(e.target.checked)}
              className="w-5 h-5 text-[#1B4F8A] border-gray-300 rounded focus:ring-[#1B4F8A]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium text-gray-900">
                {visibleAnnuaire ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                Visible dans l'annuaire public
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Votre adresse complète reste privée. Seule votre ville et code postal seront visibles.
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedAddress || !nomAffiche.trim()}
          className="w-full bg-[#1B4F8A] text-white py-3 rounded-lg font-semibold hover:bg-[#153d6e] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Création...' : 'Créer ma boîte aux lettres'}
        </button>
      </form>
    </div>
  );
}
