import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type SupabaseEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseSupabaseRealtimeOptions {
  tableName: string;
  event?: SupabaseEvent;
  callback?: (payload: any) => void;
}

export function useSupabaseRealtime({
  tableName,
  event = '*',
  callback,
}: UseSupabaseRealtimeOptions) {
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create a new subscription
    const channel = supabase
      .channel(`public:${tableName}`)
      .on('postgres_changes', {
        event,
        schema: 'public',
        table: tableName,
      }, (payload) => {
        // Call the callback if provided
        if (callback) {
          callback(payload);
        }
      })
      .subscribe();

    setSubscription(channel);

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [tableName, event]);

  return subscription;
}