import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Save, X, Loader2, 
  BookOpen, Users, Calendar, CheckCircle, AlertCircle, 
  Search, RefreshCw, ArrowLeft, School, GraduationCap,
  ChevronRight, Layers, Briefcase, Clock, Star
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const Subjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    subject_name: '',
    grade_level_id: '',
  });

  const token = localStorage.getItem('userToken');

  useEffect(() => {
    fetchSubjects();
    fetchGradeLevels();
  }, []);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/subjects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setSubjects(response.data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      showAlert('Failed to load subjects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGradeLevels = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/grade-levels`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setGradeLevels(response.data.grade_levels);
      }
    } catch (error) {
      console.error('Error fetching grade levels:', error);
    }
  };

  const showAlert = (message, type = 'success') => {
    if (type === 'success') {
      setSuccessMessage(message);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessMessage('');
      }, 3000);
    } else {
      setErrorMessage(message);
      setError(true);
      setTimeout(() => {
        setError(false);
        setErrorMessage('');
      }, 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Client-side validation for duplicate subject
    const gradeValue = parseInt(formData.grade_level_id);
    const selectedGrade = gradeLevels.find(g => g.id === gradeValue);
    const gradeDisplay = selectedGrade?.grade_display || (selectedGrade?.grade_level === 0 ? 'Kinder' : `Grade ${selectedGrade?.grade_level}`);

    if (!editingSubject) {
        const existingSubject = subjects.find(s => 
            s.subject_name === formData.subject_name.toUpperCase() && 
            s.grade_level_id === gradeValue
        );
        
        if (existingSubject) {
            showAlert(`Subject "${formData.subject_name}" already exists in ${gradeDisplay}! Please use a different subject name.`, 'error');
            setIsLoading(false);
            return;
        }
    } else {
        const existingSubject = subjects.find(s => 
            s.subject_name === formData.subject_name.toUpperCase() && 
            s.grade_level_id === gradeValue &&
            s.id !== editingSubject.id
        );
        
        if (existingSubject) {
            showAlert(`Subject "${formData.subject_name}" already exists in ${gradeDisplay}! Please use a different subject name.`, 'error');
            setIsLoading(false);
            return;
        }
    }

    try {
        let response;
        const submitData = {
            subject_name: formData.subject_name.toUpperCase(),
            grade_level_id: parseInt(formData.grade_level_id),
        };

        if (editingSubject) {
            response = await axios.put(`${API_URL}/admin/subjects/${editingSubject.id}`, submitData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } else {
            response = await axios.post(`${API_URL}/admin/subjects`, submitData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }

        if (response.data.success) {
            showAlert(
                editingSubject ? 'Subject updated successfully!' : 'Subject added successfully!', 
                'success'
            );
            setShowModal(false);
            setFormData({ subject_name: '', grade_level_id: '' });
            setEditingSubject(null);
            fetchSubjects();
        }
    } catch (error) {
        console.error('Error saving subject:', error);
        
        if (error.response?.status === 422) {
            const errors = error.response?.data?.errors;
            const message = error.response?.data?.message;
            
            if (message && message.includes('already exists')) {
                showAlert(message, 'error');
            } else if (errors && errors.subject_name) {
                showAlert(errors.subject_name[0], 'error');
            } else if (errors && errors.grade_level_id) {
                showAlert('Please select a grade level', 'error');
            } else {
                showAlert(error.response?.data?.message || 'Failed to save subject', 'error');
            }
        } else if (error.response?.data?.message?.includes('already exists')) {
            showAlert(error.response.data.message, 'error');
        } else {
            showAlert(error.response?.data?.message || 'Failed to save subject', 'error');
        }
    } finally {
        setIsLoading(false);
    }
};

  const handleDelete = async (subject) => {
    const gradeLevel = gradeLevels.find(g => g.id === subject.grade_level_id);
    const gradeDisplay = gradeLevel?.grade_display || `Grade ${subject.grade_level}`;
    
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to delete subject "${subject.subject_name}" from ${gradeDisplay}?\n\nThis will also delete:\n• All grades for this subject\n• All teacher assignments\n• All activities under this subject\n\nThis action cannot be undone!`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/admin/subjects/${subject.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchSubjects();
      showAlert(`Subject "${subject.subject_name}" deleted successfully!`, 'success');
    } catch (error) {
      console.error('Error deleting subject:', error);
      showAlert(error.response?.data?.message || 'Failed to delete subject', 'error');
    }
  };

  const getGradeDisplay = (grade) => {
    if (grade === 0) return 'Kinder';
    return `Grade ${grade}`;
  };

  const getSubjectIcon = (subjectName) => {
    const icons = {
      'MATH': '📐',
      'MATHEMATICS': '📐',
      'SCIENCE': '🔬',
      'ENGLISH': '📖',
      'FILIPINO': '🇵🇭',
      'ARALING PANLIPUNAN': '🏛️',
      'AP': '🏛️',
      'MAPEH': '🎨',
      'EPP': '💻',
      'TLE': '🔧',
      'ESP': '❤️',
      'VALUES': '💛',
    };
    return icons[subjectName?.toUpperCase()] || '📚';
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.subject_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === 'all' || subject.grade_level_id === parseInt(filterGrade);
    return matchesSearch && matchesGrade;
  });

  const sortedSubjects = [...filteredSubjects].sort((a, b) => {
    if (a.grade_level !== b.grade_level) return a.grade_level - b.grade_level;
    return a.subject_name.localeCompare(b.subject_name);
  });

  // Group subjects by grade level for display
  const groupedSubjects = sortedSubjects.reduce((acc, subject) => {
    const gradeKey = subject.grade_level_id;
    if (!acc[gradeKey]) {
      acc[gradeKey] = {
        grade_level: subject.grade_level,
        grade_display: subject.grade_display,
        subjects: []
      };
    }
    acc[gradeKey].subjects.push(subject);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <BookOpen size={24} className="text-indigo-600" />
                Subjects Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage subjects for each grade level (Kinder to Grade 6)
              </p>
            </div>
            
            <button 
              onClick={() => {
                setEditingSubject(null);
                setFormData({ subject_name: '', grade_level_id: '' });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
            >
              <Plus size={16} />
              Add Subject
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {showSuccess && (
          <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right-5 duration-300">
            <div className="bg-green-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 min-w-[300px]">
              <CheckCircle size={18} />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right-5 duration-300">
            <div className="bg-red-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 min-w-[300px]">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">{errorMessage}</span>
              <button onClick={() => setError(false)} className="ml-auto hover:text-red-200">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search subjects..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
            >
              <option value="all">All Grade Levels</option>
              {gradeLevels.map(grade => (
                <option key={grade.id} value={grade.id}>
                  {grade.grade_display}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subjects Display - Grouped by Grade Level */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-gray-500 text-sm mt-4">Loading subjects...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(groupedSubjects).map((group) => (
              <div key={group.grade_level} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {/* Grade Level Header */}
                <div className={`px-5 py-3 border-b border-gray-100 flex items-center justify-between ${
                  group.grade_level === 0 ? 'bg-emerald-50' : 'bg-indigo-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <GraduationCap size={18} className={group.grade_level === 0 ? 'text-emerald-600' : 'text-indigo-600'} />
                    <h3 className="font-semibold text-gray-800">{group.grade_display}</h3>
                    <span className="text-xs text-gray-500">({group.subjects.length} subjects)</span>
                  </div>
                </div>

                {/* Subjects List */}
                <div className="divide-y divide-gray-100">
                  {group.subjects.map((subject) => (
                    <div key={subject.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-xl">
                          {getSubjectIcon(subject.subject_name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{subject.subject_name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {subject.teacher_count > 0 && (
                              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Briefcase size={10} />
                                {subject.teacher_count} teacher{subject.teacher_count !== 1 ? 's' : ''}
                              </span>
                            )}
                            {subject.section_count > 0 && (
                              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Users size={10} />
                                {subject.section_count} section{subject.section_count !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingSubject(subject);
                            setFormData({
                              subject_name: subject.subject_name,
                              grade_level_id: subject.grade_level_id.toString(),
                            });
                            setShowModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(subject)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sortedSubjects.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Subjects Found</h3>
            <p className="text-gray-400 text-sm mb-4">Get started by adding your first subject</p>
            <button 
              onClick={() => {
                setEditingSubject(null);
                setFormData({ subject_name: '', grade_level_id: '' });
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm"
            >
              <Plus size={16} />
              Add Subject
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Subject Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={formData.subject_name}
                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                    placeholder="e.g., Mathematics, Science, English"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-sm uppercase"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Use uppercase letters for subject names</p>
                </div>

                {/* Grade Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade Level *
                  </label>
                  <select
                    value={formData.grade_level_id}
                    onChange={(e) => setFormData({ ...formData, grade_level_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-sm"
                    required
                  >
                    <option value="">Select Grade Level</option>
                    {gradeLevels.map(grade => (
                      <option key={grade.id} value={grade.id}>
                        {grade.grade_display}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isLoading ? 'Saving...' : (editingSubject ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subjects;