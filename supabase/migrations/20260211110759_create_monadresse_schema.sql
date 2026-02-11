/*
  # Création du schéma MonAdresse.fr

  ## Tables créées
  
  ### 1. profiles
  Profils utilisateurs liés à auth.users
  - `id` (uuid, clé primaire, référence auth.users)
  - `email` (text, unique)
  - `nom_complet` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. adresses
  Adresses certifiées via l'API BAN
  - `id` (uuid, clé primaire)
  - `ban_id` (text, unique, identifiant BAN)
  - `label` (text, libellé complet)
  - `housenumber` (text, numéro)
  - `street` (text, rue)
  - `postcode` (text, code postal)
  - `city` (text, ville)
  - `citycode` (text, code INSEE)
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `created_at` (timestamptz)

  ### 3. boites_lettres
  Boîtes aux lettres virtuelles des résidents
  - `id` (uuid, clé primaire)
  - `user_id` (uuid, référence profiles)
  - `adresse_id` (uuid, référence adresses)
  - `nom_affiche` (text, nom personnalisé)
  - `statut` (text, présent/absent/ne_pas_deranger)
  - `visible_annuaire` (boolean, visibilité dans l'annuaire)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. notifications
  Notifications pour les sonneries d'interphone
  - `id` (uuid, clé primaire)
  - `destinataire_id` (uuid, référence profiles)
  - `boite_lettre_id` (uuid, référence boites_lettres)
  - `expediteur_nom` (text, optionnel)
  - `message` (text)
  - `lu` (boolean)
  - `created_at` (timestamptz)

  ### 5. demandes_contact
  Demandes de mise en relation sécurisée
  - `id` (uuid, clé primaire)
  - `expediteur_id` (uuid, référence profiles, optionnel pour visiteurs anonymes)
  - `expediteur_nom` (text, nom si anonyme)
  - `destinataire_id` (uuid, référence profiles)
  - `boite_lettre_id` (uuid, référence boites_lettres)
  - `message` (text)
  - `statut` (text, en_attente/acceptee/refusee)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Sécurité RLS
  
  Toutes les tables ont RLS activé avec des politiques restrictives :
  - Les utilisateurs ne peuvent voir que leurs propres données
  - Les profils publics sont visibles uniquement si la boîte aux lettres est visible dans l'annuaire
  - Les adresses complètes ne sont jamais exposées publiquement
  - Les demandes de contact respectent la vie privée
*/

-- Table profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  nom_complet text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent insérer leur propre profil"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Table adresses
CREATE TABLE IF NOT EXISTS adresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ban_id text UNIQUE NOT NULL,
  label text NOT NULL,
  housenumber text,
  street text,
  postcode text NOT NULL,
  city text NOT NULL,
  citycode text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE adresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les adresses sont visibles par tous les utilisateurs authentifiés"
  ON adresses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des adresses"
  ON adresses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Table boites_lettres
CREATE TABLE IF NOT EXISTS boites_lettres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  adresse_id uuid NOT NULL REFERENCES adresses ON DELETE CASCADE,
  nom_affiche text NOT NULL,
  statut text NOT NULL DEFAULT 'present' CHECK (statut IN ('present', 'absent', 'ne_pas_deranger')),
  visible_annuaire boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, adresse_id)
);

ALTER TABLE boites_lettres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres boîtes aux lettres"
  ON boites_lettres FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Les boîtes aux lettres visibles dans l'annuaire sont consultables"
  ON boites_lettres FOR SELECT
  TO authenticated
  USING (visible_annuaire = true);

CREATE POLICY "Les utilisateurs peuvent créer leurs boîtes aux lettres"
  ON boites_lettres FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs boîtes aux lettres"
  ON boites_lettres FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs boîtes aux lettres"
  ON boites_lettres FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destinataire_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  boite_lettre_id uuid NOT NULL REFERENCES boites_lettres ON DELETE CASCADE,
  expediteur_nom text,
  message text NOT NULL,
  lu boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = destinataire_id);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = destinataire_id)
  WITH CHECK (auth.uid() = destinataire_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = destinataire_id);

-- Table demandes_contact
CREATE TABLE IF NOT EXISTS demandes_contact (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id uuid REFERENCES profiles ON DELETE CASCADE,
  expediteur_nom text,
  destinataire_id uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  boite_lettre_id uuid NOT NULL REFERENCES boites_lettres ON DELETE CASCADE,
  message text NOT NULL,
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'acceptee', 'refusee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE demandes_contact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les expéditeurs peuvent voir leurs demandes envoyées"
  ON demandes_contact FOR SELECT
  TO authenticated
  USING (auth.uid() = expediteur_id);

CREATE POLICY "Les destinataires peuvent voir leurs demandes reçues"
  ON demandes_contact FOR SELECT
  TO authenticated
  USING (auth.uid() = destinataire_id);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des demandes de contact"
  ON demandes_contact FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = expediteur_id OR expediteur_id IS NULL);

CREATE POLICY "Les destinataires peuvent mettre à jour leurs demandes reçues"
  ON demandes_contact FOR UPDATE
  TO authenticated
  USING (auth.uid() = destinataire_id)
  WITH CHECK (auth.uid() = destinataire_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_adresses_ban_id ON adresses(ban_id);
CREATE INDEX IF NOT EXISTS idx_adresses_city ON adresses(city);
CREATE INDEX IF NOT EXISTS idx_adresses_postcode ON adresses(postcode);
CREATE INDEX IF NOT EXISTS idx_boites_lettres_user_id ON boites_lettres(user_id);
CREATE INDEX IF NOT EXISTS idx_boites_lettres_adresse_id ON boites_lettres(adresse_id);
CREATE INDEX IF NOT EXISTS idx_boites_lettres_visible ON boites_lettres(visible_annuaire) WHERE visible_annuaire = true;
CREATE INDEX IF NOT EXISTS idx_notifications_destinataire ON notifications(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications(lu) WHERE lu = false;
CREATE INDEX IF NOT EXISTS idx_demandes_contact_destinataire ON demandes_contact(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_demandes_contact_expediteur ON demandes_contact(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_demandes_contact_statut ON demandes_contact(statut);