import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from(tableName)
        .select(columns, { count: 'exact' });
      
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });
      
      if (orderBy) {
        query = query.order(orderBy.column, { 
          ascending: orderBy.ascending ?? true 
        });
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data: result, error: queryError } = await query;
      
      if (queryError) {
        throw queryError;
      }
      
      setData(result as T[]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err as Error);
      navigate('/signin');
    } finally {
      setLoading(false);
    }
  }, [tableName, columns, JSON.stringify(filters), JSON.stringify(orderBy), limit, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}