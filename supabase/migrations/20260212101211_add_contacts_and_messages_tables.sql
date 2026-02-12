/*
  # Add Contacts and Messages Tables

  1. New Tables
    
    ### contacts
    Saved contacts between users
    - `id` (uuid, primary key)
    - `user_id` (uuid, reference profiles) - Owner of the contact
    - `contact_user_id` (uuid, reference profiles) - The contact person
    - `contact_boite_id` (uuid, reference boites_lettres) - The mailbox that initiated the contact
    - `nom_affiche` (text) - Display name for the contact
    - `notes` (text, nullable) - Optional notes about the contact
    - `created_at` (timestamptz)
    - Unique constraint on (user_id, contact_user_id)

    ### messages
    Simple messaging system between users
    - `id` (uuid, primary key)
    - `expediteur_id` (uuid, reference profiles) - Sender
    - `destinataire_id` (uuid, reference profiles) - Recipient
    - `boite_lettre_id` (uuid, reference boites_lettres, nullable) - Related mailbox if applicable
    - `notification_id` (uuid, reference notifications, nullable) - If replying to a notification
    - `contenu` (text) - Message content
    - `lu` (boolean) - Read status
    - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only see their own contacts
    - Users can only see messages they sent or received
    - Users can create contacts and messages
    - Users can update their own contacts and mark messages as read
    - Users can delete their own contacts

  3. Indexes
    - Foreign key indexes for performance
    - Composite indexes for common queries
*/

-- Table contacts
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_boite_id uuid REFERENCES boites_lettres(id) ON DELETE SET NULL,
  nom_affiche text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, contact_user_id)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  destinataire_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  boite_lettre_id uuid REFERENCES boites_lettres(id) ON DELETE SET NULL,
  notification_id uuid REFERENCES notifications(id) ON DELETE SET NULL,
  contenu text NOT NULL,
  lu boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages they sent"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = expediteur_id);

CREATE POLICY "Users can view messages they received"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = destinataire_id);

CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = expediteur_id);

CREATE POLICY "Recipients can update their received messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = destinataire_id)
  WITH CHECK (auth.uid() = destinataire_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_user_id ON contacts(contact_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_boite_id ON contacts(contact_boite_id);

CREATE INDEX IF NOT EXISTS idx_messages_expediteur_id ON messages(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire_id ON messages(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_messages_boite_lettre_id ON messages(boite_lettre_id);
CREATE INDEX IF NOT EXISTS idx_messages_notification_id ON messages(notification_id);
CREATE INDEX IF NOT EXISTS idx_messages_lu ON messages(lu) WHERE lu = false;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(expediteur_id, destinataire_id, created_at DESC);