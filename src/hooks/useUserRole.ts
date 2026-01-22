import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  isFullAccess: boolean;
  isLead: boolean;
  loading: boolean;
}

export function useUserRole(userId?: string): UserRole {
  const [isFullAccess, setIsFullAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        // Use the security definer function to check role
        const { data, error } = await supabase
          .rpc('is_full_access', { _user_id: userId });

        if (error) {
          console.error('Error fetching user role:', error);
          setIsFullAccess(false);
        } else {
          setIsFullAccess(data === true);
        }
      } catch (err) {
        console.error('Error in useUserRole:', err);
        setIsFullAccess(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [userId]);

  return {
    isFullAccess,
    isLead: !isFullAccess,
    loading,
  };
}
