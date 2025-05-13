import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UseSupabaseQueryOptions<T> {
  tableName: string;
  columns?: string;
  filters?: {
    column: string;
    operator: string;
    value: any;
  }[];
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
}

export function useSupabaseQuery<T>({
  tableName,
  columns = '*',
  filters = [],
  orderBy,
  limit,
}: UseSupabaseQueryOptions<T>) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from(tableName)
        .select(columns, { count: 'exact' });
      
      // Apply filters
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });
      
      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { 
          ascending: orderBy.ascending ?? true 
        });
      }
      
      // Only apply limit if specifically requested
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data: result, error: queryError } = await query;
      
      if (queryError) {
        throw new Error(queryError.message);
      }
      
      setData(result as T[]);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [tableName, columns, JSON.stringify(filters), JSON.stringify(orderBy), limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}