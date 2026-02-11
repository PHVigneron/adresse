/*
  # Ajout de triggers pour les notifications par email

  ## Déclencheurs créés
  
  ### 1. Notification pour nouvelle demande de contact
  - Envoie un email au destinataire quand une nouvelle demande est créée
  - Contient le nom de l'expéditeur et le message
  
  ### 2. Notification pour réponse à une demande
  - Envoie un email à l'expéditeur quand sa demande est acceptée ou refusée
  - Contient le statut de la réponse et les coordonnées si acceptée
  
  ### 3. Notification pour nouvelles notifications système
  - Envoie un email à l'utilisateur pour chaque nouvelle notification
  
  ## Notes
  - Les emails sont envoyés via l'edge function 'send-notification-email'
  - Les triggers utilisent pg_net pour les appels HTTP asynchrones
  - Les erreurs d'envoi n'affectent pas les opérations de base de données
*/

-- ============================================================================
-- FONCTION: Envoyer une notification email via edge function
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_contact_request()
RETURNS TRIGGER AS $$
DECLARE
  destinataire_email text;
  expediteur_nom text;
  boite_nom text;
  function_url text;
BEGIN
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification-email';
  
  SELECT email INTO destinataire_email
  FROM auth.users
  WHERE id = NEW.destinataire_id;
  
  SELECT nom_complet INTO expediteur_nom
  FROM profiles
  WHERE user_id = NEW.expediteur_id;
  
  SELECT nom_affiche INTO boite_nom
  FROM boites_lettres
  WHERE id = NEW.boite_lettre_id;
  
  IF expediteur_nom IS NULL THEN
    expediteur_nom := NEW.expediteur_nom;
  END IF;
  
  IF expediteur_nom IS NULL THEN
    expediteur_nom := 'Un visiteur';
  END IF;
  
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'to', destinataire_email,
      'subject', 'Nouvelle demande de contact - MonAdresse',
      'html', '<h2>Nouvelle demande de contact</h2>' ||
              '<p><strong>' || expediteur_nom || '</strong> souhaite vous contacter concernant votre boîte aux lettres <strong>' || boite_nom || '</strong>.</p>' ||
              '<p><strong>Message:</strong></p>' ||
              '<p>' || NEW.message || '</p>' ||
              '<p>Connectez-vous à MonAdresse pour répondre à cette demande.</p>',
      'type', 'contact_request'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION: Notifier l'expéditeur de la réponse
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_contact_response()
RETURNS TRIGGER AS $$
DECLARE
  expediteur_email text;
  destinataire_nom text;
  boite_nom text;
  function_url text;
  response_html text;
BEGIN
  IF NEW.statut = OLD.statut THEN
    RETURN NEW;
  END IF;
  
  IF NEW.statut NOT IN ('acceptee', 'refusee') THEN
    RETURN NEW;
  END IF;
  
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification-email';
  
  SELECT email INTO expediteur_email
  FROM auth.users
  WHERE id = NEW.expediteur_id;
  
  SELECT nom_complet INTO destinataire_nom
  FROM profiles
  WHERE user_id = NEW.destinataire_id;
  
  SELECT nom_affiche INTO boite_nom
  FROM boites_lettres
  WHERE id = NEW.boite_lettre_id;
  
  IF NEW.statut = 'acceptee' THEN
    SELECT email INTO expediteur_email
    FROM auth.users
    WHERE id = NEW.expediteur_id;
    
    response_html := '<h2>Demande de contact acceptée</h2>' ||
                     '<p><strong>' || COALESCE(destinataire_nom, 'Le résident') || '</strong> a accepté votre demande de contact pour la boîte aux lettres <strong>' || boite_nom || '</strong>.</p>' ||
                     '<p>Email de contact: <a href="mailto:' || expediteur_email || '">' || expediteur_email || '</a></p>' ||
                     '<p>Vous pouvez maintenant communiquer directement.</p>';
  ELSE
    response_html := '<h2>Demande de contact refusée</h2>' ||
                     '<p>Votre demande de contact pour la boîte aux lettres <strong>' || boite_nom || '</strong> a été refusée.</p>';
  END IF;
  
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'to', expediteur_email,
      'subject', 'Réponse à votre demande de contact - MonAdresse',
      'html', response_html,
      'type', 'contact_response'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION: Notifier pour nouvelle notification système
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  boite_nom text;
  function_url text;
BEGIN
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification-email';
  
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  IF NEW.boite_lettre_id IS NOT NULL THEN
    SELECT nom_affiche INTO boite_nom
    FROM boites_lettres
    WHERE id = NEW.boite_lettre_id;
  END IF;
  
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'to', user_email,
      'subject', 'Nouvelle notification - MonAdresse',
      'html', '<h2>Nouvelle notification</h2>' ||
              '<p>' || NEW.message || '</p>' ||
              CASE WHEN boite_nom IS NOT NULL 
                   THEN '<p>Concernant: <strong>' || boite_nom || '</strong></p>'
                   ELSE ''
              END,
      'type', 'notification'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CRÉATION DES TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_notify_contact_request ON demandes_contact;
CREATE TRIGGER trigger_notify_contact_request
  AFTER INSERT ON demandes_contact
  FOR EACH ROW
  EXECUTE FUNCTION notify_contact_request();

DROP TRIGGER IF EXISTS trigger_notify_contact_response ON demandes_contact;
CREATE TRIGGER trigger_notify_contact_response
  AFTER UPDATE ON demandes_contact
  FOR EACH ROW
  EXECUTE FUNCTION notify_contact_response();

DROP TRIGGER IF EXISTS trigger_notify_new_notification ON notifications;
CREATE TRIGGER trigger_notify_new_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_notification();
