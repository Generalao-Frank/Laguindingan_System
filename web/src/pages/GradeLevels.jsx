import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Save, X, Loader2, 
  GraduationCap, Users, BookOpen, Calendar, CheckCircle,
  AlertCircle, Search, RefreshCw, ArrowLeft, TrendingUp,
  Layers, School, Award, Star, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const GradeLevels = () => {
  const navigate = useNavigate();
  const [gradeLevels, setGradeLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    grade_level: '',
  });

 
  const token = localStorage.getItem('userToken');

  useEffect(() => {
    fetchGradeLevels();
  }, []);

  const fetchGradeLevels = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/grade-levels`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setGradeLevels(response.data.grade_levels);
      }
    } catch (error) {
      console.error('Error fetching grade levels:', error);
      showAlert('Failed to load grade levels', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Custom alert function
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

    // Validate if grade level already exists
    const gradeValue = parseInt(formData.grade_level);
    const existingGrade = gradeLevels.find(g => g.grade_level === gradeValue);
    
    if (!editingGrade && existingGrade) {
      showAlert(`${getGradeDisplay(gradeValue)} already exists! Please choose a different grade level.`, 'error');
      setIsLoading(false);
      return;
    }
    
    if (editingGrade && existingGrade && existingGrade.id !== editingGrade.id) {
      showAlert(`${getGradeDisplay(gradeValue)} already exists! Please choose a different grade level.`, 'error');
      setIsLoading(false);
      return;
    }

    try {
      let response;
      if (editingGrade) {
        response = await axios.put(`${API_URL}/admin/grade-levels/${editingGrade.id}`, formData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        response = await axios.post(`${API_URL}/admin/grade-levels`, formData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      if (response.data.success) {
        showAlert(
          editingGrade ? 'Grade level updated successfully!' : 'Grade level added successfully!', 
          'success'
        );
        setShowModal(false);
        setFormData({ grade_level: '' });
        setEditingGrade(null);
        fetchGradeLevels();
      }
    } catch (error) {
      console.error('Error saving grade level:', error);
      
      // Handle duplicate entry error from backend
      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;
        if (errors && errors.grade_level) {
          if (errors.grade_level.includes('already taken') || errors.grade_level.includes('unique')) {
            showAlert(`Grade level ${getGradeDisplay(parseInt(formData.grade_level))} already exists! Please choose a different grade level.`, 'error');
          } else {
            showAlert(errors.grade_level[0] || 'Validation failed', 'error');
          }
        } else {
          showAlert(error.response?.data?.message || 'Failed to save grade level', 'error');
        }
      } else if (error.response?.data?.message?.includes('Duplicate entry')) {
        showAlert(`Grade level already exists! Please choose a different grade level.`, 'error');
      } else {
        showAlert(error.response?.data?.message || 'Failed to save grade level', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (gradeLevel) => {
    const gradeDisplay = gradeLevel.grade_level === 0 ? 'Kinder' : `Grade ${gradeLevel.grade_level}`;
    
    // Custom confirm dialog
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to delete ${gradeDisplay}?\n\nThis will also delete:\n• All sections under this grade level\n• All subjects under this grade level\n• All student enrollments\n\nThis action cannot be undone!`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/admin/grade-levels/${gradeLevel.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchGradeLevels();
      showAlert(`${gradeDisplay} deleted successfully!`, 'success');
    } catch (error) {
      console.error('Error deleting grade level:', error);
      
      if (error.response?.status === 400) {
        showAlert(error.response?.data?.message || 'Cannot delete grade level with existing data', 'error');
      } else {
        showAlert(error.response?.data?.message || 'Failed to delete grade level', 'error');
      }
    }
  };

  const getGradeDisplay = (grade) => {
    if (grade === 0) return 'Kinder';
    return `Grade ${grade}`;
  };

  const getGradeColor = (grade) => {
    const colors = {
      0: 'from-emerald-500 to-teal-500',
      1: 'from-blue-500 to-indigo-500',
      2: 'from-indigo-500 to-purple-500',
      3: 'from-purple-500 to-pink-500',
      4: 'from-rose-500 to-red-500',
      5: 'from-orange-500 to-amber-500',
      6: 'from-green-500 to-emerald-500',
    };
    return colors[grade] || 'from-gray-500 to-gray-600';
  };

  const getGradeBgColor = (grade) => {
    const colors = {
      0: 'bg-emerald-50',
      1: 'bg-blue-50',
      2: 'bg-indigo-50',
      3: 'bg-purple-50',
      4: 'bg-rose-50',
      5: 'bg-orange-50',
      6: 'bg-green-50',
    };
    return colors[grade] || 'bg-gray-50';
  };

  const getGradeIconColor = (grade) => {
    const colors = {
      0: 'text-emerald-600',
      1: 'text-blue-600',
      2: 'text-indigo-600',
      3: 'text-purple-600',
      4: 'text-rose-600',
      5: 'text-orange-600',
      6: 'text-green-600',
    };
    return colors[grade] || 'text-gray-600';
  };

  const filteredGradeLevels = gradeLevels.filter(grade => 
    getGradeDisplay(grade.grade_level).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedGradeLevels = [...filteredGradeLevels].sort((a, b) => a.grade_level - b.grade_level);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <Layers size={24} className="text-indigo-600" />
                Grade Levels
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage grade levels from Kinder to Grade 6
              </p>
            </div>
            
            <button 
              onClick={() => {
                setEditingGrade(null);
                setFormData({ grade_level: '' });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
            >
              <Plus size={16} />
              Add Grade Level
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

        {/* Search Bar */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search grade levels..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Grade Levels Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-gray-500 text-sm mt-4">Loading grade levels...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sortedGradeLevels.map((grade) => (
              <div 
                key={grade.id} 
                className={`bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 group ${getGradeBgColor(grade.grade_level)}`}
              >
                {/* Card Header with Gradient */}
                <div className={`bg-gradient-to-r ${getGradeColor(grade.grade_level)} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={20} className="text-white/90" />
                      <h3 className="text-lg font-bold">{grade.grade_display || getGradeDisplay(grade.grade_level)}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingGrade(grade);
                          setFormData({ grade_level: grade.grade_level.toString() });
                          setShowModal(true);
                        }}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                      >
                        <Edit2 size={14} className="text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(grade)}
                        className="p-1.5 bg-white/20 hover:bg-red-500/50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users size={14} />
                        <span className="text-xs">Sections</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{grade.sections_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <BookOpen size={14} />
                        <span className="text-xs">Subjects</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{grade.subjects_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users size={14} />
                        <span className="text-xs">Students</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{grade.students_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Award size={14} />
                        <span className="text-xs">Status</span>
                      </div>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                  </div>

                  <div className="my-3 border-t border-gray-100"></div>

                  <button 
                    onClick={() => navigate(`/admin/grade-levels/${grade.id}/sections`)}
                    className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    View Sections
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sortedGradeLevels.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Grade Levels Found</h3>
            <p className="text-gray-400 text-sm mb-4">Get started by adding your first grade level</p>
            <button 
              onClick={() => {
                setEditingGrade(null);
                setFormData({ grade_level: '' });
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm"
            >
              <Plus size={16} />
              Add Grade Level
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingGrade ? 'Edit Grade Level' : 'Add New Grade Level'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade Level *
                  </label>
                  <select
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-sm"
                    required
                  >
                    <option value="">Select Grade Level</option>
                    <option value="0">Kinder</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                    <option value="6">Grade 6</option>
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {editingGrade ? 'Update the grade level' : 'Select the grade level to add'}
                  </p>
                  {!editingGrade && (
                    <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={10} />
                      Note: Each grade level can only be added once
                    </p>
                  )}
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
                    {isLoading ? 'Saving...' : (editingGrade ? 'Update' : 'Save')}
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

export default GradeLevels;