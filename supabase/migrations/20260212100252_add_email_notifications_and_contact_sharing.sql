/*
  # Add Email Notifications Preference and Contact Sharing Options

  1. Profile Updates
    - Add `email_notifications_enabled` (boolean) to profiles table
      * Controls whether users receive email notifications
      * Defaults to true for backward compatibility

  2. Demandes Contact Updates
    - Add `partager_telephone` (boolean) to demandes_contact table
      * Indicates if sender wants to share their phone number
      * Defaults to false
    - Add `partager_email` (boolean) to demandes_contact table
      * Indicates if sender wants to share their email address
      * Defaults to false

  3. Notifications Updates
    - Add `partager_telephone` (boolean) to notifications table
      * Indicates if sender wants to share their phone number in intercom notification
      * Defaults to false
    - Add `partager_email` (boolean) to notifications table
      * Indicates if sender wants to share their email in intercom notification
      * Defaults to false

  4. Notes
    - All columns use IF NOT EXISTS to ensure idempotency
    - Default values ensure backward compatibility
    - These fields enable users to control what contact information they share
*/

-- Add email notifications preference to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_notifications_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Add contact sharing options to demandes_contact
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demandes_contact' AND column_name = 'partager_telephone'
  ) THEN
    ALTER TABLE demandes_contact ADD COLUMN partager_telephone boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demandes_contact' AND column_name = 'partager_email'
  ) THEN
    ALTER TABLE demandes_contact ADD COLUMN partager_email boolean DEFAULT false;
  END IF;
END $$;

-- Add contact sharing options to notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'partager_telephone'
  ) THEN
    ALTER TABLE notifications ADD COLUMN partager_telephone boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'partager_email'
  ) THEN
    ALTER TABLE notifications ADD COLUMN partager_email boolean DEFAULT false;
  END IF;
END $$;