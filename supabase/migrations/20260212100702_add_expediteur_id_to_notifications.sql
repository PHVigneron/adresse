/*
  # Add expediteur_id to notifications table

  1. Updates
    - Add `expediteur_id` (uuid, nullable) to notifications table
      * References profiles table
      * Allows tracking the sender for authenticated users
      * Remains null for anonymous visitors

  2. Notes
    - Uses IF NOT EXISTS to ensure idempotency
    - Nullable to support anonymous senders
    - Foreign key constraint ensures data integrity
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'expediteur_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN expediteur_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_expediteur_id ON notifications(expediteur_id);