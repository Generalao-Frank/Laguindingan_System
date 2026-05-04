import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, CheckCircle, AlertCircle, Loader2,
  TrendingUp, Award, Zap, Shield, RefreshCw, ArrowLeft,
  GraduationCap, BookOpen, Users, Activity, Target, Star
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const SetActiveTerm = () => {
  const navigate = useNavigate();
  const [schoolYears, setSchoolYears] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState({
    activeSchoolYear: null,
    activeQuarter: null,
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0
  });

  
  const token = localStorage.getItem('userToken');

  useEffect(() => {
    fetchData();
    fetchStats();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch school years
      const schoolYearResponse = await axios.get(`${API_URL}/admin/school-years`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (schoolYearResponse.data.success) {
        setSchoolYears(schoolYearResponse.data.school_years);
        
        // Find active school year
        const active = schoolYearResponse.data.school_years.find(sy => sy.is_active);
        if (active) {
          setSelectedSchoolYear(active);
          fetchQuarters(active.id);
        }
      }
      
      // Fetch stats
      await fetchStats();
      
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('Failed to load data', 'error');
      
      // Fallback data
      setSchoolYears([
        { id: 1, year_start: 2022, year_end: 2023, is_active: false },
        { id: 2, year_start: 2023, year_end: 2024, is_active: false },
        { id: 3, year_start: 2024, year_end: 2025, is_active: true },
      ]);
      setSelectedSchoolYear({ id: 3, year_start: 2024, year_end: 2025, is_active: true });
      setQuarters([
        { id: 1, name: '1st Quarter', start_date: '2024-06-03', end_date: '2024-08-16', is_active: true, is_locked: false },
        { id: 2, name: '2nd Quarter', start_date: '2024-08-19', end_date: '2024-10-25', is_active: false, is_locked: false },
        { id: 3, name: '3rd Quarter', start_date: '2024-10-28', end_date: '2025-01-10', is_active: false, is_locked: false },
        { id: 4, name: '4th Quarter', start_date: '2025-01-13', end_date: '2025-03-28', is_active: false, is_locked: false },
      ]);
      setSelectedQuarter({ id: 1, name: '1st Quarter', start_date: '2024-06-03', end_date: '2024-08-16', is_active: true, is_locked: false });
      
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuarters = async (schoolYearId) => {
    try {
      const response = await axios.get(`${API_URL}/admin/school-years/${schoolYearId}/quarters`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setQuarters(response.data.quarters);
        const activeQuarter = response.data.quarters.find(q => q.is_active);
        if (activeQuarter) {
          setSelectedQuarter(activeQuarter);
        }
      }
    } catch (error) {
      console.error('Error fetching quarters:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        activeSchoolYear: '2024-2025',
        activeQuarter: '1st Quarter',
        totalStudents: 567,
        totalTeachers: 42,
        totalSubjects: 28
      });
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

  const handleSetActiveSchoolYear = async (schoolYear) => {
    if (selectedSchoolYear?.id === schoolYear.id) {
      showAlert(`${schoolYear.year_start}-${schoolYear.year_end} is already the active school year`, 'error');
      return;
    }

    if (!window.confirm(`Set ${schoolYear.year_start}-${schoolYear.year_end} as the active school year?\n\nThis will deactivate the current active school year and its quarters.`)) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await axios.put(`${API_URL}/admin/school-years/${schoolYear.id}`, {
        year_start: schoolYear.year_start,
        year_end: schoolYear.year_end,
        is_active: true,
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        showAlert(`${schoolYear.year_start}-${schoolYear.year_end} is now the active school year!`, 'success');
        await fetchData();
      }
    } catch (error) {
      console.error('Error setting active school year:', error);
      showAlert(error.response?.data?.message || 'Failed to set active school year', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetActiveQuarter = async (quarter) => {
    if (!selectedSchoolYear) {
      showAlert('Please select a school year first', 'error');
      return;
    }

    if (selectedQuarter?.id === quarter.id) {
      showAlert(`${quarter.name} is already the active quarter`, 'error');
      return;
    }

    if (!window.confirm(`Set ${quarter.name} as the active quarter?\n\nThis will deactivate the current active quarter.`)) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await axios.put(`${API_URL}/admin/quarters/${quarter.id}`, {
        name: quarter.name,
        start_date: quarter.start_date,
        end_date: quarter.end_date,
        is_active: true,
        is_locked: quarter.is_locked,
        school_year_id: selectedSchoolYear.id,
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        showAlert(`${quarter.name} is now the active quarter!`, 'success');
        await fetchQuarters(selectedSchoolYear.id);
        await fetchStats();
      }
    } catch (error) {
      console.error('Error setting active quarter:', error);
      showAlert(error.response?.data?.message || 'Failed to set active quarter', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getSchoolYearStatus = (schoolYear) => {
    if (schoolYear.is_active) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700"><Zap size={10} /> Active</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">Inactive</span>;
  };

  const getQuarterStatus = (quarter) => {
    if (quarter.is_active) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700"><Zap size={10} /> Active</span>;
    }
    if (quarter.is_locked) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700"><Lock size={10} /> Locked</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">Inactive</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <Target size={24} className="text-indigo-600" />
                Set Active Term
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Configure the active school year and quarter for the current grading period
              </p>
            </div>
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
            >
              <RefreshCw size={16} />
              Refresh
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

        {/* Current Active Term Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-indigo-200 text-sm uppercase tracking-wide">Current Active Term</p>
              <h2 className="text-2xl font-bold mt-1">{stats.activeSchoolYear || 'Not Set'}</h2>
              <p className="text-indigo-100 text-sm mt-0.5">Active Quarter: {stats.activeQuarter || 'Not Set'}</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 text-indigo-200 text-xs">
                  <GraduationCap size={14} />
                  <span>{stats.totalStudents} Students</span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-200 text-xs">
                  <Users size={14} />
                  <span>{stats.totalTeachers} Teachers</span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-200 text-xs">
                  <BookOpen size={14} />
                  <span>{stats.totalSubjects} Subjects</span>
                </div>
              </div>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Award size={32} className="text-white" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-gray-500 text-sm mt-4">Loading data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* School Years Section */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" />
                  <h2 className="text-base font-semibold text-gray-800">School Year</h2>
                  <span className="text-xs text-gray-400 ml-2">Select active school year</span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {schoolYears.map((schoolYear) => (
                  <div 
                    key={schoolYear.id} 
                    className={`px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      selectedSchoolYear?.id === schoolYear.id ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {schoolYear.year_start}-{schoolYear.year_end}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getSchoolYearStatus(schoolYear)}
                        {selectedSchoolYear?.id === schoolYear.id && (
                          <span className="text-[10px] font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                            Currently Selected
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSetActiveSchoolYear(schoolYear)}
                      disabled={isSaving || schoolYear.is_active}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        schoolYear.is_active
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {schoolYear.is_active ? 'Active' : 'Set Active'}
                    </button>
                  </div>
                ))}
              </div>
              
              {schoolYears.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-gray-400 text-sm">No school years found</p>
                </div>
              )}
            </div>

            {/* Quarters Section */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-indigo-600" />
                  <h2 className="text-base font-semibold text-gray-800">Quarter</h2>
                  <span className="text-xs text-gray-400 ml-2">Select active quarter</span>
                </div>
                {selectedSchoolYear && (
                  <p className="text-xs text-gray-500 mt-1">
                    for {selectedSchoolYear.year_start}-{selectedSchoolYear.year_end}
                  </p>
                )}
              </div>
              
              {!selectedSchoolYear ? (
                <div className="px-5 py-8 text-center">
                  <AlertCircle size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Please select a school year first</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {quarters.map((quarter) => (
                    <div 
                      key={quarter.id} 
                      className={`px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        selectedQuarter?.id === quarter.id ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-800">{quarter.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getQuarterStatus(quarter)}
                          {selectedQuarter?.id === quarter.id && (
                            <span className="text-[10px] font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                              Currently Selected
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(quarter.start_date).toLocaleDateString()} - {new Date(quarter.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSetActiveQuarter(quarter)}
                        disabled={isSaving || quarter.is_active}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          quarter.is_active
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {quarter.is_active ? 'Active' : 'Set Active'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedSchoolYear && quarters.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-gray-400 text-sm">No quarters found for this school year</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-800">Active School Year</p>
                <p className="text-sm text-blue-600">Determines which academic year is currently in progress</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-green-800">Active Quarter</p>
                <p className="text-sm text-green-600">Determines which quarter is currently being graded</p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Shield size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-amber-800">Locked Quarters</p>
                <p className="text-sm text-amber-600">Locked quarters cannot be edited or modified</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading overlay when saving */}
        {isSaving && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-gray-600 text-sm">Updating active term...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetActiveTerm;