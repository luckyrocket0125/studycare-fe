'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentApi, authApi, api, chatApi, imageApi, voiceApi, podApi, noteApi, symptomApi, StudentClass, ChatSession, ChatMessage, VoiceChatResponse, StudyPod, PodMessage, Note, NoteSummary, NoteExplanation, SymptomGuidance, SymptomCheck, ImageUpload } from '@/lib/api';

export default function StudentPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'classes' | 'chat' | 'image' | 'voice' | 'pods' | 'notes' | 'symptom'>('classes');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newSessionSubject, setNewSessionSubject] = useState('');
  const [imageAnalysis, setImageAnalysis] = useState<{ sessionId: string; explanation: string; ocrText: string; imageUrl: string; id?: string; created_at?: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageHistory, setImageHistory] = useState<ImageUpload[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageUpload | null>(null);
  const [imageQuestion, setImageQuestion] = useState('');
  const [imageAnswer, setImageAnswer] = useState<string | null>(null);
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null);
  const [voiceResponse, setVoiceResponse] = useState<VoiceChatResponse | null>(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [pods, setPods] = useState<StudyPod[]>([]);
  const [selectedPod, setSelectedPod] = useState<StudyPod | null>(null);
  const [podMessages, setPodMessages] = useState<PodMessage[]>([]);
  const [podMessageInput, setPodMessageInput] = useState('');
  const [sendingPodMessage, setSendingPodMessage] = useState(false);
  const [newPodName, setNewPodName] = useState('');
  const [showCreatePodModal, setShowCreatePodModal] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [noteSummary, setNoteSummary] = useState<NoteSummary | null>(null);
  const [noteExplanation, setNoteExplanation] = useState<NoteExplanation | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [symptomInput, setSymptomInput] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [symptomGuidance, setSymptomGuidance] = useState<SymptomGuidance | null>(null);
  const [symptomHistory, setSymptomHistory] = useState<SymptomCheck[]>([]);
  const [checkingSymptoms, setCheckingSymptoms] = useState(false);
  const [user, setUser] = useState<{ id: string; simplified_mode: boolean } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [showDeletePodDialog, setShowDeletePodDialog] = useState(false);
  const [podToDelete, setPodToDelete] = useState<string | null>(null);
  const [showDeleteImageDialog, setShowDeleteImageDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

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
    if (response.data?.role === 'teacher') {
      router.push('/dashboard');
      return;
    }
    if (response.data?.role === 'caregiver') {
      router.push('/caregiver');
      return;
    }
    if (response.data?.role !== 'student') {
      api.clearToken();
      router.push('/login');
      return;
    }
    if (response.data) {
      setUser({ id: response.data.id, simplified_mode: response.data.simplified_mode });
    }
    loadData();
  };

  const handleToggleSimplifiedMode = async () => {
    if (!user) return;

    const response = await authApi.updateProfile({
      simplified_mode: !user.simplified_mode,
    });

    if (response.success && response.data) {
      setUser({ id: response.data.id, simplified_mode: response.data.simplified_mode });
      setSuccess('Simplified mode updated successfully!');
    } else {
      setError(response.error?.message || 'Failed to update simplified mode');
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [classesResponse, sessionsResponse, podsResponse, imagesResponse] = await Promise.all([
      studentApi.getClasses(),
      chatApi.getSessions(),
      podApi.getPods(),
      imageApi.getAllAnalyses(),
    ]);

    if (classesResponse.success && classesResponse.data) {
      setClasses(classesResponse.data);
    }

    if (sessionsResponse.success && sessionsResponse.data) {
      setChatSessions(sessionsResponse.data);
    }

    if (podsResponse.success && podsResponse.data) {
      setPods(podsResponse.data);
    } else if (podsResponse.error) {
      console.error('Failed to load pods:', podsResponse.error);
    }

    if (imagesResponse.success && imagesResponse.data) {
      setImageHistory(imagesResponse.data);
    } else if (imagesResponse.error) {
      console.error('Failed to load image history:', imagesResponse.error);
    }

    const notesResponse = await noteApi.getNotes();
    if (notesResponse.success && notesResponse.data) {
      setNotes(notesResponse.data);
    } else if (notesResponse.error) {
      console.error('Failed to load notes:', notesResponse.error);
    }

    const symptomHistoryResponse = await symptomApi.getHistory();
    if (symptomHistoryResponse.success && symptomHistoryResponse.data) {
      setSymptomHistory(symptomHistoryResponse.data);
    } else if (symptomHistoryResponse.error) {
      console.error('Failed to load symptom history:', symptomHistoryResponse.error);
    }

    setLoading(false);
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!classCode.trim()) {
      setError('Please enter a class code');
      return;
    }

    const response = await studentApi.joinClass(classCode.toUpperCase());

    if (response.success && response.data) {
      setSuccess(`Successfully joined ${response.data.class?.name || 'class'}!`);
      setClassCode('');
      loadData();
    } else {
      setError(response.error?.message || 'Failed to join class');
    }
  };

  const handleCreateChatSession = async () => {
    const response = await chatApi.createSession({ subject: newSessionSubject || undefined });

    if (response.success && response.data) {
      setChatSessions([...chatSessions, response.data]);
      setSelectedSession(response.data);
      setMessages([]);
      setNewSessionSubject('');
      setActiveTab('chat');
    }
  };

  const handleSelectSession = async (session: ChatSession) => {
    setSelectedSession(session);
    const response = await chatApi.getSession(session.id);

    if (response.success && response.data) {
      setMessages(response.data.messages || []);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;

    setError('');
    setSuccess('');

    const response = await chatApi.deleteSession(sessionToDelete);

    if (response.success) {
      setSuccess('Chat session deleted successfully!');
      setChatSessions(chatSessions.filter(s => s.id !== sessionToDelete));
      if (selectedSession?.id === sessionToDelete) {
        setSelectedSession(null);
        setMessages([]);
      }
    } else {
      setError(response.error?.message || 'Failed to delete session');
    }

    setShowDeleteDialog(false);
    setSessionToDelete(null);
  };

  const cancelDeleteSession = () => {
    setShowDeleteDialog(false);
    setSessionToDelete(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedSession || sendingMessage) return;

    setSendingMessage(true);
    const userMessage: ChatMessage = {
      id: 'temp',
      session_id: selectedSession.id,
      user_id: '',
      message_type: 'user',
      content: messageInput,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setMessageInput('');

    const response = await chatApi.sendMessage({
      sessionId: selectedSession.id,
      message: messageInput,
    });

    if (response.success && response.data) {
      // Replace temp message with actual user message (with user info) and add AI response
      const actualUserMessage = response.data.userMessage || userMessage;
      setMessages([...messages.filter(m => m.id !== 'temp'), actualUserMessage, response.data.message]);
    } else {
      setError(response.error?.message || 'Failed to send message');
      setMessages(messages.filter(m => m.id !== 'temp'));
    }

    setSendingMessage(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setUploadingImage(true);
    setImageAnalysis(null);
    setSelectedImage(null);
    setImageAnswer(null);
    setImageQuestion('');
    
    const formData = new FormData();
    formData.append('image', file);

    const response = await imageApi.upload(formData);

    if (response.success && response.data) {
      setSuccess('Image uploaded and analyzed successfully!');
      
      setImageAnalysis({
        sessionId: response.data.sessionId,
        explanation: response.data.explanation,
        ocrText: response.data.ocrText || '',
        imageUrl: response.data.imageUrl || '',
      });
      
      loadData();
    } else {
      setError(response.error?.message || 'Failed to upload image');
    }
    
    setUploadingImage(false);
    e.target.value = '';
  };

  const handleSelectImage = async (image: ImageUpload) => {
    setSelectedImage(image);
    setImageAnalysis({
      sessionId: image.session_id,
      explanation: image.explanation || '',
      ocrText: image.ocr_text || '',
      imageUrl: image.file_url,
      id: image.id,
      created_at: image.created_at,
    });
    setImageAnswer(null);
    setImageQuestion('');
  };

  const handleAskImageQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageQuestion.trim() || !selectedImage || askingQuestion) return;

    setAskingQuestion(true);
    setError('');

    const response = await imageApi.askQuestion(selectedImage.session_id, imageQuestion);

    if (response.success && response.data) {
      setImageAnswer(response.data.answer);
      setImageQuestion('');
    } else {
      setError(response.error?.message || 'Failed to get answer');
    }

    setAskingQuestion(false);
  };

  const handleDeleteImage = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageToDelete(imageId);
    setShowDeleteImageDialog(true);
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;

    setError('');
    setSuccess('');

    const response = await imageApi.deleteAnalysis(imageToDelete);

    if (response.success) {
      setSuccess('Image analysis deleted successfully!');
      setImageHistory(imageHistory.filter(img => img.id !== imageToDelete));
      if (selectedImage?.id === imageToDelete) {
        setSelectedImage(null);
        setImageAnalysis(null);
        setImageAnswer(null);
        setImageQuestion('');
      }
    } else {
      setError(response.error?.message || 'Failed to delete image');
    }

    setShowDeleteImageDialog(false);
    setImageToDelete(null);
  };

  const cancelDeleteImage = () => {
    setShowDeleteImageDialog(false);
    setImageToDelete(null);
  };

  const handleLogout = () => {
    api.clearToken();
    router.push('/login');
  };

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          await handleVoiceChat(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setMediaRecorder(recorder);
        setRecording(true);
      })
      .catch((error) => {
        setError('Failed to access microphone: ' + error.message);
      });
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleVoiceChat = async (audioBlob: Blob) => {
    setError('');
    setSuccess('');
    setVoiceResponse(null);

    const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
    const response = await voiceApi.chat(audioFile, 'en', voiceSessionId || undefined);

    if (response.success && response.data) {
      setVoiceResponse(response.data);
      setVoiceSessionId(response.data.sessionId);
      setSuccess('Voice message processed successfully!');
    } else {
      setError(response.error?.message || 'Failed to process voice message');
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    setPlayingAudio(true);
    audio.play();
    audio.onended = () => setPlayingAudio(false);
    audio.onerror = () => {
      setError('Failed to play audio');
      setPlayingAudio(false);
    };
  };

  const handleCreatePod = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const response = await podApi.createPod({ name: newPodName });

    if (response.success && response.data) {
      setSuccess('Study pod created successfully!');
      setNewPodName('');
      setShowCreatePodModal(false);
      loadData();
    } else {
      setError(response.error?.message || 'Failed to create pod');
    }
  };

  const handleSelectPod = async (pod: StudyPod) => {
    setSelectedPod(pod);
    setPodMessages([]);
    setError('');
    setSuccess('');

    // Try to get pod details first (this will work for students even if not a member)
    const podResponse = await podApi.getPod(pod.id);
    if (podResponse.success && podResponse.data) {
      setSelectedPod(podResponse.data);
    }

    const response = await podApi.getMessages(pod.id, 50);
    if (response.success && response.data) {
      setPodMessages(response.data);
    } else {
      setError(response.error?.message || 'Failed to load messages');
    }
  };

  const handleSendPodMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podMessageInput.trim() || !selectedPod || sendingPodMessage) return;

    setSendingPodMessage(true);
    setError('');

    const response = await podApi.sendMessage(selectedPod.id, podMessageInput);

    if (response.success && response.data) {
      setPodMessages((prev) => [...prev, response.data!]);
      setPodMessageInput('');
      // Reload pod data to update membership status
      loadData();
    } else {
      setError(response.error?.message || 'Failed to send message');
    }

    setSendingPodMessage(false);
  };

  const handleDeletePod = async (podId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPodToDelete(podId);
    setShowDeletePodDialog(true);
  };

  const confirmDeletePod = async () => {
    if (!podToDelete) return;

    setError('');
    setSuccess('');

    const response = await podApi.deletePod(podToDelete);

    if (response.success) {
      setSuccess('Study pod deleted successfully!');
      setPods(pods.filter(p => p.id !== podToDelete));
      if (selectedPod?.id === podToDelete) {
        setSelectedPod(null);
        setPodMessages([]);
      }
    } else {
      setError(response.error?.message || 'Failed to delete pod');
    }

    setShowDeletePodDialog(false);
    setPodToDelete(null);
  };

  const cancelDeletePod = () => {
    setShowDeletePodDialog(false);
    setPodToDelete(null);
  };

  const handleJoinPod = async (podId: string) => {
    setError('');
    setSuccess('');

    const response = await podApi.joinPod(podId);

    if (response.success) {
      setSuccess('Joined study pod successfully!');
      loadData();
    } else {
      setError(response.error?.message || 'Failed to join pod');
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const response = await noteApi.createNote({
      title: noteTitle,
      content: noteContent,
      tags: noteTags,
    });

    if (response.success && response.data) {
      setSuccess('Note created successfully!');
      setNoteTitle('');
      setNoteContent('');
      setNoteTags([]);
      setShowCreateNoteModal(false);
      loadData();
    } else {
      setError(response.error?.message || 'Failed to create note');
    }
  };

  const handleSelectNote = async (note: Note) => {
    setSelectedNote(note);
    setNoteSummary(null);
    setNoteExplanation(null);
    setError('');
    setSuccess('');
  };

  const handleUpdateNote = async () => {
    if (!selectedNote) return;

    setError('');
    setSuccess('');

    const response = await noteApi.updateNote(selectedNote.id, {
      title: noteTitle || selectedNote.title,
      content: noteContent || selectedNote.content,
      tags: noteTags.length > 0 ? noteTags : selectedNote.tags,
    });

    if (response.success && response.data) {
      setSuccess('Note updated successfully!');
      setSelectedNote(response.data);
      loadData();
    } else {
      setError(response.error?.message || 'Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    setError('');
    setSuccess('');

    const response = await noteApi.deleteNote(noteId);

    if (response.success) {
      setSuccess('Note deleted successfully!');
      setSelectedNote(null);
      loadData();
    } else {
      setError(response.error?.message || 'Failed to delete note');
    }
  };

  const handleSummarizeNote = async () => {
    if (!selectedNote) return;

    setLoadingAI(true);
    setError('');
    setSuccess('');

    const response = await noteApi.summarizeNote(selectedNote.id);

    if (response.success && response.data) {
      setNoteSummary(response.data);
      setSuccess('Note summarized successfully!');
      loadData();
    } else {
      setError(response.error?.message || 'Failed to summarize note');
    }

    setLoadingAI(false);
  };

  const handleExplainNote = async () => {
    if (!selectedNote) return;

    setLoadingAI(true);
    setError('');
    setSuccess('');

    const response = await noteApi.explainNote(selectedNote.id);

    if (response.success && response.data) {
      setNoteExplanation(response.data);
      setSuccess('Note explanation generated successfully!');
      loadData();
    } else {
      setError(response.error?.message || 'Failed to explain note');
    }

    setLoadingAI(false);
  };

  const handleOrganizeNote = async () => {
    if (!selectedNote) return;

    setLoadingAI(true);
    setError('');
    setSuccess('');

    const response = await noteApi.organizeNote(selectedNote.id);

    if (response.success && response.data) {
      setSelectedNote(response.data);
      setSuccess('Note organized successfully!');
      loadData();
    } else {
      setError(response.error?.message || 'Failed to organize note');
    }

    setLoadingAI(false);
  };

  const handleCheckSymptoms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomInput.trim()) {
      setError('Please describe your symptoms');
      return;
    }

    setCheckingSymptoms(true);
    setError('');
    setSuccess('');
    setSymptomGuidance(null);

    const response = await symptomApi.checkSymptoms({
      symptoms: symptomInput,
      additionalInfo: additionalInfo || undefined,
    });

    if (response.success && response.data) {
      setSymptomGuidance(response.data);
      setSymptomInput('');
      setAdditionalInfo('');
      loadData();
    } else {
      setError(response.error?.message || 'Failed to check symptoms');
    }

    setCheckingSymptoms(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📚</div>
          <div className="text-xl font-semibold text-gray-700">Loading your dashboard...</div>
        </div>
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
                  <span className="text-xl">🎓</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  StudyCare AI
                </h1>
                <span className="text-sm text-gray-500 font-medium">Student Dashboard</span>
              </div>
              <div className="flex items-center gap-4">
                {user && (
                  <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <span className="text-xs font-semibold text-gray-700">Simplified</span>
                    <button
                      onClick={handleToggleSimplifiedMode}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        user.simplified_mode ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          user.simplified_mode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
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

        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 border border-gray-100">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-5 py-3 font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'classes'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>🎓</span>
              <span>My Classes</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-5 py-3 font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>💬</span>
              <span>AI Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`px-5 py-3 font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'image'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>📷</span>
              <span>Image Analysis</span>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`px-5 py-3 font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'voice'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>🎤</span>
              <span>Voice Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('pods')}
              className={`px-5 py-3 font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'pods'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>👥</span>
              <span>Study Pods</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-5 py-3 font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'notes'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>📝</span>
              <span>Notes</span>
            </button>
            <button
              onClick={() => setActiveTab('symptom')}
              className={`px-5 py-3 font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'symptom'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>🏥</span>
              <span>Symptom Check</span>
            </button>
          </div>
        </div>

        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">➕</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Join a Class</h2>
                  <p className="text-sm text-gray-600">Enter your class code to join</p>
                </div>
              </div>
              <form onSubmit={handleJoinClass} className="flex gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔑</span>
                  </div>
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="Enter class code (e.g., ABC123)"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-mono"
                    maxLength={10}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Join Class
                </button>
              </form>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Classes</h2>
                    <p className="text-sm text-gray-600">Classes you are enrolled in</p>
                  </div>
                </div>
                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
                  {classes.length}
                </span>
              </div>
              {classes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📚</div>
                  <p className="text-gray-500 font-medium text-lg mb-2">No classes yet</p>
                  <p className="text-gray-400 text-sm">Join a class using the code above to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="border-2 border-gray-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg transition-all bg-gradient-to-r from-white to-gray-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="font-bold text-lg text-gray-900">
                          {enrollment.class?.name || 'Unknown Class'}
                        </div>
                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold font-mono">
                          {enrollment.class?.class_code}
                        </div>
                      </div>
                      {enrollment.class?.subject && (
                        <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                          <span>📚</span>
                          <span>{enrollment.class.subject}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                        <span>📅</span>
                        <span>Joined: {new Date(enrollment.joined_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-5 border border-gray-100">
                <button
                  onClick={handleCreateChatSession}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl mb-4 flex items-center justify-center gap-2"
                >
                  <span>➕</span>
                  <span>New Chat Session</span>
                </button>
                <input
                  type="text"
                  value={newSessionSubject}
                  onChange={(e) => setNewSessionSubject(e.target.value)}
                  placeholder="Subject (optional)"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm"
                />
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Chat Sessions</h3>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    {chatSessions.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {chatSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">💬</div>
                      <p className="text-gray-500 text-sm font-medium">No chat sessions yet</p>
                    </div>
                  ) : (
                    chatSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 relative group ${
                          selectedSession?.id === session.id
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 shadow-md transform scale-[1.02]'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900 mb-1 truncate">
                              {session.subject || 'General Chat'}
                            </div>
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span>📅</span>
                                <span>{new Date(session.created_at).toLocaleDateString()}</span>
                              </div>
                              {session.user && (
                                <div className="flex items-center gap-1">
                                  <span>👤</span>
                                  <span className="truncate">
                                    {session.user.full_name || session.user.email}
                                    {user && session.user_id === user.id && (
                                      <span className="ml-1 text-blue-600 font-semibold">(You)</span>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {user && session.user_id === user.id && (
                            <button
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex-shrink-0"
                              title="Delete session"
                            >
                              <span className="text-sm">🗑️</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl flex flex-col border border-gray-100" style={{ height: '600px' }}>
                {selectedSession ? (
                  <>
                    <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                          <span>💬</span>
                          <span>{selectedSession.subject || 'General Chat'}</span>
                        </h3>
                        {selectedSession.user && (
                          <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                            <span>👤</span>
                            <span>
                              {selectedSession.user.full_name || selectedSession.user.email}
                              {user && selectedSession.user_id === user.id && (
                                <span className="ml-1 text-blue-600 font-semibold">(You)</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      {user && selectedSession.user_id === user.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(selectedSession.id, e);
                          }}
                          className="px-3 py-1.5 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete this session"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-white to-gray-50">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="text-5xl mb-3">👋</div>
                            <p className="text-gray-500 font-medium">Start a conversation!</p>
                          </div>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex flex-col ${
                              message.message_type === 'user' ? 'items-end' : 'items-start'
                            }`}
                          >
                            {message.message_type === 'user' && message.user && (
                              <div className="text-xs text-gray-600 mb-1 px-2">
                                {message.user.full_name || message.user.email}
                                {user && message.user_id === user.id && (
                                  <span className="ml-1 text-blue-600 font-semibold">(You)</span>
                                )}
                              </div>
                            )}
                            {message.message_type === 'assistant' && (
                              <div className="text-xs text-gray-600 mb-1 px-2 flex items-center gap-1">
                                <span>🤖</span>
                                <span>AI Assistant</span>
                              </div>
                            )}
                            <div
                              className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-md ${
                                message.message_type === 'user'
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                  : 'bg-white border-2 border-gray-200 text-gray-800'
                              }`}
                            >
                              <div className="text-sm leading-relaxed">{message.content}</div>
                              <div
                                className={`text-xs mt-2 ${
                                  message.message_type === 'user' ? 'text-blue-100' : 'text-gray-500'
                                }`}
                              >
                                {new Date(message.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-5 border-t border-gray-200 bg-white rounded-b-2xl flex gap-3">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        disabled={sendingMessage}
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !messageInput.trim()}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💭</div>
                      <p className="text-lg font-medium">Select a chat session or create a new one</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-5 border border-gray-100">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gradient-to-br from-gray-50 to-purple-50 hover:border-purple-400 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-semibold ${
                      uploadingImage
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                  >
                    {uploadingImage ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>📤</span>
                        <span>Upload Image</span>
                      </>
                    )}
                  </label>
                  <p className="text-xs text-gray-500 mt-3">JPG, PNG, GIF, WebP</p>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Image History</h3>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                    {imageHistory.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {imageHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-gray-500 text-sm font-medium">No images yet</p>
                    </div>
                  ) : (
                    imageHistory.map((image) => (
                      <div
                        key={image.id}
                        onClick={() => handleSelectImage(image)}
                        className={`p-3 rounded-xl cursor-pointer transition-all duration-200 relative group ${
                          selectedImage?.id === image.id
                            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-500 shadow-md transform scale-[1.02]'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200 hover:shadow-md'
                        }`}
                      >
                        <button
                          onClick={(e) => handleDeleteImage(image.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 z-10 shadow-lg"
                          title="Delete image"
                        >
                          <span className="text-xs">🗑️</span>
                        </button>
                        <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-gray-200">
                          <img
                            src={image.file_url}
                            alt="Analysis"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(image.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100">
                {imageAnalysis ? (
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📷</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Image Analysis</h3>
                        {imageAnalysis.created_at && (
                          <p className="text-xs text-gray-500">
                            {new Date(imageAnalysis.created_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {imageAnalysis.imageUrl && (
                      <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                        <img
                          src={imageAnalysis.imageUrl}
                          alt="Uploaded"
                          className="max-w-full h-auto w-full"
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                          <span>📝</span>
                          <span>Extracted Text</span>
                        </h4>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4">
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
                            {imageAnalysis.ocrText || 'No text extracted'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                          <span>🤖</span>
                          <span>AI Explanation</span>
                        </h4>
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
                            {imageAnalysis.explanation}
                          </p>
                        </div>
                      </div>

                      {imageAnswer && (
                        <div className="animate-fade-in">
                          <h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                            <span>💬</span>
                            <span>Answer to Your Question</span>
                          </h4>
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
                              {imageAnswer}
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                          <span>❓</span>
                          <span>Ask a Question</span>
                        </h4>
                        <form onSubmit={handleAskImageQuestion} className="flex gap-3">
                          <input
                            type="text"
                            value={imageQuestion}
                            onChange={(e) => setImageQuestion(e.target.value)}
                            placeholder="Ask something about this image..."
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                            disabled={askingQuestion}
                          />
                          <button
                            type="submit"
                            disabled={askingQuestion || !imageQuestion.trim()}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {askingQuestion ? 'Asking...' : 'Ask'}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[600px] text-gray-500">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📷</div>
                      <p className="text-lg font-medium">Upload an image or select from history</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-gradient-to-br from-red-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎤</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Voice Chat with AI</h2>
                  <p className="text-sm text-gray-600">Record your question and get an AI response with audio playback</p>
                </div>
              </div>

              <div className="flex flex-col items-center space-y-6">
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`px-10 py-6 rounded-full text-white font-bold text-lg transition-all shadow-2xl transform hover:scale-105 ${
                    recording
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 animate-pulse'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  {recording ? (
                    <span className="flex items-center gap-3">
                      <span className="w-4 h-4 bg-white rounded-full animate-pulse"></span>
                      <span>Recording... Click to Stop</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <span className="text-2xl">🎤</span>
                      <span>Start Recording</span>
                    </span>
                  )}
                </button>

                {voiceResponse && (
                  <div className="w-full space-y-4 mt-8 animate-fade-in">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-5">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span>👤</span>
                        <span>You said:</span>
                      </h3>
                      <p className="text-gray-800 text-lg leading-relaxed">{voiceResponse.transcription}</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span>🤖</span>
                        <span>AI Response:</span>
                      </h3>
                      <p className="text-gray-800 mb-5 text-lg leading-relaxed">{voiceResponse.aiResponse}</p>
                      {voiceResponse.audioUrl && (
                        <button
                          onClick={() => playAudio(voiceResponse.audioUrl!)}
                          disabled={playingAudio}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50"
                        >
                          <span className="text-xl">{playingAudio ? '⏸️' : '🔊'}</span>
                          <span>{playingAudio ? 'Playing...' : 'Play Audio Response'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pods' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-5 border border-gray-100">
                <button
                  onClick={() => setShowCreatePodModal(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl mb-4 flex items-center justify-center gap-2"
                >
                  <span>➕</span>
                  <span>New Study Pod</span>
                </button>
              </div>
              {showCreatePodModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                  <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <span>👥</span>
                      <span>Create Study Pod</span>
                    </h3>
                    <form onSubmit={handleCreatePod}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pod Name
                        </label>
                        <input
                          type="text"
                          value={newPodName}
                          onChange={(e) => setNewPodName(e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                          placeholder="e.g., Math Study Group"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreatePodModal(false)}
                          className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Study Pods</h3>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    {pods.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {pods.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">👥</div>
                      <p className="text-gray-500 text-sm font-medium">No study pods yet</p>
                    </div>
                  ) : (
                    pods.map((pod) => (
                      <div
                        key={pod.id}
                        onClick={() => handleSelectPod(pod)}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 relative group ${
                          selectedPod?.id === pod.id
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 shadow-md transform scale-[1.02]'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-200 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900 mb-1 truncate">
                              {pod.name}
                            </div>
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span>👥</span>
                                <span>{pod.memberCount || 0} member{pod.memberCount !== 1 ? 's' : ''}</span>
                                {pod.isMember && (
                                  <span className="ml-1 text-blue-600 font-semibold">(Joined)</span>
                                )}
                              </div>
                              {pod.creator && (
                                <div className="flex items-center gap-1">
                                  <span>👤</span>
                                  <span className="truncate">
                                    {pod.creator.full_name || pod.creator.email}
                                    {user && pod.created_by === user.id && (
                                      <span className="ml-1 text-blue-600 font-semibold">(You)</span>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {user && pod.created_by === user.id && (
                            <button
                              onClick={(e) => handleDeletePod(pod.id, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex-shrink-0"
                              title="Delete pod"
                            >
                              <span className="text-sm">🗑️</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl flex flex-col border border-gray-100" style={{ height: '600px' }}>
                {selectedPod ? (
                  <>
                    <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                          <span>👥</span>
                          <span>{selectedPod.name}</span>
                        </h3>
                        {selectedPod.creator && (
                          <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                            <span>👤</span>
                            <span>
                              Created by: {selectedPod.creator.full_name || selectedPod.creator.email}
                              {user && selectedPod.created_by === user.id && (
                                <span className="ml-1 text-blue-600 font-semibold">(You)</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      {user && selectedPod.created_by === user.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePod(selectedPod.id, e);
                          }}
                          className="px-3 py-1.5 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete this pod"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-white to-gray-50">
                      {podMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="text-5xl mb-3">💬</div>
                            <p className="text-gray-500 font-medium">Start the conversation!</p>
                            {!selectedPod.isMember && (
                              <p className="text-xs text-gray-400 mt-2">You will be auto-joined when you send a message</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        podMessages.map((msg) => (
                          <div key={msg.id} className="space-y-2">
                            <div className="flex flex-col">
                              <div className="text-xs text-gray-600 mb-1 px-2 flex items-center gap-1">
                                <span>👤</span>
                                <span>
                                  {msg.user?.full_name || msg.user?.email || 'Unknown'}
                                  {user && msg.user_id === user.id && (
                                    <span className="ml-1 text-blue-600 font-semibold">(You)</span>
                                  )}
                                </span>
                              </div>
                              <div className="bg-gray-100 rounded-xl p-3 text-gray-800 shadow-sm">
                                {msg.content}
                              </div>
                              <div className="text-xs text-gray-500 px-2 mt-1">
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                            {msg.ai_guidance && (
                              <div className="ml-4 pl-4 border-l-2 border-blue-300">
                                <div className="text-xs font-medium text-blue-600 mb-1 flex items-center gap-1">
                                  <span>🤖</span>
                                  <span>AI Guidance</span>
                                </div>
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 text-gray-800 text-sm">
                                  {msg.ai_guidance}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                      {sendingPodMessage && (
                        <div className="flex justify-start">
                          <div className="max-w-[70%] p-3 rounded-xl bg-gray-200 text-gray-800 animate-pulse shadow-sm">
                            Sending...
                          </div>
                        </div>
                      )}
                    </div>
                    <form onSubmit={handleSendPodMessage} className="p-5 border-t border-gray-200 bg-white rounded-b-2xl flex gap-3">
                      <input
                        type="text"
                        value={podMessageInput}
                        onChange={(e) => setPodMessageInput(e.target.value)}
                        placeholder={selectedPod.isMember ? "Type your message..." : "Type to join and send a message..."}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        disabled={sendingPodMessage}
                      />
                      <button
                        type="submit"
                        disabled={sendingPodMessage || !podMessageInput.trim()}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingPodMessage ? 'Sending...' : 'Send'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-6xl mb-4">👥</div>
                      <p className="text-lg font-medium">Select a study pod or create a new one</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">My Notes</h3>
                  <button
                    onClick={() => {
                      setShowCreateNoteModal(true);
                      setNoteTitle('');
                      setNoteContent('');
                      setNoteTags([]);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + New Note
                  </button>
                </div>
                {showCreateNoteModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <h3 className="text-xl font-bold mb-4">Create New Note</h3>
                      <form onSubmit={handleCreateNote}>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Note title"
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content
                          </label>
                          <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows={10}
                            placeholder="Write your note here..."
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                          >
                            Create
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCreateNoteModal(false)}
                            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {notes.length === 0 ? (
                    <p className="text-gray-500 text-sm">No notes yet. Create one!</p>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => {
                          handleSelectNote(note);
                          setNoteTitle(note.title);
                          setNoteContent(note.content);
                          setNoteTags(note.tags || []);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition ${
                          selectedNote?.id === note.id
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="font-medium text-gray-800">{note.title}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {new Date(note.updated_at).toLocaleDateString()}
                        </div>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.map((tag, idx) => (
                              <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                {selectedNote ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          className="text-2xl font-bold text-gray-800 w-full px-2 py-1 border border-transparent hover:border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateNote}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => handleDeleteNote(selectedNote.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[300px]"
                      rows={15}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSummarizeNote}
                        disabled={loadingAI}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                      >
                        {loadingAI ? 'Processing...' : '📝 Summarize'}
                      </button>
                      <button
                        onClick={handleExplainNote}
                        disabled={loadingAI}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                      >
                        {loadingAI ? 'Processing...' : '💡 Explain'}
                      </button>
                      <button
                        onClick={handleOrganizeNote}
                        disabled={loadingAI}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
                      >
                        {loadingAI ? 'Processing...' : '📋 Organize'}
                      </button>
                    </div>
                    {noteSummary && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-2">Summary</h4>
                        <p className="text-gray-800 mb-2">{noteSummary.summary}</p>
                        <div className="mb-2">
                          <strong className="text-green-800">Key Points:</strong>
                          <ul className="list-disc list-inside text-gray-800">
                            {noteSummary.keyPoints.map((point, idx) => (
                              <li key={idx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                        {noteSummary.suggestedTags && noteSummary.suggestedTags.length > 0 && (
                          <div>
                            <strong className="text-green-800">Suggested Tags:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {noteSummary.suggestedTags.map((tag, idx) => (
                                <span key={idx} className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {noteExplanation && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-800 mb-2">Explanation</h4>
                        <p className="text-gray-800 mb-2 whitespace-pre-wrap">{noteExplanation.explanation}</p>
                        {noteExplanation.concepts && noteExplanation.concepts.length > 0 && (
                          <div>
                            <strong className="text-purple-800">Key Concepts:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {noteExplanation.concepts.map((concept, idx) => (
                                <span key={idx} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                                  {concept}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedNote.ai_summary && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">AI Summary</h4>
                        <p className="text-gray-700">{selectedNote.ai_summary}</p>
                      </div>
                    )}
                    {selectedNote.ai_explanation && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">AI Explanation</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedNote.ai_explanation}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-500">
                    Select a note or create a new one
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'symptom' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Symptom Check</h2>
                  <p className="text-gray-600 text-sm">
                    Get educational information about symptoms. This is not a medical diagnosis. Always consult a healthcare professional for medical advice.
                  </p>
                </div>

                <form onSubmit={handleCheckSymptoms} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe your symptoms *
                    </label>
                    <textarea
                      value={symptomInput}
                      onChange={(e) => setSymptomInput(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="e.g., I have been experiencing headaches for the past 3 days..."
                      required
                      disabled={checkingSymptoms}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Information (Optional)
                    </label>
                    <textarea
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="e.g., Started after a fall, worse in the morning..."
                      disabled={checkingSymptoms}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={checkingSymptoms || !symptomInput.trim()}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {checkingSymptoms ? 'Checking...' : 'Get Guidance'}
                  </button>
                </form>

                {symptomGuidance && (
                  <div className="mt-6 space-y-4">
                    <div className={`p-4 rounded-lg border-2 ${
                      symptomGuidance.severityLevel === 'emergency' ? 'bg-red-50 border-red-300' :
                      symptomGuidance.severityLevel === 'severe' ? 'bg-orange-50 border-orange-300' :
                      symptomGuidance.severityLevel === 'moderate' ? 'bg-yellow-50 border-yellow-300' :
                      'bg-green-50 border-green-300'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-800">Severity Level:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          symptomGuidance.severityLevel === 'emergency' ? 'bg-red-200 text-red-800' :
                          symptomGuidance.severityLevel === 'severe' ? 'bg-orange-200 text-orange-800' :
                          symptomGuidance.severityLevel === 'moderate' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-green-200 text-green-800'
                        }`}>
                          {symptomGuidance.severityLevel.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-2">Guidance</h3>
                      <p className="text-gray-800">{symptomGuidance.guidance}</p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Educational Information</h3>
                      <p className="text-gray-700">{symptomGuidance.educationalInfo}</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="font-semibold text-yellow-800 mb-2">When to Seek Help</h3>
                      <p className="text-gray-800">{symptomGuidance.whenToSeekHelp}</p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-semibold text-red-800 mb-2">⚠️ Important Disclaimer</h3>
                      <p className="text-red-700 text-sm">{symptomGuidance.disclaimer}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Checks</h3>
                <div className="space-y-2">
                  {symptomHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm">No previous symptom checks</p>
                  ) : (
                    symptomHistory.map((check) => (
                      <div
                        key={check.id}
                        onClick={() => {
                          setSymptomInput(check.symptoms);
                          setSymptomGuidance({
                            guidance: check.guidance,
                            educationalInfo: '',
                            whenToSeekHelp: '',
                            severityLevel: check.severity_level || 'mild',
                            disclaimer: 'This is educational information only and not a substitute for professional medical advice.',
                          });
                        }}
                        className="p-3 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-blue-300 transition"
                      >
                        <div className="text-sm font-medium text-gray-800 line-clamp-2">
                          {check.symptoms}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {new Date(check.created_at).toLocaleDateString()}
                        </div>
                        {check.severity_level && (
                          <div className="mt-1">
                            <span className={`text-xs px-2 py-1 rounded ${
                              check.severity_level === 'emergency' ? 'bg-red-200 text-red-800' :
                              check.severity_level === 'severe' ? 'bg-orange-200 text-orange-800' :
                              check.severity_level === 'moderate' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-green-200 text-green-800'
                            }`}>
                              {check.severity_level}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Chat Session Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Chat Session</h3>
            </div>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Are you sure you want to delete this chat session? This action cannot be undone and all messages in this session will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeleteSession}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSession}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Pod Confirmation Dialog */}
      {showDeletePodDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Study Pod</h3>
            </div>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Are you sure you want to delete this study pod? This action cannot be undone and all messages and members in this pod will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeletePod}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePod}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                Delete Pod
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Image Confirmation Dialog */}
      {showDeleteImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Image Analysis</h3>
            </div>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Are you sure you want to delete this image analysis? This action cannot be undone and the image, extracted text, and analysis will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeleteImage}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteImage}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                Delete Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

