/*
  # Update Boites Lettres Status System

  1. Changes
    - Add `liste_rouge` (boolean) to boites_lettres table
      * Indicates if the mailbox is in "liste rouge" mode
      * Defaults to false
      * When true: name visible but address hidden + intercom disabled
    - Remove old `statut` column (present/absent/ne_pas_deranger)
    - Keep `visible_annuaire` (boolean) for visibility in directory
      * When true: full visibility (name + address + intercom)
      * When false: not visible in directory at all

  2. Migration Strategy
    - Add new column with IF NOT EXISTS
    - Set default values for existing records
    - Drop old statut column if it exists

  3. Notes
    - `visible_annuaire = true` AND `liste_rouge = false`: Full visibility
    - `visible_annuaire = true` AND `liste_rouge = true`: Name visible, address hidden
    - `visible_annuaire = false`: Not in directory at all
*/

-- Add liste_rouge column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boites_lettres' AND column_name = 'liste_rouge'
  ) THEN
    ALTER TABLE boites_lettres ADD COLUMN liste_rouge boolean DEFAULT false;
  END IF;
END $$;

-- Drop old statut column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boites_lettres' AND column_name = 'statut'
  ) THEN
    ALTER TABLE boites_lettres DROP COLUMN statut;
  END IF;
END $$;

-- Create index for liste_rouge queries
CREATE INDEX IF NOT EXISTS idx_boites_lettres_liste_rouge ON boites_lettres(liste_rouge) WHERE liste_rouge = true;