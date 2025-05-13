/*
  # Add update policy for TV shows table

  1. Security
    - Add policy for authenticated users to update their TV show data
*/

-- Create policy to allow authenticated users to update TV shows
CREATE POLICY "Allow authenticated users to update TV shows"
  ON tvshow
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);