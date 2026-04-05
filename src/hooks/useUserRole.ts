import { useState, useEffect } from 'react';
// [AI-FLOW] import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  isFullAccess: boolean;
  isLead: boolean;
  loading: boolean;
}

export function useUserRole(userId?: string): UserRole {
  // [AI-FLOW] All users now have full access — AI analysis flow disabled
  // [AI-FLOW] Original code commented below for future reactivation
  return {
    isFullAccess: true,
    isLead: false,
    loading: false,
  };

  // [AI-FLOW] --- Original role check logic ---
  // const [isFullAccess, setIsFullAccess] = useState(false);
  // const [loading, setLoading] = useState(true);
  //
  // useEffect(() => {
  //   if (!userId) {
  //     setLoading(true);
  //     return;
  //   }
  //
  //   setLoading(true);
  //
  //   const fetchRole = async () => {
  //     try {
  //       const { data, error } = await supabase
  //         .rpc('is_full_access', { _user_id: userId });
  //
  //       if (error) {
  //         console.error('Error fetching user role:', error);
  //         setIsFullAccess(false);
  //       } else {
  //         setIsFullAccess(data === true);
  //       }
  //     } catch (err) {
  //       console.error('Error in useUserRole:', err);
  //       setIsFullAccess(false);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //
  //   fetchRole();
  // }, [userId]);
  //
  // return {
  //   isFullAccess,
  //   isLead: !isFullAccess,
  //   loading,
  // };
  // [AI-FLOW] --- End original logic ---
}
