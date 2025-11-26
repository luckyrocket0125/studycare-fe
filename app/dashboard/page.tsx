'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { teacherApi, authApi, api, Class, ClassStudent, StudentActivity } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [stats, setStats] = useState<StudentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const response = await authApi.getProfile();
    if (!response.success) {
      api.clearToken();
      router.push('/login');
      return;
    }
    if (response.data?.role === 'student') {
      router.push('/student');
      return;
    }
    if (response.data?.role !== 'teacher') {
      api.clearToken();
      router.push('/login');
      return;
    }
    loadClasses();
  };

  const loadClasses = async () => {
    const response = await teacherApi.getClasses();
    if (response.success && response.data) {
      setClasses(response.data);
    }
    setLoading(false);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await teacherApi.createClass({
      name: newClassName,
      subject: newClassSubject || undefined,
    });

    if (response.success && response.data) {
      setClasses([...classes, response.data]);
      setShowCreateModal(false);
      setNewClassName('');
      setNewClassSubject('');
    }
  };

  const handleSelectClass = async (classItem: Class) => {
    setSelectedClass(classItem);
    
    const [studentsResponse, statsResponse] = await Promise.all([
      teacherApi.getClassStudents(classItem.id),
      teacherApi.getClassStats(classItem.id),
    ]);

    if (studentsResponse.success && studentsResponse.data) {
      setStudents(studentsResponse.data);
    }

    if (statsResponse.success && statsResponse.data) {
      setStats(statsResponse.data);
    }
  };

  const handleLogout = () => {
    api.clearToken();
    router.push('/login');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-xl">📚</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                StudyCare AI
              </h1>
              <span className="text-sm text-gray-500 font-medium">Teacher Dashboard</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">My Classes</h2>
            <p className="text-gray-600">Manage your classes and track student progress</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            <span>Create Class</span>
          </button>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">➕</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Create New Class</h3>
              </div>
              <form onSubmit={handleCreateClass}>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Class Name
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="e.g., Math 101"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newClassSubject}
                    onChange={(e) => setNewClassSubject(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                  >
                    Create Class
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-gray-900">Classes</h3>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {classes.length}
                </span>
              </div>
              <div className="space-y-3">
                {classes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📖</div>
                    <p className="text-gray-500 text-sm font-medium">No classes yet</p>
                    <p className="text-gray-400 text-xs mt-1">Create one to get started!</p>
                  </div>
                ) : (
                  classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      onClick={() => handleSelectClass(classItem)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedClass?.id === classItem.id
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 shadow-md transform scale-[1.02]'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-gray-900">{classItem.name}</div>
                        {selectedClass?.id === classItem.id && (
                          <span className="text-blue-600">✓</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        Code: <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{classItem.class_code}</span>
                      </div>
                      {classItem.subject && (
                        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <span>📚</span>
                          <span>{classItem.subject}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedClass ? (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {selectedClass.name}
                      </h3>
                      <p className="text-sm text-gray-600">Students enrolled in this class</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {students.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">🎓</div>
                        <p className="text-gray-500 font-medium">No students enrolled yet</p>
                        <p className="text-gray-400 text-sm mt-1">Share the class code with students to get started</p>
                      </div>
                    ) : (
                      students.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all bg-gradient-to-r from-white to-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold">
                                {(enrollment.user?.full_name || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {enrollment.user?.full_name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-600">{enrollment.user?.email}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              Joined: {formatDate(enrollment.joined_at)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Activity Statistics</h3>
                      <p className="text-sm text-gray-600">Track student engagement and progress</p>
                    </div>
                  </div>
                  {stats.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">📈</div>
                      <p className="text-gray-500 font-medium">No activity data available</p>
                      <p className="text-gray-400 text-sm mt-1">Activity will appear as students use the platform</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Last Active
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Questions
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Images
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.map((stat) => (
                            <tr key={stat.student_id} className="hover:bg-blue-50/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-semibold text-gray-900">
                                  {stat.student_name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">{stat.student_email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(stat.last_active)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                                  {stat.questions_asked}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                                  {stat.images_submitted}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700">
                                  {stat.notes_created}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-16 text-center border border-gray-100">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-xl font-semibold text-gray-700 mb-2">Select a class</p>
                <p className="text-gray-500">Choose a class from the sidebar to view students and activity statistics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

