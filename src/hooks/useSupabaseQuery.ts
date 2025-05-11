import { useState, useEffect } from 'react';
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
  page?: number;
  pageSize?: number;
}

interface PaginatedResult<T> {
  data: T[] | null;
  error: Error | null;
  loading: boolean;
  totalCount: number;
  totalPages: number;
}

export function useSupabaseQuery<T>({
  tableName,
  columns = '*',
  filters = [],
  orderBy,
  page = 1,
  pageSize = 10,
}: UseSupabaseQueryOptions<T>): PaginatedResult<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First, get the total count
        const { count: total, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          throw new Error(countError.message);
        }

        setTotalCount(total || 0);
        
        // Then fetch the paginated data
        let query = supabase
          .from(tableName)
          .select(columns)
          .range((page - 1) * pageSize, page * pageSize - 1);
        
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
    };

    fetchData();
  }, [tableName, columns, JSON.stringify(filters), JSON.stringify(orderBy), page, pageSize]);

  return { 
    data, 
    error, 
    loading,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize)
  };
}