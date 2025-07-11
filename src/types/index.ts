export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'student' | 'instructor' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
  color_from: string;
  color_to: string;
  instructor_id?: string;
  instructor?: User;
  start_date: string;
  end_date: string;
  is_active: boolean;
  progress?: number;
}

export interface Material {
  id: string;
  batch_id: string;
  title: string;
  type: 'pdf' | 'link' | 'file';
  file_url?: string;
  external_url?: string;
  file_size?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface VideoRecording {
  id: string;
  batch_id: string;
  title: string;
  description?: string;
  youtube_id: string;
  duration?: string;
  recorded_date: string;
  uploaded_by?: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  batch_id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  created_by?: string;
  created_at: string;
  submission?: AssignmentSubmission;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url?: string;
  submission_text?: string;
  status: 'pending' | 'submitted' | 'reviewed' | 'returned';
  score?: number;
  feedback?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface AttendanceSession {
  id: string;
  batch_id: string;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'active' | 'completed';
  attendance_link?: string;
  attendance_token?: string;
  created_by?: string;
  created_at: string;
  attendance_record?: AttendanceRecord;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  attended: boolean;
  attended_at?: string;
}

export interface ClassData {
  batch: Batch;
  materials: Material[];
  recordings: VideoRecording[];
  assignments: Assignment[];
  attendance: AttendanceSession[];
}