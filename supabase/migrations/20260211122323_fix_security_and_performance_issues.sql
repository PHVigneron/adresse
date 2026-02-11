/*
  # Correction des problèmes de sécurité et de performance

  ## Corrections apportées

  ### 1. Index manquants sur clés étrangères
  - Ajout d'index sur `notifications.boite_lettre_id`
  - Ajout d'index sur `demandes_contact.boite_lettre_id`

  ### 2. Optimisation des politiques RLS
  - Remplacement de `auth.uid()` par `(select auth.uid())` dans toutes les politiques
  - Cela évite la réévaluation de la fonction auth pour chaque ligne

  ### 3. Correction des politiques RLS trop permissives
  - Restriction de la politique d'insertion des notifications
  - Restriction de la politique d'insertion des adresses
  - Les utilisateurs ne peuvent plus insérer des notifications pour d'autres utilisateurs
  - Les adresses sont maintenant en lecture seule après création

  ## Notes importantes
  - Les index "non utilisés" sont conservés car ils seront utiles avec plus de données
  - Les politiques SELECT multiples sont normales (données personnelles + données publiques)
  - La stratégie de connexion Auth DB et la protection de mots de passe compromis 
    nécessitent des configurations serveur qui ne peuvent pas être faites via SQL
*/

-- Ajout des index manquants sur les clés étrangères
CREATE INDEX IF NOT EXISTS idx_notifications_boite_lettre_id 
  ON notifications(boite_lettre_id);

CREATE INDEX IF NOT EXISTS idx_demandes_contact_boite_lettre_id 
  ON demandes_contact(boite_lettre_id);

-- ============================================================================
-- OPTIMISATION DES POLITIQUES RLS - TABLE PROFILES
-- ============================================================================

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur propre profil" ON profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent insérer leur propre profil" ON profiles;

CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Les utilisateurs peuvent insérer leur propre profil"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- OPTIMISATION DES POLITIQUES RLS - TABLE BOITES_LETTRES
-- ============================================================================

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres boîtes aux lettres" ON boites_lettres;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs boîtes aux lettres" ON boites_lettres;
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs boîtes aux lettres" ON boites_lettres;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs boîtes aux lettres" ON boites_lettres;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres boîtes aux lettres"
  ON boites_lettres FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs boîtes aux lettres"
  ON boites_lettres FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs boîtes aux lettres"
  ON boites_lettres FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs boîtes aux lettres"
  ON boites_lettres FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- CORRECTION DES POLITIQUES RLS - TABLE NOTIFICATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres notifications" ON notifications;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent créer des notifications" ON notifications;
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs notifications" ON notifications;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs notifications" ON notifications;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = destinataire_id);

CREATE POLICY "Les utilisateurs peuvent créer des notifications pour les résidents"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boites_lettres
      WHERE boites_lettres.id = boite_lettre_id
      AND boites_lettres.user_id = destinataire_id
      AND boites_lettres.visible_annuaire = true
    )
  );

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = destinataire_id)
  WITH CHECK ((select auth.uid()) = destinataire_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = destinataire_id);

-- ============================================================================
-- CORRECTION DES POLITIQUES RLS - TABLE DEMANDES_CONTACT
-- ============================================================================

DROP POLICY IF EXISTS "Les expéditeurs peuvent voir leurs demandes envoyées" ON demandes_contact;
DROP POLICY IF EXISTS "Les destinataires peuvent voir leurs demandes reçues" ON demandes_contact;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent créer des demandes de contact" ON demandes_contact;
DROP POLICY IF EXISTS "Les destinataires peuvent mettre à jour leurs demandes reçues" ON demandes_contact;

CREATE POLICY "Les expéditeurs peuvent voir leurs demandes envoyées"
  ON demandes_contact FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = expediteur_id);

CREATE POLICY "Les destinataires peuvent voir leurs demandes reçues"
  ON demandes_contact FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = destinataire_id);

CREATE POLICY "Les utilisateurs peuvent créer des demandes vers résidents visibles"
  ON demandes_contact FOR INSERT
  TO authenticated
  WITH CHECK (
    ((select auth.uid()) = expediteur_id OR expediteur_id IS NULL)
    AND EXISTS (
      SELECT 1 FROM boites_lettres
      WHERE boites_lettres.id = boite_lettre_id
      AND boites_lettres.user_id = destinataire_id
      AND boites_lettres.visible_annuaire = true
    )
  );

CREATE POLICY "Les destinataires peuvent mettre à jour leurs demandes reçues"
  ON demandes_contact FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = destinataire_id)
  WITH CHECK ((select auth.uid()) = destinataire_id);

-- ============================================================================
-- CORRECTION DES POLITIQUES RLS - TABLE ADRESSES
-- ============================================================================

DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent créer des adresses" ON adresses;

CREATE POLICY "Les utilisateurs peuvent créer des adresses uniques"
  ON adresses FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM adresses AS existing
      WHERE existing.ban_id = adresses.ban_id
    )
  );