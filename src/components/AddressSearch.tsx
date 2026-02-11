import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader } from 'lucide-react';
import type { BanAddress } from '../lib/types';

interface AddressSearchProps {
  onSelectAddress: (address: BanAddress) => void;
  placeholder?: string;
}

export function AddressSearch({ onSelectAddress, placeholder }: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BanAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchAddress = async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=10`
        );
        const data = await response.json();
        setResults(data.features || []);
        setShowResults(true);
      } catch (error) {
        console.error('Erreur de recherche:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchAddress, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (address: BanAddress) => {
    setQuery(address.properties.label);
    setShowResults(false);
    onSelectAddress(address);
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none transition"
          placeholder={placeholder || 'Rechercher une adresse...'}
        />
        {loading && (
          <Loader className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition flex items-start gap-3"
            >
              <MapPin className="w-5 h-5 text-[#1B4F8A] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {result.properties.label}
                </p>
                <p className="text-sm text-gray-500">
                  {result.properties.city} ({result.properties.postcode})
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && query.length >= 3 && results.length === 0 && !loading && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          Aucune adresse trouvée
        </div>
      )}
    </div>
  );
}
