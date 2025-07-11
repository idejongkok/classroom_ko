import React, { useState } from 'react';
import { ArrowLeft, FileText, Video, CheckSquare, Users, Download, Upload, Calendar, Clock, CheckCircle, XCircle, ExternalLink, AlertCircle, Eye, MessageSquare, RotateCcw, Share2, Copy, Link, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useClassData } from '../hooks/useClassData';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ClassDetailProps {
  batchId: string;
  onBack: () => void;
}

const ClassDetail: React.FC<ClassDetailProps> = ({ batchId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'recordings' | 'assignments' | 'attendance'>('materials');
  const { classData, loading, error, refetch } = useClassData(batchId);
  const { user } = useAuth();
  const [reviewingSubmission, setReviewingSubmission] = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'returned'>('reviewed');

  // Modal states
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [showCreateRecording, setShowCreateRecording] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showCreateAttendance, setShowCreateAttendance] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingType, setEditingType] = useState<'material' | 'recording' | 'assignment' | 'attendance' | null>(null);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700">{error || 'Class not found'}</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const tabs = [
    { id: 'materials', label: 'Materi', icon: FileText, count: classData.materials.length },
    { id: 'recordings', label: 'Rekaman', icon: Video, count: classData.recordings.length },
    { id: 'assignments', label: 'Tugas', icon: CheckSquare, count: classData.assignments.length },
    { id: 'attendance', label: 'Absensi', icon: Users, count: classData.attendance.length },
  ];

  // CRUD Functions
  const handleCreateMaterial = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('materials')
        .insert([{
          ...formData,
          batch_id: batchId,
          uploaded_by: user?.id
        }]);

      if (error) throw error;
      await refetch();
      setShowCreateMaterial(false);
    } catch (error) {
      console.error('Error creating material:', error);
      alert('Gagal membuat materi. Silakan coba lagi.');
    }
  };

  const handleUpdateMaterial = async (id: string, formData: any) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
      await refetch();
      setEditingItem(null);
      setEditingType(null);
    } catch (error) {
      console.error('Error updating material:', error);
      alert('Gagal mengupdate materi. Silakan coba lagi.');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;
    
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Gagal menghapus materi. Silakan coba lagi.');
    }
  };

  const handleCreateRecording = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('video_recordings')
        .insert([{
          ...formData,
          batch_id: batchId,
          uploaded_by: user?.id
        }]);

      if (error) throw error;
      await refetch();
      setShowCreateRecording(false);
    } catch (error) {
      console.error('Error creating recording:', error);
      alert('Gagal membuat rekaman. Silakan coba lagi.');
    }
  };

  const handleUpdateRecording = async (id: string, formData: any) => {
    try {
      const { error } = await supabase
        .from('video_recordings')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
      await refetch();
      setEditingItem(null);
      setEditingType(null);
    } catch (error) {
      console.error('Error updating recording:', error);
      alert('Gagal mengupdate rekaman. Silakan coba lagi.');
    }
  };

  const handleDeleteRecording = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus rekaman ini?')) return;
    
    try {
      const { error } = await supabase
        .from('video_recordings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error('Error deleting recording:', error);
      alert('Gagal menghapus rekaman. Silakan coba lagi.');
    }
  };

  const handleCreateAssignment = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .insert([{
          ...formData,
          batch_id: batchId,
          created_by: user?.id
        }]);

      if (error) throw error;
      await refetch();
      setShowCreateAssignment(false);
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Gagal membuat tugas. Silakan coba lagi.');
    }
  };

  const handleUpdateAssignment = async (id: string, formData: any) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
      await refetch();
      setEditingItem(null);
      setEditingType(null);
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Gagal mengupdate tugas. Silakan coba lagi.');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini? Semua submission akan ikut terhapus.')) return;
    
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Gagal menghapus tugas. Silakan coba lagi.');
    }
  };

  const handleCreateAttendance = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('attendance_sessions')
        .insert([{
          ...formData,
          batch_id: batchId,
          created_by: user?.id
        }]);

      if (error) throw error;
      await refetch();
      setShowCreateAttendance(false);
    } catch (error) {
      console.error('Error creating attendance session:', error);
      alert('Gagal membuat sesi absensi. Silakan coba lagi.');
    }
  };

  const handleUpdateAttendance = async (id: string, formData: any) => {
    try {
      const { error } = await supabase
        .from('attendance_sessions')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
      await refetch();
      setEditingItem(null);
      setEditingType(null);
    } catch (error) {
      console.error('Error updating attendance session:', error);
      alert('Gagal mengupdate sesi absensi. Silakan coba lagi.');
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sesi absensi ini?')) return;
    
    try {
      const { error } = await supabase
        .from('attendance_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error('Error deleting attendance session:', error);
      alert('Gagal menghapus sesi absensi. Silakan coba lagi.');
    }
  };

  const handleReviewSubmission = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          status: reviewStatus,
          feedback: reviewFeedback,
          graded_at: new Date().toISOString(),
          graded_by: user?.id
        })
        .eq('id', submissionId);

      if (error) throw error;

      setReviewingSubmission(null);
      setReviewFeedback('');
      await refetch();
    } catch (error) {
      console.error('Error reviewing submission:', error);
      alert('Gagal mereview tugas. Silakan coba lagi.');
    }
  };

  const generateAttendanceLink = async (sessionId: string) => {
    try {
      const token = `attend_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('attendance_sessions')
        .update({
          attendance_token: token,
          attendance_link: `${window.location.origin}/attend/${token}`
        })
        .eq('id', sessionId);

      if (error) throw error;

      await refetch();
    } catch (error) {
      console.error('Error generating attendance link:', error);
      alert('Gagal membuat link absensi. Silakan coba lagi.');
    }
  };

  const copyAttendanceLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Link absensi berhasil disalin!');
  };

  // Form Components
  const MaterialForm: React.FC<{ material?: any; onSubmit: (data: any) => void; onClose: () => void }> = ({ material, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
      title: material?.title || '',
      type: material?.type || 'pdf',
      file_url: material?.file_url || '',
      external_url: material?.external_url || '',
      file_size: material?.file_size || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {material ? 'Edit Materi' : 'Tambah Materi'}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Judul</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipe</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="pdf">PDF</option>
                <option value="link">Link</option>
                <option value="file">File</option>
              </select>
            </div>
            {formData.type === 'link' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">URL</label>
                <input
                  type="url"
                  value={formData.external_url}
                  onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">File URL</label>
                  <input
                    type="url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ukuran File</label>
                  <input
                    type="text"
                    value={formData.file_size}
                    onChange={(e) => setFormData({ ...formData, file_size: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., 2.5 MB"
                  />
                </div>
              </>
            )}
            <div className="flex items-center space-x-4 pt-4">
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{material ? 'Update' : 'Simpan'}</span>
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

  const RecordingForm: React.FC<{ recording?: any; onSubmit: (data: any) => void; onClose: () => void }> = ({ recording, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
      title: recording?.title || '',
      description: recording?.description || '',
      youtube_id: recording?.youtube_id || '',
      duration: recording?.duration || '',
      recorded_date: recording?.recorded_date || new Date().toISOString().split('T')[0]
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {recording ? 'Edit Rekaman' : 'Tambah Rekaman'}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Judul</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">YouTube ID</label>
              <input
                type="text"
                value={formData.youtube_id}
                onChange={(e) => setFormData({ ...formData, youtube_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., dQw4w9WgXcQ"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Durasi</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., 45 menit"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Rekaman</label>
              <input
                type="date"
                value={formData.recorded_date}
                onChange={(e) => setFormData({ ...formData, recorded_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div className="flex items-center space-x-4 pt-4">
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{recording ? 'Update' : 'Simpan'}</span>
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

  const AssignmentForm: React.FC<{ assignment?: any; onSubmit: (data: any) => void; onClose: () => void }> = ({ assignment, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
      title: assignment?.title || '',
      description: assignment?.description || '',
      due_date: assignment?.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : '',
      max_score: assignment?.max_score || 100
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {assignment ? 'Edit Tugas' : 'Buat Tugas'}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Judul Tugas</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Deadline</label>
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nilai Maksimal</label>
              <input
                type="number"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                min="1"
                required
              />
            </div>
            <div className="flex items-center space-x-4 pt-4">
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{assignment ? 'Update' : 'Simpan'}</span>
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

  const AttendanceForm: React.FC<{ attendance?: any; onSubmit: (data: any) => void; onClose: () => void }> = ({ attendance, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
      title: attendance?.title || '',
      session_date: attendance?.session_date || new Date().toISOString().split('T')[0],
      start_time: attendance?.start_time || '09:00',
      end_time: attendance?.end_time || '11:00',
      status: attendance?.status || 'upcoming'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {attendance ? 'Edit Sesi Absensi' : 'Buat Sesi Absensi'}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Judul Sesi</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal</label>
              <input
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jam Mulai</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jam Selesai</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="upcoming">Akan Datang</option>
                <option value="active">Aktif</option>
                <option value="completed">Selesai</option>
              </select>
            </div>
            <div className="flex items-center space-x-4 pt-4">
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{attendance ? 'Update' : 'Simpan'}</span>
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

  const MaterialsTab: React.FC = () => (
    <div className="space-y-4">
      {isInstructor && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Kelola Materi</h3>
              <p className="text-sm text-blue-700">Tambah materi pembelajaran untuk kelas ini</p>
            </div>
            <button 
              onClick={() => setShowCreateMaterial(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Materi</span>
            </button>
          </div>
        </div>
      )}

      {classData.materials.map((material) => (
        <div key={material.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                material.type === 'pdf' ? 'bg-red-100' :
                material.type === 'link' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                {material.type === 'pdf' ? (
                  <FileText className={`h-6 w-6 ${
                    material.type === 'pdf' ? 'text-red-600' :
                    material.type === 'link' ? 'text-blue-600' : 'text-green-600'
                  }`} />
                ) : material.type === 'link' ? (
                  <ExternalLink className="h-6 w-6 text-blue-600" />
                ) : (
                  <Download className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{material.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="capitalize">{material.type === 'link' ? 'Link Eksternal' : material.type.toUpperCase()}</span>
                  {material.file_size && <span>{material.file_size}</span>}
                  <span>{new Date(material.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200"
                onClick={() => window.open(material.external_url || material.file_url || '#', '_blank')}
              >
                <Download className="h-4 w-4" />
                <span>{material.type === 'link' ? 'Buka' : 'Download'}</span>
              </button>
              {isInstructor && (
                <>
                  <button 
                    onClick={() => {
                      setEditingItem(material);
                      setEditingType('material');
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      {classData.materials.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada materi yang tersedia</p>
        </div>
      )}
    </div>
  );

  const RecordingsTab: React.FC = () => (
    <div className="space-y-4">
      {isInstructor && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-900">Kelola Rekaman</h3>
              <p className="text-sm text-purple-700">Tambah rekaman video pembelajaran</p>
            </div>
            <button 
              onClick={() => setShowCreateRecording(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Rekaman</span>
            </button>
          </div>
        </div>
      )}

      {classData.recordings.map((recording) => (
        <div key={recording.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="aspect-video bg-gray-900 relative group">
            <iframe
              src={`https://www.youtube.com/embed/${recording.youtube_id}?rel=0&modestbranding=1&controls=1`}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{recording.title}</h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{recording.description}</p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  {recording.duration && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{recording.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(recording.recorded_date).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>
              {isInstructor && (
                <div className="flex items-center space-x-2 ml-4">
                  <button 
                    onClick={() => {
                      setEditingItem(recording);
                      setEditingType('recording');
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteRecording(recording.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {classData.recordings.length === 0 && (
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada rekaman yang tersedia</p>
        </div>
      )}
    </div>
  );

  const AssignmentsTab: React.FC = () => (
    <div className="space-y-4">
      {isInstructor && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">Kelola Tugas</h3>
              <p className="text-sm text-green-700">Buat dan kelola tugas untuk siswa</p>
            </div>
            <button 
              onClick={() => setShowCreateAssignment(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Tugas</span>
            </button>
          </div>
        </div>
      )}

      {classData.assignments.map((assignment) => {
        const submission = assignment.submission;
        const submissions = assignment.submissions || [];
        const status = submission?.status || 'pending';
        
        return (
          <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                  {isStudent && (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      status === 'reviewed' ? 'bg-green-100 text-green-800' :
                      status === 'returned' ? 'bg-red-100 text-red-800' :
                      status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {status === 'reviewed' ? 'Diterima' :
                       status === 'returned' ? 'Dikembalikan' :
                       status === 'submitted' ? 'Dikumpulkan' : 'Belum Dikumpulkan'}
                    </span>
                  )}
                  {isInstructor && submissions.length > 0 && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {submissions.length} Submission{submissions.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{assignment.description}</p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Deadline: {new Date(assignment.due_date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckSquare className="h-4 w-4" />
                    <span>Max Score: {assignment.max_score}</span>
                  </div>
                </div>
              </div>
              {isInstructor && (
                <div className="flex items-center space-x-2 ml-4">
                  <button 
                    onClick={() => {
                      setEditingItem(assignment);
                      setEditingType('assignment');
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteAssignment(assignment.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Student View */}
            {isStudent && (
              <>
                {status === 'reviewed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">Tugas Diterima</span>
                    </div>
                    {submission?.feedback && (
                      <p className="text-green-700 text-sm">{submission.feedback}</p>
                    )}
                  </div>
                )}

                {status === 'returned' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <RotateCcw className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-800">Tugas Dikembalikan - Perlu Perbaikan</span>
                    </div>
                    {submission?.feedback && (
                      <p className="text-red-700 text-sm">{submission.feedback}</p>
                    )}
                  </div>
                )}

                {status === 'submitted' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Tugas telah dikumpulkan - Menunggu review</span>
                    </div>
                    {submission?.file_url && (
                      <p className="text-blue-700 text-sm mt-1">File: {submission.file_url.split('/').pop()}</p>
                    )}
                  </div>
                )}

                {(status === 'pending' || status === 'returned') && (
                  <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200">
                      <Upload className="h-4 w-4" />
                      <span>{status === 'returned' ? 'Upload Ulang' : 'Upload Tugas'}</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Instructor View */}
            {isInstructor && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Submissions ({submissions.length})</h4>
                
                {submissions.length === 0 ? (
                  <p className="text-gray-500 text-sm">Belum ada submission</p>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{sub.student?.full_name}</p>
                            <p className="text-sm text-gray-600">{sub.student?.email}</p>
                            <p className="text-xs text-gray-500">
                              Dikumpulkan: {new Date(sub.submitted_at).toLocaleDateString('id-ID')}
                            </p>
                            {sub.file_url && (
                              <p className="text-xs text-blue-600 mt-1">File: {sub.file_url.split('/').pop()}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              sub.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                              sub.status === 'returned' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {sub.status === 'reviewed' ? 'Diterima' :
                               sub.status === 'returned' ? 'Dikembalikan' : 'Menunggu Review'}
                            </span>
                            {sub.status === 'submitted' && (
                              <button
                                onClick={() => setReviewingSubmission(sub.id)}
                                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Review</span>
                              </button>
                            )}
                          </div>
                        </div>
                        {sub.feedback && (
                          <div className="mt-2 p-2 bg-white rounded border">
                            <p className="text-sm text-gray-700">{sub.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {classData.assignments.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada tugas yang tersedia</p>
        </div>
      )}

      {/* Review Modal */}
      {reviewingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Review Tugas</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status Review
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="reviewed"
                      checked={reviewStatus === 'reviewed'}
                      onChange={(e) => setReviewStatus(e.target.value as 'reviewed' | 'returned')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900">Terima Tugas</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="returned"
                      checked={reviewStatus === 'returned'}
                      onChange={(e) => setReviewStatus(e.target.value as 'reviewed' | 'returned')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900">Kembalikan untuk Perbaikan</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Komentar
                </label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Berikan komentar untuk siswa..."
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={() => handleReviewSubmission(reviewingSubmission)}
                  className={`flex items-center space-x-2 px-6 py-3 text-white rounded-xl transition-colors ${
                    reviewStatus === 'reviewed' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{reviewStatus === 'reviewed' ? 'Terima Tugas' : 'Kembalikan Tugas'}</span>
                </button>
                <button
                  onClick={() => {
                    setReviewingSubmission(null);
                    setReviewFeedback('');
                    setReviewStatus('reviewed');
                  }}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const AttendanceTab: React.FC = () => (
    <div className="space-y-4">
      {isInstructor && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-orange-900">Kelola Absensi</h3>
              <p className="text-sm text-orange-700">Buat sesi absensi dan pantau kehadiran siswa</p>
            </div>
            <button 
              onClick={() => setShowCreateAttendance(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Sesi Absensi</span>
            </button>
          </div>
        </div>
      )}

      {classData.attendance.map((session) => {
        const attendanceRecord = session.attendance_record;
        const attendanceRecords = session.attendance_records || [];
        
        return (
          <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  session.status === 'completed' ? 'bg-gray-100' :
                  session.status === 'active' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {session.status === 'completed' ? (
                    isStudent && attendanceRecord?.attended ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : isStudent && !attendanceRecord?.attended ? (
                      <XCircle className="h-6 w-6 text-red-600" />
                    ) : (
                      <Users className="h-6 w-6 text-gray-600" />
                    )
                  ) : session.status === 'active' ? (
                    <Clock className="h-6 w-6 text-green-600" />
                  ) : (
                    <Calendar className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{session.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{new Date(session.session_date).toLocaleDateString('id-ID')}</span>
                    <span>{session.start_time} - {session.end_time}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      session.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      session.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {session.status === 'completed' ? 'Selesai' :
                       session.status === 'active' ? 'Berlangsung' : 'Akan Datang'}
                    </span>
                  </div>
                  {isInstructor && session.status === 'completed' && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span>Kehadiran: {session.attended_count || 0}/{session.total_students || 0} siswa</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Instructor Controls */}
                {isInstructor && (
                  <>
                    <button 
                      onClick={() => {
                        setEditingItem(session);
                        setEditingType('attendance');
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {session.status === 'active' && !session.attendance_link && (
                      <button
                        onClick={() => generateAttendanceLink(session.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Buat Link Absensi</span>
                      </button>
                    )}

                    {session.attendance_link && (
                      <button
                        onClick={() => copyAttendanceLink(session.attendance_link!)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Salin Link</span>
                      </button>
                    )}
                  </>
                )}

                {/* Student Controls */}
                {isStudent && (
                  <>
                    {session.status === 'active' && session.attendance_link && (
                      <button 
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        onClick={() => window.open(session.attendance_link, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Absen Sekarang</span>
                      </button>
                    )}

                    {session.status === 'completed' && (
                      <div className="text-right">
                        <div className={`inline-flex items-center space-x-1 ${
                          attendanceRecord?.attended ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {attendanceRecord?.attended ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <span className="font-semibold text-sm">
                            {attendanceRecord?.attended ? 'Hadir' : 'Tidak Hadir'}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Show attendance link for instructors */}
            {isInstructor && session.attendance_link && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <Link className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Link Absensi:</span>
                  <code className="bg-white px-2 py-1 rounded text-xs text-gray-800 flex-1 truncate">
                    {session.attendance_link}
                  </code>
                </div>
              </div>
            )}

            {/* Show attendance records for instructors */}
            {isInstructor && attendanceRecords.length > 0 && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Daftar Kehadiran</h4>
                <div className="space-y-2">
                  {attendanceRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{record.student?.full_name}</p>
                        <p className="text-sm text-gray-600">{record.student?.email}</p>
                      </div>
                      <div className={`flex items-center space-x-1 ${
                        record.attended ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {record.attended ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span className="text-sm font-semibold">
                          {record.attended ? 'Hadir' : 'Tidak Hadir'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {classData.attendance.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Belum ada sesi absensi yang tersedia</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{classData.batch.name}</h1>
          <p className="text-gray-600">{classData.batch.description}</p>
          {user && (
            <p className="text-sm text-blue-600 mt-1">
              Logged in as: {user.role} ({user.email})
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
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
      <div>
        {activeTab === 'materials' && <MaterialsTab />}
        {activeTab === 'recordings' && <RecordingsTab />}
        {activeTab === 'assignments' && <AssignmentsTab />}
        {activeTab === 'attendance' && <AttendanceTab />}
      </div>

      {/* Modals */}
      {showCreateMaterial && (
        <MaterialForm 
          onSubmit={handleCreateMaterial}
          onClose={() => setShowCreateMaterial(false)}
        />
      )}

      {showCreateRecording && (
        <RecordingForm 
          onSubmit={handleCreateRecording}
          onClose={() => setShowCreateRecording(false)}
        />
      )}

      {showCreateAssignment && (
        <AssignmentForm 
          onSubmit={handleCreateAssignment}
          onClose={() => setShowCreateAssignment(false)}
        />
      )}

      {showCreateAttendance && (
        <AttendanceForm 
          onSubmit={handleCreateAttendance}
          onClose={() => setShowCreateAttendance(false)}
        />
      )}

      {editingItem && editingType === 'material' && (
        <MaterialForm 
          material={editingItem}
          onSubmit={(data) => handleUpdateMaterial(editingItem.id, data)}
          onClose={() => {
            setEditingItem(null);
            setEditingType(null);
          }}
        />
      )}

      {editingItem && editingType === 'recording' && (
        <RecordingForm 
          recording={editingItem}
          onSubmit={(data) => handleUpdateRecording(editingItem.id, data)}
          onClose={() => {
            setEditingItem(null);
            setEditingType(null);
          }}
        />
      )}

      {editingItem && editingType === 'assignment' && (
        <AssignmentForm 
          assignment={editingItem}
          onSubmit={(data) => handleUpdateAssignment(editingItem.id, data)}
          onClose={() => {
            setEditingItem(null);
            setEditingType(null);
          }}
        />
      )}

      {editingItem && editingType === 'attendance' && (
        <AttendanceForm 
          attendance={editingItem}
          onSubmit={(data) => handleUpdateAttendance(editingItem.id, data)}
          onClose={() => {
            setEditingItem(null);
            setEditingType(null);
          }}
        />
      )}
    </div>
  );
};

export default ClassDetail;