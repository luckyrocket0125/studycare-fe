'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, api, caregiverApi, CaregiverChild, ChildActivity } from '@/lib/api';

export default function CaregiverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [children, setChildren] = useState<CaregiverChild[]>([]);
  const [selectedChild, setSelectedChild] = useState<CaregiverChild | null>(null);
  const [childActivity, setChildActivity] = useState<ChildActivity | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [childEmail, setChildEmail] = useState('');

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
    if (response.data?.role !== 'caregiver') {
      if (response.data?.role === 'student') {
        router.push('/student');
      } else if (response.data?.role === 'teacher') {
        router.push('/dashboard');
      } else {
        api.clearToken();
        router.push('/login');
      }
      return;
    }
    loadChildren();
  };

  const loadChildren = async () => {
    setLoading(true);
    const response = await caregiverApi.getChildren();
    if (response.success && response.data) {
      setChildren(response.data);
    } else {
      setError(response.error?.message || 'Failed to load children');
    }
    setLoading(false);
  };

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const response = await caregiverApi.linkChild({ childEmail });

    if (response.success && response.data) {
      setSuccess(`Successfully linked to ${response.data.child?.email || childEmail}`);
      setChildEmail('');
      setShowLinkModal(false);
      loadChildren();
    } else {
      setError(response.error?.message || 'Failed to link child');
    }
  };

  const handleSelectChild = async (child: CaregiverChild) => {
    setSelectedChild(child);
    setError('');
    setSuccess('');

    const response = await caregiverApi.getChildActivity(child.child_id);
    if (response.success && response.data) {
      setChildActivity(response.data);
    } else {
      setError(response.error?.message || 'Failed to load child activity');
    }
  };

  const handleUnlinkChild = async (childId: string) => {
    if (!confirm('Are you sure you want to unlink this child?')) return;

    setError('');
    setSuccess('');

    const response = await caregiverApi.unlinkChild(childId);
    if (response.success) {
      setSuccess('Child unlinked successfully');
      setSelectedChild(null);
      setChildActivity(null);
      loadChildren();
    } else {
      setError(response.error?.message || 'Failed to unlink child');
    }
  };

  const handleLogout = () => {
    api.clearToken();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="StudyCare AI Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                StudyCare AI
              </h1>
              <span className="text-sm text-gray-500 font-medium">Caregiver Dashboard</span>
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
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in">
            <span className="text-lg">⚠️</span>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in">
            <span className="text-lg">✓</span>
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Linked Children</h2>
            <p className="text-gray-600">Monitor your child's learning progress and activity</p>
          </div>
          <button
            onClick={() => setShowLinkModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            <span>Link Child</span>
          </button>
        </div>

        {showLinkModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔗</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Link Child Account</h3>
              </div>
              <form onSubmit={handleLinkChild}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Child's Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">✉️</span>
                    </div>
                    <input
                      type="email"
                      value={childEmail}
                      onChange={(e) => setChildEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                      placeholder="child@example.com"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>ℹ️</span>
                    <span>The child must have a student account with this email.</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                  >
                    Link Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkModal(false);
                      setChildEmail('');
                    }}
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
                <h3 className="font-bold text-lg text-gray-900">Children</h3>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {children.length}
                </span>
              </div>
              <div className="space-y-3">
                {children.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">👶</div>
                    <p className="text-gray-500 text-sm font-medium">No children linked yet</p>
                    <p className="text-gray-400 text-xs mt-1">Link a child to get started</p>
                  </div>
                ) : (
                  children.map((child) => (
                    <div
                      key={child.id}
                      onClick={() => handleSelectChild(child)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedChild?.id === child.id
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-500 shadow-md transform scale-[1.02]'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 w-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {(child.child?.full_name || child.child?.email || 'U')[0].toUpperCase()}
                            </div>
                            <div className="font-semibold text-gray-900">
                              {child.child?.full_name || child.child?.email || 'Unknown'}
                            </div>
                            {selectedChild?.id === child.id && (
                              <span className="text-purple-600">✓</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 ml-10">
                            {child.child?.email}
                          </div>
                          {child.child?.simplified_mode && (
                            <div className="text-xs text-purple-600 mt-2 ml-10 flex items-center gap-1">
                              <span>✨</span>
                              <span>Simplified Mode: ON</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlinkChild(child.child_id);
                          }}
                          className="ml-2 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all"
                        >
                          Unlink
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedChild && childActivity ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {childActivity.child_name || childActivity.child_email}'s Activity
                    </h3>
                    <p className="text-sm text-gray-600">Learning progress and engagement metrics</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200 shadow-sm">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{childActivity.classes_count}</div>
                    <div className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <span>🎓</span>
                      <span>Classes</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200 shadow-sm">
                    <div className="text-3xl font-bold text-green-600 mb-1">{childActivity.notes_count}</div>
                    <div className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <span>📝</span>
                      <span>Notes</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-2 border-purple-200 shadow-sm">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{childActivity.chat_sessions_count}</div>
                    <div className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <span>💬</span>
                      <span>Chat Sessions</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <div className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-2">
                    <span>🕐</span>
                    <span>Last Active</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {childActivity.last_active
                      ? new Date(childActivity.last_active).toLocaleString()
                      : 'Never'}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <span>📋</span>
                    <span>Recent Activity</span>
                  </h4>
                  <div className="space-y-3">
                    {childActivity.recent_activity.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-gray-500 text-sm font-medium">No recent activity</p>
                      </div>
                    ) : (
                      childActivity.recent_activity.map((activity, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 border-2 border-gray-100 hover:border-purple-200 hover:shadow-md transition-all">
                          <div className="text-sm font-semibold text-gray-900 mb-1">{activity.description}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <span>🕒</span>
                            <span>{new Date(activity.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-16 text-center border border-gray-100">
                <div className="text-6xl mb-4">👶</div>
                <p className="text-xl font-semibold text-gray-700 mb-2">Select a child</p>
                <p className="text-gray-500">Choose a child from the sidebar to view their activity and progress</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

