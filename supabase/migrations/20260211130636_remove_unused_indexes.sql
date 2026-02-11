/*
  # Suppression des index inutilisés

  ## Changements
  
  Suppression des index suivants qui n'ont pas été utilisés:
  
  1. **idx_boites_lettres_adresse_id** sur `boites_lettres`
     - Raison: Les requêtes n'utilisent pas cet index
  
  2. **idx_demandes_contact_boite_lettre_id** sur `demandes_contact`
     - Raison: Non utilisé par les requêtes actuelles
  
  3. **idx_demandes_contact_destinataire_id** sur `demandes_contact`
     - Raison: Non utilisé par les requêtes actuelles
  
  4. **idx_demandes_contact_expediteur_id** sur `demandes_contact`
     - Raison: Non utilisé par les requêtes actuelles
  
  5. **idx_notifications_boite_lettre_id** sur `notifications`
     - Raison: Non utilisé par les requêtes actuelles
  
  ## Bénéfices
  
  - Réduction de l'espace disque utilisé
  - Amélioration des performances d'écriture (INSERT, UPDATE, DELETE)
  - Simplification de la maintenance de la base de données
  
  ## Notes
  
  - Les index peuvent être recréés ultérieurement si nécessaire
  - Les clés étrangères restent en place pour l'intégrité référentielle
*/

-- Supprimer les index inutilisés
DROP INDEX IF EXISTS idx_boites_lettres_adresse_id;
DROP INDEX IF EXISTS idx_demandes_contact_boite_lettre_id;
DROP INDEX IF EXISTS idx_demandes_contact_destinataire_id;
DROP INDEX IF EXISTS idx_demandes_contact_expediteur_id;
DROP INDEX IF EXISTS idx_notifications_boite_lettre_id;
