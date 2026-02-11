export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          prenom: string;
          nom: string;
          nom_complet: string;
          telephone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          prenom: string;
          nom: string;
          telephone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          prenom?: string;
          nom?: string;
          telephone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      adresses: {
        Row: {
          id: string;
          ban_id: string;
          label: string;
          housenumber: string | null;
          street: string | null;
          postcode: string;
          city: string;
          citycode: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ban_id: string;
          label: string;
          housenumber?: string | null;
          street?: string | null;
          postcode: string;
          city: string;
          citycode?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ban_id?: string;
          label?: string;
          housenumber?: string | null;
          street?: string | null;
          postcode?: string;
          city?: string;
          citycode?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
        };
      };
      boites_lettres: {
        Row: {
          id: string;
          user_id: string;
          adresse_id: string;
          nom_affiche: string;
          statut: 'present' | 'absent' | 'ne_pas_deranger';
          visible_annuaire: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          adresse_id: string;
          nom_affiche: string;
          statut?: 'present' | 'absent' | 'ne_pas_deranger';
          visible_annuaire?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          adresse_id?: string;
          nom_affiche?: string;
          statut?: 'present' | 'absent' | 'ne_pas_deranger';
          visible_annuaire?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          destinataire_id: string;
          boite_lettre_id: string;
          expediteur_nom: string | null;
          message: string;
          lu: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          destinataire_id: string;
          boite_lettre_id: string;
          expediteur_nom?: string | null;
          message: string;
          lu?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          destinataire_id?: string;
          boite_lettre_id?: string;
          expediteur_nom?: string | null;
          message?: string;
          lu?: boolean;
          created_at?: string;
        };
      };
      demandes_contact: {
        Row: {
          id: string;
          expediteur_id: string | null;
          expediteur_nom: string | null;
          destinataire_id: string;
          boite_lettre_id: string;
          message: string;
          statut: 'en_attente' | 'acceptee' | 'refusee';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          expediteur_id?: string | null;
          expediteur_nom?: string | null;
          destinataire_id: string;
          boite_lettre_id: string;
          message: string;
          statut?: 'en_attente' | 'acceptee' | 'refusee';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          expediteur_id?: string | null;
          expediteur_nom?: string | null;
          destinataire_id?: string;
          boite_lettre_id?: string;
          message?: string;
          statut?: 'en_attente' | 'acceptee' | 'refusee';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export interface BanAddress {
  properties: {
    id: string;
    label: string;
    housenumber?: string;
    street?: string;
    postcode: string;
    city: string;
    citycode?: string;
    score: number;
  };
  geometry: {
    coordinates: [number, number];
  };
}

export interface Profile {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  nom_complet: string;
  telephone: string | null;
}

export interface BoiteLettre {
  id: string;
  user_id: string;
  adresse_id: string;
  nom_affiche: string;
  statut: 'present' | 'absent' | 'ne_pas_deranger';
  visible_annuaire: boolean;
  adresse?: {
    city: string;
    postcode: string;
  };
}

export interface Notification {
  id: string;
  destinataire_id: string;
  boite_lettre_id: string;
  expediteur_nom: string | null;
  message: string;
  lu: boolean;
  created_at: string;
  boite_lettre?: {
    nom_affiche: string;
  };
}

export interface DemandeContact {
  id: string;
  expediteur_id: string | null;
  expediteur_nom: string | null;
  destinataire_id: string;
  boite_lettre_id: string;
  message: string;
  statut: 'en_attente' | 'acceptee' | 'refusee';
  created_at: string;
  boite_lettre?: {
    nom_affiche: string;
  };
  expediteur?: {
    nom_complet: string;
    email: string;
  };
}
