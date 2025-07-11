import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AttendancePageProps {
  token: string;
}

const AttendancePage: React.FC<AttendancePageProps> = ({ token }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attended, setAttended] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        
        // Fetch session by token
        const { data: sessionData, error: sessionError } = await supabase
          .from('attendance_sessions')
          .select(`
            *,
            batches!inner(
              name,
              description
            )
          `)
          .eq('attendance_token', token)
          .single();

        if (sessionError) throw sessionError;

        setSession(sessionData);

        // Check if user already attended
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', user.email)
            .single();

          if (profileData) {
            const { data: recordData } = await supabase
              .from('attendance_records')
              .select('attended')
              .eq('session_id', sessionData.id)
              .eq('student_id', profileData.id)
              .maybeSingle();

            if (recordData) {
              setAttended(recordData.attended);
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching session:', err);
        setError('Sesi absensi tidak ditemukan atau sudah tidak aktif.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [token, user]);

  const handleAttendance = async () => {
    if (!user || !session) return;

    try {
      setSubmitting(true);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .single();

      if (profileError) throw profileError;

      // Check if session is still active
      if (session.status !== 'active') {
        setError('Sesi absensi sudah tidak aktif.');
        return;
      }

      // Record attendance
      const { error } = await supabase
        .from('attendance_records')
        .upsert({
          session_id: session.id,
          student_id: profileData.id,
          attended: true,
          attended_at: new Date().toISOString()
        }, {
          onConflict: 'session_id,student_id'
        });

      if (error) throw error;

      setAttended(true);
    } catch (err: any) {
      console.error('Error recording attendance:', err);
      setError('Gagal mencatat absensi. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat sesi absensi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <Users className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Diperlukan</h1>
          <p className="text-gray-600 mb-6">
            Anda harus login terlebih dahulu untuk melakukan absensi.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
          >
            Login Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Absensi Kelas</h1>
          <p className="text-gray-600">{session?.batches?.name}</p>
        </div>

        {/* Session Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">{session?.title}</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{new Date(session?.session_date).toLocaleDateString('id-ID')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{session?.start_time} - {session?.end_time}</span>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Siswa:</span> {user.full_name}
          </p>
          <p className="text-sm text-blue-600">{user.email}</p>
        </div>

        {/* Attendance Status */}
        {attended ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">Absensi Berhasil!</h3>
            <p className="text-green-700 text-sm">
              Anda telah tercatat hadir dalam sesi ini.
            </p>
          </div>
        ) : session?.status === 'active' ? (
          <div className="text-center">
            <button
              onClick={handleAttendance}
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Mencatat absensi...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Absen Sekarang</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-3">
              Klik tombol di atas untuk mencatat kehadiran Anda
            </p>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Sesi Tidak Aktif</h3>
            <p className="text-red-700 text-sm">
              Sesi absensi ini sudah tidak aktif atau belum dimulai.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <button
            onClick={() => window.close()}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Tutup halaman ini
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;