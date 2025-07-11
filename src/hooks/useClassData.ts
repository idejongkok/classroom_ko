import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useClassData = (batchId: string) => {
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClassData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching class data for user:', user?.email, user?.role);

      // First, get the user's profile to get the correct profile ID and role
      let userProfile = null;
      if (user?.email) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        userProfile = profile;
        console.log('👤 User profile:', userProfile);
      }

      // Fetch batch details
      const { data: batch, error: batchError } = await supabase
        .from('batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batchError) throw batchError;

      // Fetch materials
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false });

      if (materialsError) throw materialsError;

      // Fetch video recordings
      const { data: recordings, error: recordingsError } = await supabase
        .from('video_recordings')
        .select('*')
        .eq('batch_id', batchId)
        .order('recorded_date', { ascending: false });

      if (recordingsError) throw recordingsError;

      // Fetch assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('batch_id', batchId)
        .order('due_date', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      // Fetch assignment submissions
      let assignmentsWithSubmissions = assignments;
      if (userProfile) {
        const assignmentIds = assignments.map(a => a.id);
        if (assignmentIds.length > 0) {
          if (userProfile.role === 'student') {
            // For students, only fetch their own submissions
            const { data: submissions, error: submissionsError } = await supabase
              .from('assignment_submissions')
              .select('*')
              .in('assignment_id', assignmentIds)
              .eq('student_id', userProfile.id);

            if (submissionsError) throw submissionsError;

            assignmentsWithSubmissions = assignments.map(assignment => ({
              ...assignment,
              submission: submissions?.find(s => s.assignment_id === assignment.id)
            }));
          } else if (userProfile.role === 'instructor' || userProfile.role === 'admin') {
            // For instructors and admins, fetch all submissions for review
            const { data: submissions, error: submissionsError } = await supabase
              .from('assignment_submissions')
              .select(`
                *,
                student:profiles!student_id(full_name, email)
              `)
              .in('assignment_id', assignmentIds);

            if (submissionsError) throw submissionsError;

            assignmentsWithSubmissions = assignments.map(assignment => {
              const assignmentSubmissions = submissions?.filter(s => s.assignment_id === assignment.id) || [];
              return {
                ...assignment,
                submissions: assignmentSubmissions,
                // For backward compatibility, include the first submission as 'submission'
                submission: assignmentSubmissions[0] || null
              };
            });
          }
        }
      }

      // Fetch attendance sessions
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('batch_id', batchId)
        .order('session_date', { ascending: false });

      if (attendanceError) throw attendanceError;

      // Fetch attendance records
      let attendanceWithRecords = attendance;
      if (userProfile) {
        const sessionIds = attendance.map(s => s.id);
        if (sessionIds.length > 0) {
          if (userProfile.role === 'student') {
            // For students, only fetch their own attendance records
            const { data: records, error: recordsError } = await supabase
              .from('attendance_records')
              .select('*')
              .in('session_id', sessionIds)
              .eq('student_id', userProfile.id);

            if (recordsError) throw recordsError;

            attendanceWithRecords = attendance.map(session => ({
              ...session,
              attendance_record: records?.find(r => r.session_id === session.id)
            }));
          } else if (userProfile.role === 'instructor' || userProfile.role === 'admin') {
            // For instructors and admins, fetch all attendance records for the sessions
            const { data: records, error: recordsError } = await supabase
              .from('attendance_records')
              .select(`
                *,
                student:profiles!student_id(full_name, email)
              `)
              .in('session_id', sessionIds);

            if (recordsError) throw recordsError;

            attendanceWithRecords = attendance.map(session => {
              const sessionRecords = records?.filter(r => r.session_id === session.id) || [];
              return {
                ...session,
                attendance_records: sessionRecords,
                // Count attendance stats
                total_students: sessionRecords.length,
                attended_count: sessionRecords.filter(r => r.attended).length
              };
            });
          }
        }
      }

      console.log('✅ Class data loaded successfully');
      console.log('📊 Assignments with submissions:', assignmentsWithSubmissions);
      console.log('📋 Attendance with records:', attendanceWithRecords);

      setClassData({
        batch,
        materials: materials || [],
        recordings: recordings || [],
        assignments: assignmentsWithSubmissions || [],
        attendance: attendanceWithRecords || [],
        userProfile
      });
    } catch (err: any) {
      console.error('❌ Error fetching class data:', err);
      setError(err.message || 'Failed to fetch class data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (batchId) {
      fetchClassData();
    }
  }, [batchId, user]);

  return {
    classData,
    loading,
    error,
    refetch: fetchClassData
  };
};