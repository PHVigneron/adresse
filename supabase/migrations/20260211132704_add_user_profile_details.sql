/*
  # Ajout des détails du profil utilisateur

  ## Changements

  1. **Ajout de colonnes dans la table profiles**
     - `prenom` (text) - Prénom de l'utilisateur (requis)
     - `nom` (text) - Nom de famille de l'utilisateur (requis)
     - `telephone` (text) - Numéro de téléphone optionnel
     - Conversion de `nom_complet` en colonne générée automatiquement

  2. **Colonne générée**
     - `nom_complet` devient une colonne calculée à partir de prenom + nom
     - Cela garantit la cohérence des données

  ## Notes importantes

  - Les nouvelles inscriptions devront fournir prénom et nom séparément
  - Le téléphone reste optionnel (conformité RGPD)
  - Les données existantes (nom_complet) seront conservées temporairement
  - Pour les données existantes, une valeur par défaut est appliquée
*/

-- Ajouter les nouvelles colonnes
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS prenom text,
  ADD COLUMN IF NOT EXISTS nom text,
  ADD COLUMN IF NOT EXISTS telephone text;

-- Pour les utilisateurs existants, on split nom_complet (si présent)
-- On met un default temporaire pour éviter les problèmes
UPDATE profiles 
SET 
  prenom = COALESCE(split_part(nom_complet, ' ', 1), 'Prénom'),
  nom = COALESCE(NULLIF(substring(nom_complet from position(' ' in nom_complet) + 1), ''), 'Nom')
WHERE prenom IS NULL OR nom IS NULL;

-- Maintenant on rend les colonnes NOT NULL
ALTER TABLE profiles 
  ALTER COLUMN prenom SET NOT NULL,
  ALTER COLUMN nom SET NOT NULL;

-- Recréer nom_complet comme colonne générée
ALTER TABLE profiles DROP COLUMN IF EXISTS nom_complet;
ALTER TABLE profiles ADD COLUMN nom_complet text GENERATED ALWAYS AS (prenom || ' ' || nom) STORED;
