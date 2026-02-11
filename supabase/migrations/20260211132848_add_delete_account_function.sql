/*
  # Fonction de suppression de compte utilisateur (RGPD)

  ## Fonction créée
  
  **delete_user_account()**
  Fonction RPC pour supprimer complètement un compte utilisateur
  
  ## Comportement
  
  1. Supprime toutes les données associées à l'utilisateur :
     - Profil dans `profiles`
     - Toutes les boîtes aux lettres dans `boites_lettres`
     - Toutes les notifications dans `notifications`
     - Toutes les demandes de contact dans `demandes_contact`
  
  2. Supprime l'utilisateur de `auth.users`
  
  ## Sécurité
  
  - Seul l'utilisateur connecté peut supprimer son propre compte
  - La suppression est irréversible
  - Conforme aux exigences RGPD (droit à l'effacement)
  
  ## Cascade
  
  - Les contraintes ON DELETE CASCADE garantissent la suppression de toutes les données liées
  - L'ordre de suppression est important pour respecter les contraintes de clés étrangères
*/

-- Fonction pour supprimer le compte d'un utilisateur
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
  DELETE FROM demandes_contact 
  WHERE expediteur_id = user_id_to_delete OR destinataire_id = user_id_to_delete;
  
  -- Supprimer toutes les notifications
  DELETE FROM notifications WHERE destinataire_id = user_id_to_delete;
  
  -- Supprimer toutes les boîtes aux lettres
  DELETE FROM boites_lettres WHERE user_id = user_id_to_delete;
  
  -- Supprimer le profil (cela déclenchera aussi la suppression dans auth.users via ON DELETE CASCADE)
  DELETE FROM profiles WHERE id = user_id_to_delete;
  
  -- Supprimer l'utilisateur de auth.users
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;

-- Permettre à tous les utilisateurs authentifiés d'appeler cette fonction
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
