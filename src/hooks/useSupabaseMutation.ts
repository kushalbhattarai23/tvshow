import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseSupabaseMutationOptions {
  tableName: string;
}

export function useSupabaseMutation({ tableName }: UseSupabaseMutationOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateRecord = async (
    updates: Record<string, any>,
    filters: { column: string; value: any }[]
  ) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(tableName).update(updates);

      filters.forEach(filter => {
        query = query.eq(filter.column, filter.value);
      });

      const { error: updateError } = await query;

      if (updateError) {
        throw new Error(updateError.message);
      }

      return true;
    } catch (err) {
      setError(err as Error);
      console.error('Error updating data:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateRecord, loading, error };
}