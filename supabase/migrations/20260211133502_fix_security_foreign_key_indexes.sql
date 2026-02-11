/*
  # Correction des problèmes de sécurité et performance

  ## 1. Ajout d'index sur les clés étrangères
  
  Les index suivants sont ajoutés pour optimiser les performances des requêtes
  utilisant des foreign keys :
  
  - `idx_boites_lettres_adresse_fk` sur `boites_lettres(adresse_id)`
  - `idx_demandes_contact_boite_lettre_fk` sur `demandes_contact(boite_lettre_id)`
  - `idx_demandes_contact_destinataire_fk` sur `demandes_contact(destinataire_id)`
  - `idx_demandes_contact_expediteur_fk` sur `demandes_contact(expediteur_id)`
  - `idx_notifications_boite_lettre_fk` sur `notifications(boite_lettre_id)`
  - `idx_notifications_destinataire_fk` sur `notifications(destinataire_id)`
  
  ## 2. Correction du search_path de la fonction delete_user_account
  
  La fonction `delete_user_account` est recréée avec un `search_path` fixe
  pour éviter les vulnérabilités de sécurité liées à un search_path mutable.
  
  ## Bénéfices
  
  - Amélioration des performances des requêtes avec JOIN
  - Amélioration des performances des DELETE CASCADE
  - Protection contre les attaques par manipulation du search_path
  - Conformité aux meilleures pratiques de sécurité PostgreSQL
*/

-- Ajouter les index manquants sur les foreign keys
CREATE INDEX IF NOT EXISTS idx_boites_lettres_adresse_fk ON boites_lettres(adresse_id);
CREATE INDEX IF NOT EXISTS idx_boites_lettres_user_fk ON boites_lettres(user_id);

CREATE INDEX IF NOT EXISTS idx_demandes_contact_boite_lettre_fk ON demandes_contact(boite_lettre_id);
CREATE INDEX IF NOT EXISTS idx_demandes_contact_destinataire_fk ON demandes_contact(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_demandes_contact_expediteur_fk ON demandes_contact(expediteur_id);

CREATE INDEX IF NOT EXISTS idx_notifications_boite_lettre_fk ON notifications(boite_lettre_id);
CREATE INDEX IF NOT EXISTS idx_notifications_destinataire_fk ON notifications(destinataire_id);

-- Recréer la fonction delete_user_account avec un search_path sécurisé
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_id_to_delete uuid;
BEGIN
  -- Récupérer l'ID de l'utilisateur connecté
  user_id_to_delete := auth.uid();
  
  IF user_id_to_delete IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté pour supprimer votre compte';
  END IF;
  
  -- Supprimer toutes les demandes de contact liées (expéditeur et destinataire)
  DELETE FROM public.demandes_contact 
  WHERE expediteur_id = user_id_to_delete OR destinataire_id = user_id_to_delete;
  
  -- Supprimer toutes les notifications
  DELETE FROM public.notifications WHERE destinataire_id = user_id_to_delete;
  
  -- Supprimer toutes les boîtes aux lettres
  DELETE FROM public.boites_lettres WHERE user_id = user_id_to_delete;
  
  -- Supprimer le profil (cela déclenchera aussi la suppression dans auth.users via ON DELETE CASCADE)
  DELETE FROM public.profiles WHERE id = user_id_to_delete;
  
  -- Supprimer l'utilisateur de auth.users
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;

-- S'assurer que la fonction est accessible aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
