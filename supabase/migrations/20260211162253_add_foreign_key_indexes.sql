/*
  # Add Foreign Key Indexes for Performance

  1. Performance Improvements
    - Add index on `boites_lettres.adresse_id` for foreign key lookups
    - Add index on `demandes_contact.boite_lettre_id` for foreign key lookups
    - Add index on `demandes_contact.destinataire_id` for foreign key lookups
    - Add index on `demandes_contact.expediteur_id` for foreign key lookups
    - Add index on `notifications.boite_lettre_id` for foreign key lookups

  2. Why These Indexes Matter
    - Foreign keys without indexes cause table scans when joining or checking referential integrity
    - These indexes significantly improve query performance for:
      * JOIN operations between related tables
      * CASCADE operations on UPDATE/DELETE
      * Foreign key constraint validation
      * Queries filtering by these foreign key columns

  3. Notes
    - All indexes use IF NOT EXISTS to ensure idempotency
    - Index names follow PostgreSQL naming convention: tablename_columnname_idx
*/

-- Index for boites_lettres foreign key to adresses
CREATE INDEX IF NOT EXISTS idx_boites_lettres_adresse_id 
ON boites_lettres(adresse_id);

-- Index for demandes_contact foreign key to boites_lettres
CREATE INDEX IF NOT EXISTS idx_demandes_contact_boite_lettre_id 
ON demandes_contact(boite_lettre_id);

-- Index for demandes_contact foreign key to destinataire (profiles)
CREATE INDEX IF NOT EXISTS idx_demandes_contact_destinataire_id 
ON demandes_contact(destinataire_id);

-- Index for demandes_contact foreign key to expediteur (profiles)
CREATE INDEX IF NOT EXISTS idx_demandes_contact_expediteur_id 
ON demandes_contact(expediteur_id);

-- Index for notifications foreign key to boites_lettres
CREATE INDEX IF NOT EXISTS idx_notifications_boite_lettre_id 
ON notifications(boite_lettre_id);