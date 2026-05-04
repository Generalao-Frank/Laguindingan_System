import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Save, X, Loader2, 
  Calendar, CheckCircle, AlertCircle, Search, 
  RefreshCw, ArrowLeft, TrendingUp, Clock, 
  Award, Zap, ChevronRight, Layers, BookOpen
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const SchoolYears = () => {
  const navigate = useNavigate();
  const [schoolYears, setSchoolYears] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState({
    totalYears: 0,
    activeYear: null,
    completedYears: 0,
    totalQuarters: 0
  });
  
  const [formData, setFormData] = useState({
    year_start: '',
    year_end: '',
    is_active: false,
  });


  const token = localStorage.getItem('userToken');

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  const fetchSchoolYears = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/school-years`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setSchoolYears(response.data.school_years);
        calculateStats(response.data.school_years);
      }
    } catch (error) {
      console.error('Error fetching school years:', error);
      showAlert('Failed to load school years', 'error');
      // Fallback data
      const fallbackData = [
        { id: 1, year_start: 2022, year_end: 2023, is_active: false, quarters_count: 4 },
        { id: 2, year_start: 2023, year_end: 2024, is_active: false, quarters_count: 4 },
        { id: 3, year_start: 2024, year_end: 2025, is_active: true, quarters_count: 4 },
      ];
      setSchoolYears(fallbackData);
      calculateStats(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (years) => {
    const active = years.find(y => y.is_active);
    setStats({
      totalYears: years.length,
      activeYear: active ? `${active.year_start}-${active.year_end}` : null,
      completedYears: years.filter(y => !y.is_active && y.year_end < new Date().getFullYear()).length,
      totalQuarters: years.reduce((sum, y) => sum + (y.quarters_count || 4), 0)
    });
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

  const validateYearRange = () => {
    const start = parseInt(formData.year_start);
    const end = parseInt(formData.year_end);
    
    if (end !== start + 1) {
      showAlert('School year must be consecutive (e.g., 2024-2025)', 'error');
      return false;
    }
    
    if (start < 2000 || start > 2100) {
      showAlert('Invalid year range', 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateYearRange()) {
      return;
    }
    
    setIsLoading(true);

    // Check for duplicate school year
    const startYear = parseInt(formData.year_start);
    const endYear = parseInt(formData.year_end);
    
    if (!editingYear) {
      const existing = schoolYears.find(sy => 
        sy.year_start === startYear && sy.year_end === endYear
      );
      
      if (existing) {
        showAlert(`School year ${startYear}-${endYear} already exists!`, 'error');
        setIsLoading(false);
        return;
      }
    } else {
      const existing = schoolYears.find(sy => 
        sy.year_start === startYear && 
        sy.year_end === endYear && 
        sy.id !== editingYear.id
      );
      
      if (existing) {
        showAlert(`School year ${startYear}-${endYear} already exists!`, 'error');
        setIsLoading(false);
        return;
      }
    }

    try {
      let response;
      const submitData = {
        year_start: startYear,
        year_end: endYear,
        is_active: formData.is_active,
      };

      if (editingYear) {
        response = await axios.put(`${API_URL}/admin/school-years/${editingYear.id}`, submitData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        response = await axios.post(`${API_URL}/admin/school-years`, submitData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      if (response.data.success) {
        showAlert(
          editingYear ? 'School year updated successfully!' : 'School year added successfully!', 
          'success'
        );
        setShowModal(false);
        setFormData({ year_start: '', year_end: '', is_active: false });
        setEditingYear(null);
        fetchSchoolYears();
      }
    } catch (error) {
      console.error('Error saving school year:', error);
      
      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;
        if (errors && errors.year_start) {
          showAlert(errors.year_start[0], 'error');
        } else if (errors && errors.year_end) {
          showAlert(errors.year_end[0], 'error');
        } else {
          showAlert(error.response?.data?.message || 'Failed to save school year', 'error');
        }
      } else if (error.response?.data?.message?.includes('already exists')) {
        showAlert(`School year ${formData.year_start}-${formData.year_end} already exists!`, 'error');
      } else {
        showAlert(error.response?.data?.message || 'Failed to save school year', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetActive = async (id) => {
    const schoolYear = schoolYears.find(sy => sy.id === id);
    if (!schoolYear) return;
    
    if (!window.confirm(`Set ${schoolYear.year_start}-${schoolYear.year_end} as the active school year?\n\nThe previous active school year will be deactivated.`)) {
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/admin/school-years/${id}`, {
        year_start: schoolYear.year_start,
        year_end: schoolYear.year_end,
        is_active: true,
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        showAlert(`${schoolYear.year_start}-${schoolYear.year_end} is now the active school year!`, 'success');
        fetchSchoolYears();
      }
    } catch (error) {
      console.error('Error setting active school year:', error);
      showAlert(error.response?.data?.message || 'Failed to set active school year', 'error');
    }
  };

  const handleDelete = async (schoolYear) => {
    if (schoolYear.is_active) {
      showAlert('Cannot delete the active school year. Please set another school year as active first.', 'error');
      return;
    }
    
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to delete school year ${schoolYear.year_start}-${schoolYear.year_end}?\n\nThis will also delete:\n• All quarters under this school year\n• All enrollments\n• All grades\n• All attendance records\n\nThis action cannot be undone!`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/admin/school-years/${schoolYear.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchSchoolYears();
      showAlert(`School year ${schoolYear.year_start}-${schoolYear.year_end} deleted successfully!`, 'success');
    } catch (error) {
      console.error('Error deleting school year:', error);
      showAlert(error.response?.data?.message || 'Failed to delete school year', 'error');
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700"><Zap size={10} /> Active</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">Inactive</span>;
  };

  const filteredSchoolYears = schoolYears.filter(sy => 
    `${sy.year_start}-${sy.year_end}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSchoolYears = [...filteredSchoolYears].sort((a, b) => b.year_start - a.year_start);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <Calendar size={24} className="text-indigo-600" />
                School Years Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage academic school years and set active term
              </p>
            </div>
            
            <button 
              onClick={() => {
                setEditingYear(null);
                setFormData({ year_start: '', year_end: '', is_active: false });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
            >
              <Plus size={16} />
              Add School Year
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total School Years</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalYears}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Calendar size={18} className="text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Active Year</p>
                <p className="text-xl font-bold text-green-600 mt-1">{stats.activeYear || 'None'}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Award size={18} className="text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Completed Years</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.completedYears}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle size={18} className="text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total Quarters</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalQuarters}</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Clock size={18} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search school years..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* School Years Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-gray-500 text-sm mt-4">Loading school years...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedSchoolYears.map((schoolYear) => (
              <div 
                key={schoolYear.id} 
                className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 group ${
                  schoolYear.is_active ? 'border-green-200 ring-1 ring-green-200' : 'border-gray-100'
                }`}
              >
                <div className={`p-4 ${
                  schoolYear.is_active 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-gray-600 to-gray-700'
                } text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={20} className="text-white/90" />
                      <h3 className="text-lg font-bold">{schoolYear.year_start}-{schoolYear.year_end}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {!schoolYear.is_active && (
                        <button
                          onClick={() => handleSetActive(schoolYear.id)}
                          className="p-1.5 bg-white/20 hover:bg-green-500/70 rounded-lg transition-all"
                          title="Set as Active"
                        >
                          <Zap size={14} className="text-white" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingYear(schoolYear);
                          setFormData({
                            year_start: schoolYear.year_start.toString(),
                            year_end: schoolYear.year_end.toString(),
                            is_active: schoolYear.is_active,
                          });
                          setShowModal(true);
                        }}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                      >
                        <Edit2 size={14} className="text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(schoolYear)}
                        className="p-1.5 bg-white/20 hover:bg-red-500/50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock size={14} />
                        <span className="text-xs">Status</span>
                      </div>
                      {getStatusBadge(schoolYear.is_active)}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Layers size={14} />
                        <span className="text-xs">Quarters</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{schoolYear.quarters_count || 4}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <TrendingUp size={14} />
                        <span className="text-xs">Enrollments</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{schoolYear.enrollments_count || 0}</span>
                    </div>
                  </div>

                  <div className="my-3 border-t border-gray-100"></div>

                  <button 
                    onClick={() => navigate(`/admin/school-years/${schoolYear.id}/quarters`)}
                    className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    Manage Quarters
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sortedSchoolYears.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No School Years Found</h3>
            <p className="text-gray-400 text-sm mb-4">Get started by adding your first school year</p>
            <button 
              onClick={() => {
                setEditingYear(null);
                setFormData({ year_start: '', year_end: '', is_active: false });
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm"
            >
              <Plus size={16} />
              Add School Year
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingYear ? 'Edit School Year' : 'Add New School Year'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Year Start */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Start *
                  </label>
                  <input
                    type="number"
                    value={formData.year_start}
                    onChange={(e) => setFormData({ ...formData, year_start: e.target.value })}
                    placeholder="e.g., 2024"
                    min="2000"
                    max="2100"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-sm"
                    required
                  />
                </div>

                {/* Year End */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year End *
                  </label>
                  <input
                    type="number"
                    value={formData.year_end}
                    onChange={(e) => setFormData({ ...formData, year_end: e.target.value })}
                    placeholder="e.g., 2025"
                    min="2001"
                    max="2101"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-sm"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Must be exactly one year after the start year (e.g., 2024-2025)</p>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Set as active school year
                  </label>
                </div>
                {formData.is_active && (
                  <p className="text-[10px] text-amber-600 -mt-2">
                    ⚠️ Setting this as active will deactivate the current active school year
                  </p>
                )}

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
                    {isLoading ? 'Saving...' : (editingYear ? 'Update' : 'Save')}
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

export default SchoolYears;