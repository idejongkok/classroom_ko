import React, { useState } from 'react';
import { Plus, Users, BookOpen, User, UserPlus, Edit, Trash2, Save, X, Calendar, Mail, Send, AlertTriangle, UserMinus } from 'lucide-react';
import { useBatches } from '../hooks/useBatches';
import { useProfiles } from '../hooks/useProfiles';
import { supabase } from '../lib/supabase';
import { Batch } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'instructors'>('classes');
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteBatchConfirm, setShowDeleteBatchConfirm] = useState<string | null>(null);
  const [showManageEnrollments, setShowManageEnrollments] = useState<string | null>(null);
  const { user } = useAuth();

  const { batches, loading: batchesLoading, refetch: refetchBatches } = useBatches();
  const { profiles, loading: profilesLoading, refetch: refetchProfiles } = useProfiles();

  const students = profiles.filter(p => p.role === 'student');
  const instructors = profiles.filter(p => p.role === 'instructor');

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      setDeletingUserId(userId);

      // First, delete from users table (if exists)
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('email', userEmail);

      // Note: We don't throw error here because user might not exist in users table

      // Then delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      // Refresh the profiles list
      await refetchProfiles();
      setShowDeleteConfirm(null);
      
      alert('User berhasil dihapus');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Gagal menghapus user: ' + (error.message || 'Unknown error'));
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    try {
      setDeletingBatchId(batchId);

      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchId);

      if (error) {
        throw error;
      }

      await refetchBatches();
      setShowDeleteBatchConfirm(null);
      
      alert('Kelas berhasil dihapus');
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      alert('Gagal menghapus kelas: ' + (error.message || 'Unknown error'));
    } finally {
      setDeletingBatchId(null);
    }
  };

  const DeleteConfirmModal: React.FC<{ 
    userId: string; 
    userName: string; 
    userEmail: string;
    onClose: () => void; 
    onConfirm: () => void;
  }> = ({ userId, userName, userEmail, onClose, onConfirm }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Konfirmasi Hapus</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Apakah Anda yakin ingin menghapus user berikut?
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <p className="font-semibold text-gray-900">{userName}</p>
              <p className="text-sm text-gray-600">{userEmail}</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">Peringatan!</p>
                <p className="text-sm text-red-700 mt-1">
                  Tindakan ini tidak dapat dibatalkan. Semua data terkait user ini akan dihapus secara permanen.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onConfirm}
              disabled={deletingUserId === userId}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deletingUserId === userId ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Ya, Hapus</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={deletingUserId === userId}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const DeleteBatchConfirmModal: React.FC<{ 
    batchId: string; 
    batchName: string; 
    onClose: () => void; 
    onConfirm: () => void;
  }> = ({ batchId, batchName, onClose, onConfirm }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Konfirmasi Hapus Kelas</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Apakah Anda yakin ingin menghapus kelas berikut?
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <p className="font-semibold text-gray-900">{batchName}</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">Peringatan!</p>
                <p className="text-sm text-red-700 mt-1">
                  Tindakan ini tidak dapat dibatalkan. Semua data terkait kelas ini (materi, tugas, absensi, dll) akan dihapus secara permanen.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onConfirm}
              disabled={deletingBatchId === batchId}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deletingBatchId === batchId ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Ya, Hapus Kelas</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={deletingBatchId === batchId}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ManageEnrollmentsModal: React.FC<{ 
    batch: Batch; 
    onClose: () => void; 
  }> = ({ batch, onClose }) => {
    const [enrolledStudents, setEnrolledStudents] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    React.useEffect(() => {
      const fetchEnrolledStudents = async () => {
        try {
          const { data } = await supabase
            .from('batch_enrollments')
            .select('student_id')
            .eq('batch_id', batch.id);
          
          if (data) {
            setEnrolledStudents(data.map(e => e.student_id));
          }
        } catch (error) {
          console.error('Error fetching enrolled students:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchEnrolledStudents();
    }, [batch.id]);

    const handleRemoveStudent = async (studentId: string) => {
      try {
        setUpdating(true);
        
        const { error } = await supabase
          .from('batch_enrollments')
          .delete()
          .eq('batch_id', batch.id)
          .eq('student_id', studentId);

        if (error) throw error;

        setEnrolledStudents(prev => prev.filter(id => id !== studentId));
        alert('Siswa berhasil dihapus dari kelas');
      } catch (error: any) {
        console.error('Error removing student:', error);
        alert('Gagal menghapus siswa dari kelas: ' + (error.message || 'Unknown error'));
      } finally {
        setUpdating(false);
      }
    };

    const enrolledStudentProfiles = students.filter(s => enrolledStudents.includes(s.id));

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Kelola Siswa - {batch.name}</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat data siswa...</p>
              </div>
            ) : enrolledStudentProfiles.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada siswa yang terdaftar di kelas ini</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Siswa Terdaftar ({enrolledStudentProfiles.length})
                </h3>
                {enrolledStudentProfiles.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.full_name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
                      disabled={updating}
                      className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <UserMinus className="h-4 w-4" />
                      <span className="text-sm">Hapus</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CreateClassForm: React.FC<{ onClose: () => void; batch?: Batch }> = ({ onClose, batch }) => {
    const [formData, setFormData] = useState({
      name: batch?.name || '',
      description: batch?.description || '',
      color_from: batch?.color_from || 'from-blue-500',
      color_to: batch?.color_to || 'to-blue-600',
      instructor_id: batch?.instructor_id || '',
      start_date: batch?.start_date || '',
      end_date: batch?.end_date || ''
    });

    const colorOptions = [
      { from: 'from-blue-500', to: 'to-blue-600', name: 'Biru' },
      { from: 'from-green-500', to: 'to-green-600', name: 'Hijau' },
      { from: 'from-purple-500', to: 'to-purple-600', name: 'Ungu' },
      { from: 'from-red-500', to: 'to-red-600', name: 'Merah' },
      { from: 'from-orange-500', to: 'to-orange-600', name: 'Orange' },
      { from: 'from-pink-500', to: 'to-pink-600', name: 'Pink' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        if (batch) {
          const { error } = await supabase
            .from('batches')
            .update(formData)
            .eq('id', batch.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('batches')
            .insert([formData]);

          if (error) throw error;
        }

        await refetchBatches();
        onClose();
      } catch (error) {
        console.error('Error saving batch:', error);
        alert('Gagal menyimpan kelas. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {batch ? 'Edit Kelas' : 'Buat Kelas Baru'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Kelas
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Masukkan nama kelas"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Deskripsi kelas"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mentor
              </label>
              <select
                value={formData.instructor_id}
                onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">Pilih Mentor</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Warna Tema
              </label>
              <div className="grid grid-cols-3 gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.from}
                    type="button"
                    onClick={() => setFormData({ ...formData, color_from: color.from, color_to: color.to })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.color_from === color.from
                        ? 'border-orange-500 ring-2 ring-orange-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`h-8 w-full rounded-lg bg-gradient-to-r ${color.from} ${color.to} mb-2`}></div>
                    <p className="text-sm font-medium text-gray-700">{color.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Menyimpan...' : batch ? 'Update Kelas' : 'Buat Kelas'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const CreateUserForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState({
      email: '',
      full_name: '',
      role: 'student' as 'student' | 'instructor' | 'admin'
    });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSending(true);

      try {
        // Prepare the payload - only include created_by if user.id exists and is valid
        const payload: any = {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role
        };

        // Only include created_by if we have a valid user ID that exists in profiles table
        if (user?.id && user.id.trim() !== '') {
          // Verify the user exists in profiles table first
          const { data: profileExists } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (profileExists) {
            payload.created_by = user.id;
          }
        }

        // Send invitation via edge function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal mengirim undangan');
        }

        alert('Undangan berhasil dikirim! User akan menerima email untuk mengatur password.');
        await refetchProfiles();
        onClose();
      } catch (error: any) {
        console.error('Error sending invitation:', error);
        alert(error.message || 'Gagal mengirim undangan. Silakan coba lagi.');
      } finally {
        setSending(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Undang User Baru</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nama lengkap"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="student">Siswa</option>
                <option value="instructor">Mentor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Undangan Email</p>
                  <p className="text-xs text-blue-700 mt-1">
                    User akan menerima email undangan untuk mengatur password dan mengakses akun mereka.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <button
                type="submit"
                disabled={sending}
                className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>{sending ? 'Mengirim...' : 'Kirim Undangan'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const EnrollStudentModal: React.FC<{ batch: Batch; onClose: () => void }> = ({ batch, onClose }) => {
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [enrolledStudents, setEnrolledStudents] = useState<string[]>([]);

    React.useEffect(() => {
      const fetchEnrolledStudents = async () => {
        const { data } = await supabase
          .from('batch_enrollments')
          .select('student_id')
          .eq('batch_id', batch.id);
        
        if (data) {
          setEnrolledStudents(data.map(e => e.student_id));
        }
      };

      fetchEnrolledStudents();
    }, [batch.id]);

    const handleEnroll = async () => {
      setLoading(true);
      try {
        const enrollments = selectedStudents.map(studentId => ({
          batch_id: batch.id,
          student_id: studentId
        }));

        const { error } = await supabase
          .from('batch_enrollments')
          .insert(enrollments);

        if (error) throw error;

        onClose();
      } catch (error) {
        console.error('Error enrolling students:', error);
        alert('Gagal mendaftarkan siswa. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    const availableStudents = students.filter(s => !enrolledStudents.includes(s.id));

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Daftarkan Siswa</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Kelas: {batch.name}</p>
          </div>

          <div className="p-6">
            <div className="space-y-3 mb-6">
              {availableStudents.map((student) => (
                <label key={student.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents([...selectedStudents, student.id]);
                      } else {
                        setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                      }
                    }}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{student.full_name}</p>
                    <p className="text-sm text-gray-600">{student.email}</p>
                  </div>
                </label>
              ))}
            </div>

            {availableStudents.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Semua siswa sudah terdaftar di kelas ini
              </p>
            )}

            <div className="flex items-center space-x-4">
              <button
                onClick={handleEnroll}
                disabled={loading || selectedStudents.length === 0}
                className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>{loading ? 'Mendaftarkan...' : `Daftarkan (${selectedStudents.length})`}</span>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'classes', label: 'Kelola Kelas', icon: BookOpen, count: batches.length },
    { id: 'students', label: 'Siswa', icon: Users, count: students.length },
    { id: 'instructors', label: 'Mentor', icon: User, count: instructors.length }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Kelola kelas, siswa, dan mentor</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Kembali ke Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'classes' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Daftar Kelas</h2>
            <button
              onClick={() => setShowCreateClass(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Kelas Baru</span>
            </button>
          </div>

          {batchesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-64 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map((batch) => (
                <div key={batch.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className={`h-24 bg-gradient-to-r ${batch.color_from} ${batch.color_to} p-6 flex items-end`}>
                    <h3 className="font-bold text-lg text-white">{batch.name}</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4">{batch.description}</p>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span>{batch.instructor?.full_name || 'Belum ada mentor'}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(batch.start_date).toLocaleDateString('id-ID')} - {new Date(batch.end_date).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingBatch(batch)}
                          className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <EnrollStudentButton batch={batch} />
                        <button
                          onClick={() => setShowManageEnrollments(batch.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Users className="h-4 w-4" />
                          <span>Kelola</span>
                        </button>
                      </div>
                      <button
                        onClick={() => setShowDeleteBatchConfirm(batch.id)}
                        disabled={deletingBatchId === batch.id}
                        className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingBatchId === batch.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Daftar Siswa</h2>
            <button
              onClick={() => setShowCreateUser(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Undang Siswa</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nama</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tanggal Daftar</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">{student.full_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(student.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setShowDeleteConfirm(student.id)}
                          disabled={deletingUserId === student.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                        >
                          {deletingUserId === student.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'instructors' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Daftar Mentor</h2>
            <button
              onClick={() => setShowCreateUser(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Undang Mentor</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nama</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tanggal Daftar</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {instructors.map((instructor) => (
                    <tr key={instructor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">{instructor.full_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{instructor.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(instructor.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setShowDeleteConfirm(instructor.id)}
                          disabled={deletingUserId === instructor.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                        >
                          {deletingUserId === instructor.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateClass && (
        <CreateClassForm onClose={() => setShowCreateClass(false)} />
      )}

      {editingBatch && (
        <CreateClassForm 
          batch={editingBatch} 
          onClose={() => setEditingBatch(null)} 
        />
      )}

      {showCreateUser && (
        <CreateUserForm onClose={() => setShowCreateUser(false)} />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          userId={showDeleteConfirm}
          userName={profiles.find(p => p.id === showDeleteConfirm)?.full_name || ''}
          userEmail={profiles.find(p => p.id === showDeleteConfirm)?.email || ''}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => {
            const profile = profiles.find(p => p.id === showDeleteConfirm);
            if (profile) {
              handleDeleteUser(profile.id, profile.email);
            }
          }}
        />
      )}

      {/* Delete Batch Confirmation Modal */}
      {showDeleteBatchConfirm && (
        <DeleteBatchConfirmModal
          batchId={showDeleteBatchConfirm}
          batchName={batches.find(b => b.id === showDeleteBatchConfirm)?.name || ''}
          onClose={() => setShowDeleteBatchConfirm(null)}
          onConfirm={() => {
            if (showDeleteBatchConfirm) {
              handleDeleteBatch(showDeleteBatchConfirm);
            }
          }}
        />
      )}

      {/* Manage Enrollments Modal */}
      {showManageEnrollments && (
        <ManageEnrollmentsModal
          batch={batches.find(b => b.id === showManageEnrollments)!}
          onClose={() => setShowManageEnrollments(null)}
        />
      )}
    </div>
  );

  function EnrollStudentButton({ batch }: { batch: Batch }) {
    const [showEnrollModal, setShowEnrollModal] = useState(false);

    return (
      <>
        <button
          onClick={() => setShowEnrollModal(true)}
          className="flex items-center space-x-1 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span>Daftarkan</span>
        </button>

        {showEnrollModal && (
          <EnrollStudentModal 
            batch={batch} 
            onClose={() => setShowEnrollModal(false)} 
          />
        )}
      </>
    );
  }
};

export default AdminPanel;