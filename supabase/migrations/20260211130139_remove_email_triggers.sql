/*
  # Suppression des triggers d'email

  ## Changements
  
  - Suppression des triggers d'email automatiques
  - Suppression des fonctions de notification
  - Les emails sont maintenant envoyés depuis le frontend pour plus de contrôle
  
  ## Raison
  
  - Les triggers de base de données avec appels HTTP externes peuvent être problématiques
  - Le frontend a un meilleur contrôle sur quand et comment envoyer les emails
  - Simplifie la logique de la base de données
*/

-- Supprimer les triggers
DROP TRIGGER IF EXISTS trigger_notify_contact_request ON demandes_contact;
DROP TRIGGER IF EXISTS trigger_notify_contact_response ON demandes_contact;
DROP TRIGGER IF EXISTS trigger_notify_new_notification ON notifications;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS notify_contact_request();
DROP FUNCTION IF EXISTS notify_contact_response();
DROP FUNCTION IF EXISTS notify_new_notification();
