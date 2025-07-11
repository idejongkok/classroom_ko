import React from 'react';
import { Calendar, Users, BookOpen, Clock, ChevronRight, TrendingUp } from 'lucide-react';
import { useBatches } from '../hooks/useBatches';
import { useAuth } from '../contexts/AuthContext';
import { Batch } from '../types';

interface DashboardProps {
  onClassSelect: (batchId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onClassSelect }) => {
  const { batches, loading, error } = useBatches();
  const { user } = useAuth();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const BatchCard: React.FC<{ batch: Batch }> = ({ batch }) => (
    <div 
      onClick={() => onClassSelect(batch.id)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
    >
      {/* Header with gradient */}
      <div className={`h-24 bg-gradient-to-r ${batch.color_from} ${batch.color_to} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300"></div>
        <div className="relative p-6 h-full flex items-end">
          <div className="text-white">
            <h3 className="font-bold text-lg leading-tight">{batch.name}</h3>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{batch.description}</p>
        
        {/* Progress - only show for students */}
        {user?.role === 'student' && batch.progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Progress</span>
              <span className="text-sm font-bold text-orange-600">{batch.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-gradient-to-r ${batch.color_from} ${batch.color_to} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${batch.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="space-y-2 mb-4">
          {batch.instructor && (
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              <span>Mentor: {batch.instructor.full_name}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatDate(batch.start_date)} - {formatDate(batch.end_date)}</span>
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-sm font-semibold text-gray-900">
            {user?.role === 'student' ? 'Masuk ke kelas' : 'Kelola kelas'}
          </span>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all duration-200" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user?.role === 'student' ? 'Dashboard Kelas' : 'Kelola Kelas'}
        </h1>
        <p className="text-gray-600">
          {user?.role === 'student' 
            ? 'Pilih kelas yang ingin Anda akses' 
            : 'Kelola dan pantau kelas Anda'
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
              <p className="text-sm text-gray-600">
                {user?.role === 'student' ? 'Kelas Aktif' : 'Total Kelas'}
              </p>
            </div>
          </div>
        </div>

        {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {user?.role === 'student' 
                  ? Math.round(batches.reduce((acc, batch) => acc + (batch.progress || 0), 0) / batches.length) || 0
                  : '95'
                }%
              </p>
              <p className="text-sm text-gray-600">
                {user?.role === 'student' ? 'Rata-rata Progress' : 'Tingkat Kehadiran'}
              </p>
            </div>
          </div>
        </div> */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-sm text-gray-600">
                {user?.role === 'student' ? 'Tugas Selesai' : 'Sesi Minggu Ini'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {batches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada kelas</h3>
          <p className="text-gray-600">
            {user?.role === 'student' 
              ? 'Anda belum terdaftar di kelas manapun. Hubungi admin untuk mendaftar.'
              : 'Belum ada kelas yang dibuat. Mulai dengan membuat kelas baru.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;