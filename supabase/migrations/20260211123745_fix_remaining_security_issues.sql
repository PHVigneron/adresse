/*
  # Correction finale des problèmes de sécurité

  ## Corrections apportées

  ### 1. Ajout des index manquants sur les clés étrangères
  - `boites_lettres.adresse_id`
  - `demandes_contact.boite_lettre_id`
  - `demandes_contact.destinataire_id`
  - `demandes_contact.expediteur_id`
  - `notifications.boite_lettre_id`

  ### 2. Nettoyage des politiques dupliquées
  - Suppression de toutes les anciennes politiques SELECT
  - Création d'une seule politique SELECT consolidée par table
  - Cela élimine l'avertissement des politiques permissives multiples

  ## Notes
  - Les deux derniers problèmes (Auth DB Connection et Password Protection) 
    nécessitent une configuration manuelle via le dashboard Supabase
*/

-- ============================================================================
-- AJOUT DES INDEX MANQUANTS SUR LES CLÉS ÉTRANGÈRES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_boites_lettres_adresse_id 
  ON boites_lettres(adresse_id);

CREATE INDEX IF NOT EXISTS idx_demandes_contact_boite_lettre_id 
  ON demandes_contact(boite_lettre_id);

CREATE INDEX IF NOT EXISTS idx_demandes_contact_destinataire_id 
  ON demandes_contact(destinataire_id);

CREATE INDEX IF NOT EXISTS idx_demandes_contact_expediteur_id 
  ON demandes_contact(expediteur_id);

CREATE INDEX IF NOT EXISTS idx_notifications_boite_lettre_id 
  ON notifications(boite_lettre_id);

-- ============================================================================
-- NETTOYAGE DES POLITIQUES DUPLIQUÉES - TABLE BOITES_LETTRES
-- ============================================================================

-- Supprimer toutes les anciennes politiques SELECT
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres boîtes aux lettres" ON boites_lettres;
DROP POLICY IF EXISTS "Les boîtes aux lettres visibles dans l'annuaire sont consultab" ON boites_lettres;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les boîtes aux lettres autorisées" ON boites_lettres;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les boîtes aux lettres autorisé" ON boites_lettres;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs boîtes et celles visibles" ON boites_lettres;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs boîtes et celles visibles " ON boites_lettres;

-- Créer une seule politique SELECT consolidée
CREATE POLICY "Autoriser accès boîtes personnelles et publiques"
  ON boites_lettres FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id 
    OR visible_annuaire = true
  );

-- ============================================================================
-- NETTOYAGE DES POLITIQUES DUPLIQUÉES - TABLE DEMANDES_CONTACT
-- ============================================================================

-- Supprimer toutes les anciennes politiques SELECT
DROP POLICY IF EXISTS "Les expéditeurs peuvent voir leurs demandes envoyées" ON demandes_contact;
DROP POLICY IF EXISTS "Les destinataires peuvent voir leurs demandes reçues" ON demandes_contact;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs demandes de contact" ON demandes_contact;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs demandes envoyées et reçu" ON demandes_contact;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs demandes envoyées et reçues" ON demandes_contact;

-- Créer une seule politique SELECT consolidée
CREATE POLICY "Autoriser accès demandes envoyées et reçues"
  ON demandes_contact FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = expediteur_id 
    OR (select auth.uid()) = destinataire_id
  );