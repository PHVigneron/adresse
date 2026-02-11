/*
  # Suppression des index non utilisés et fusion des politiques

  ## Corrections apportées

  ### 1. Suppression des index non utilisés
  - Les index sont supprimés car ils ne sont pas actuellement utilisés
  - Ils peuvent être recréés plus tard si nécessaire une fois les données réelles présentes

  ### 2. Fusion des politiques SELECT multiples
  - Fusion des deux politiques SELECT sur `boites_lettres` en une seule avec OR
  - Fusion des deux politiques SELECT sur `demandes_contact` en une seule avec OR
  - Cela résout l'avertissement des politiques permissives multiples

  ## Notes
  - Auth DB Connection Strategy et Leaked Password Protection nécessitent 
    une configuration via le dashboard Supabase (impossible via SQL)
*/

-- ============================================================================
-- SUPPRESSION DES INDEX NON UTILISÉS
-- ============================================================================

DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_adresses_ban_id;
DROP INDEX IF EXISTS idx_adresses_city;
DROP INDEX IF EXISTS idx_adresses_postcode;
DROP INDEX IF EXISTS idx_boites_lettres_adresse_id;
DROP INDEX IF EXISTS idx_notifications_lu;
DROP INDEX IF EXISTS idx_demandes_contact_destinataire;
DROP INDEX IF EXISTS idx_demandes_contact_expediteur;
DROP INDEX IF EXISTS idx_demandes_contact_statut;
DROP INDEX IF EXISTS idx_notifications_boite_lettre_id;
DROP INDEX IF EXISTS idx_demandes_contact_boite_lettre_id;

-- Garder uniquement les index essentiels utilisés par les RLS
CREATE INDEX IF NOT EXISTS idx_boites_lettres_user_id 
  ON boites_lettres(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_destinataire 
  ON notifications(destinataire_id);

-- ============================================================================
-- FUSION DES POLITIQUES SELECT - TABLE BOITES_LETTRES
-- ============================================================================

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres boîtes aux lettres" ON boites_lettres;
DROP POLICY IF EXISTS "Les boîtes aux lettres visibles dans l'annuaire sont consultab" ON boites_lettres;

CREATE POLICY "Les utilisateurs peuvent voir les boîtes aux lettres autorisées"
  ON boites_lettres FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id 
    OR visible_annuaire = true
  );

-- ============================================================================
-- FUSION DES POLITIQUES SELECT - TABLE DEMANDES_CONTACT
-- ============================================================================

DROP POLICY IF EXISTS "Les expéditeurs peuvent voir leurs demandes envoyées" ON demandes_contact;
DROP POLICY IF EXISTS "Les destinataires peuvent voir leurs demandes reçues" ON demandes_contact;

CREATE POLICY "Les utilisateurs peuvent voir leurs demandes de contact"
  ON demandes_contact FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = expediteur_id 
    OR (select auth.uid()) = destinataire_id
  );