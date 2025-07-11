import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Batch } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useBatches = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBatches = async () => {
    if (!user) {
      setBatches([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching batches for user:', user.email, user.role);

      if (user.role === 'student') {
        // Fetch enrolled batches for students
        const { data, error } = await supabase
          .from('batch_enrollments')
          .select(`
            progress,
            batches!inner(
              *,
              instructor:profiles!instructor_id(*)
            )
          `)
          .eq('student_id', user.id);

        if (error) {
          console.error('Error fetching student batches:', error);
          throw error;
        }

        console.log('📚 Student batches data:', data);

        const batchesWithProgress = (data || []).map(enrollment => ({
          ...enrollment.batches,
          progress: enrollment.progress
        }));

        setBatches(batchesWithProgress);
      } else if (user.role === 'instructor') {
        // Fetch instructor's own batches
        const { data, error } = await supabase
          .from('batches')
          .select(`
            *,
            instructor:profiles!instructor_id(*)
          `)
          .eq('instructor_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching instructor batches:', error);
          throw error;
        }

        console.log('👨‍🏫 Instructor batches data:', data);
        setBatches(data || []);
      } else {
        // Fetch all batches for admins
        const { data, error } = await supabase
          .from('batches')
          .select(`
            *,
            instructor:profiles!instructor_id(*)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching admin batches:', error);
          throw error;
        }

        console.log('👑 Admin batches data:', data);
        setBatches(data || []);
      }

      console.log('✅ Batches loaded successfully:', batches.length);

    } catch (err: any) {
      console.error('❌ Error in fetchBatches:', err);
      setError(err.message || 'Failed to load batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [user]);

  return { 
    batches, 
    loading, 
    error, 
    refetch: fetchBatches 
  };
};