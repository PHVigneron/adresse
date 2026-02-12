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
          email_notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          prenom: string;
          nom: string;
          telephone?: string | null;
          email_notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          prenom?: string;
          nom?: string;
          telephone?: string | null;
          email_notifications_enabled?: boolean;
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
          visible_annuaire: boolean;
          liste_rouge: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          adresse_id: string;
          nom_affiche: string;
          visible_annuaire?: boolean;
          liste_rouge?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          adresse_id?: string;
          nom_affiche?: string;
          visible_annuaire?: boolean;
          liste_rouge?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          contact_user_id: string;
          contact_boite_id: string | null;
          nom_affiche: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_user_id: string;
          contact_boite_id?: string | null;
          nom_affiche: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contact_user_id?: string;
          contact_boite_id?: string | null;
          nom_affiche?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          expediteur_id: string;
          destinataire_id: string;
          boite_lettre_id: string | null;
          notification_id: string | null;
          contenu: string;
          lu: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          expediteur_id: string;
          destinataire_id: string;
          boite_lettre_id?: string | null;
          notification_id?: string | null;
          contenu: string;
          lu?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          expediteur_id?: string;
          destinataire_id?: string;
          boite_lettre_id?: string | null;
          notification_id?: string | null;
          contenu?: string;
          lu?: boolean;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          destinataire_id: string;
          boite_lettre_id: string;
          expediteur_id: string | null;
          expediteur_nom: string | null;
          message: string;
          lu: boolean;
          partager_telephone: boolean;
          partager_email: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          destinataire_id: string;
          boite_lettre_id: string;
          expediteur_id?: string | null;
          expediteur_nom?: string | null;
          message: string;
          lu?: boolean;
          partager_telephone?: boolean;
          partager_email?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          destinataire_id?: string;
          boite_lettre_id?: string;
          expediteur_id?: string | null;
          expediteur_nom?: string | null;
          message?: string;
          lu?: boolean;
          partager_telephone?: boolean;
          partager_email?: boolean;
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
          partager_telephone: boolean;
          partager_email: boolean;
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
          partager_telephone?: boolean;
          partager_email?: boolean;
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
          partager_telephone?: boolean;
          partager_email?: boolean;
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
  email_notifications_enabled: boolean;
}

export interface BoiteLettre {
  id: string;
  user_id: string;
  adresse_id: string;
  nom_affiche: string;
  visible_annuaire: boolean;
  liste_rouge: boolean;
  adresse?: {
    housenumber?: string;
    street?: string;
    city: string;
    postcode: string;
  };
  profile?: {
    nom_complet: string;
  };
}

export interface Notification {
  id: string;
  destinataire_id: string;
  boite_lettre_id: string;
  expediteur_id: string | null;
  expediteur_nom: string | null;
  message: string;
  lu: boolean;
  partager_telephone: boolean;
  partager_email: boolean;
  created_at: string;
  boite_lettre?: {
    nom_affiche: string;
  };
  expediteur?: {
    nom_complet: string;
    email: string;
    telephone: string | null;
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
  partager_telephone: boolean;
  partager_email: boolean;
  created_at: string;
  boite_lettre?: {
    nom_affiche: string;
  };
  expediteur?: {
    nom_complet: string;
    email: string;
    telephone: string | null;
  };
}

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  contact_boite_id: string | null;
  nom_affiche: string;
  notes: string | null;
  created_at: string;
  contact_user?: {
    nom_complet: string;
    email: string;
    telephone: string | null;
  };
  boite_lettre?: {
    nom_affiche: string;
  };
}

export interface Message {
  id: string;
  expediteur_id: string;
  destinataire_id: string;
  boite_lettre_id: string | null;
  notification_id: string | null;
  contenu: string;
  lu: boolean;
  created_at: string;
  expediteur?: {
    nom_complet: string;
  };
  destinataire?: {
    nom_complet: string;
  };
}
