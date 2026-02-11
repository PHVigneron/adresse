/*
  # Remove Unused and Duplicate Database Indexes
  
  1. Unused Indexes Removed
    - `idx_boites_lettres_adresse_fk` - Not being used by queries
    - `idx_boites_lettres_user_fk` - Duplicate of idx_boites_lettres_user_id
    - `idx_demandes_contact_boite_lettre_fk` - Not being used by queries
    - `idx_demandes_contact_destinataire_fk` - Not being used by queries
    - `idx_demandes_contact_expediteur_fk` - Not being used by queries
    - `idx_notifications_boite_lettre_fk` - Not being used by queries
    - `idx_notifications_destinataire_fk` - Duplicate of idx_notifications_destinataire
  
  2. Duplicate Indexes Removed
    - Keeping `idx_boites_lettres_user_id`, dropping `idx_boites_lettres_user_fk`
    - Keeping `idx_notifications_destinataire`, dropping `idx_notifications_destinataire_fk`
  
  3. Performance Impact
    - Reduces storage overhead
    - Improves write performance (fewer indexes to maintain)
    - No negative impact on query performance (unused indexes don't help)
  
  4. Important Notes
    - Foreign key constraints remain intact - only indexes are removed
    - Core functionality and data integrity are preserved
    - Essential indexes for frequently queried columns are retained
*/

-- Drop unused indexes from boites_lettres table
DROP INDEX IF EXISTS idx_boites_lettres_adresse_fk;
DROP INDEX IF EXISTS idx_boites_lettres_user_fk;

-- Drop unused indexes from demandes_contact table
DROP INDEX IF EXISTS idx_demandes_contact_boite_lettre_fk;
DROP INDEX IF EXISTS idx_demandes_contact_destinataire_fk;
DROP INDEX IF EXISTS idx_demandes_contact_expediteur_fk;

-- Drop unused indexes from notifications table
DROP INDEX IF EXISTS idx_notifications_boite_lettre_fk;
DROP INDEX IF EXISTS idx_notifications_destinataire_fk;