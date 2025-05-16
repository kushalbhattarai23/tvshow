/*
  # Create lists and list items tables

  1. New Tables
    - `lists`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `user_id` (uuid, not null) - references auth.users
      - `created_at` (timestamptz)
    - `list_items`
      - `list_id` (uuid) - references lists
      - `show` (text) - references tvshow
      - Primary key (list_id, show)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their lists
*/

-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create list_items table
CREATE TABLE IF NOT EXISTS list_items (
  list_id uuid REFERENCES lists(id) ON DELETE CASCADE,
  show text REFERENCES tvshow("Show") ON DELETE CASCADE,
  PRIMARY KEY (list_id, show)
);

-- Enable RLS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- Policies for lists table
CREATE POLICY "Users can create their own lists"
  ON lists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own lists"
  ON lists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
  ON lists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
  ON lists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for list_items table
CREATE POLICY "Users can manage items in their lists"
  ON list_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
      AND lists.user_id = auth.uid()
    )
  );