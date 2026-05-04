import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, Loader2, CheckCircle, AlertCircle, X,
  BookOpen, Users, GraduationCap, Calendar, TrendingUp,
  Search, Filter, RefreshCw, ArrowLeft, Lock, Unlock,
  Eye, ChevronRight, Edit3, Award, Target, Zap
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const GradeEncoding = () => {
  const navigate = useNavigate();
  const [schoolYears, setSchoolYears] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState({
    encodedCount: 0,
    totalCount: 0,
    completionRate: 0,
    averageGrade: 0
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
        const active = response.data.school_years.find(sy => sy.is_active);
        if (active) {
          setSelectedSchoolYear(active);
          fetchQuarters(active.id);
        }
      }
    } catch (error) {
      console.error('Error fetching school years:', error);
      showAlert('Failed to load school years', 'error');
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
        const active = response.data.quarters.find(q => q.is_active);
        if (active) {
          setSelectedQuarter(active);
        }
      }
    } catch (error) {
      console.error('Error fetching quarters:', error);
    }
  };

  const fetchSections = async () => {
    if (!selectedSchoolYear) return;
    
    try {
      const response = await axios.get(`${API_URL}/admin/sections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        // Filter sections by school year
        const filtered = response.data.sections.filter(s => s.school_year_id === selectedSchoolYear.id);
        setSections(filtered);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchSubjects = async () => {
    if (!selectedSection) return;
    
    try {
      const response = await axios.get(`${API_URL}/admin/subjects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        // Filter subjects by grade level of the section
        const section = sections.find(s => s.id === selectedSection.id);
        if (section) {
          const filtered = response.data.subjects.filter(s => s.grade_level_id === section.grade_level_id);
          setSubjects(filtered);
        }
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchStudentsAndGrades = async () => {
    if (!selectedSection || !selectedSubject || !selectedQuarter) return;
    
    setIsLoading(true);
    try {
      // Fetch students in the section
      const studentsResponse = await axios.get(`${API_URL}/admin/sections/${selectedSection.id}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (studentsResponse.data.success) {
        setStudents(studentsResponse.data.students);
        
        // Fetch existing grades
        const gradesResponse = await axios.get(`${API_URL}/admin/grades`, {
          params: {
            section_id: selectedSection.id,
            subject_id: selectedSubject.id,
            quarter_id: selectedQuarter.id
          },
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (gradesResponse.data.success) {
          const gradesMap = {};
          gradesResponse.data.grades.forEach(grade => {
            gradesMap[grade.student_id] = {
              written_works: grade.written_works,
              performance_tasks: grade.performance_tasks,
              quarterly_assessment: grade.quarterly_assessment,
              final_grade: grade.final_grade,
              id: grade.id
            };
          });
          setGrades(gradesMap);
          
          // Calculate stats
          const encoded = Object.keys(gradesMap).length;
          const total = studentsResponse.data.students.length;
          const avgGrade = Object.values(gradesMap).reduce((sum, g) => sum + (g.final_grade || 0), 0) / (encoded || 1);
          
          setStats({
            encodedCount: encoded,
            totalCount: total,
            completionRate: total > 0 ? (encoded / total) * 100 : 0,
            averageGrade: avgGrade || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('Failed to load students and grades', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSchoolYear) {
      fetchSections();
    }
  }, [selectedSchoolYear]);

  useEffect(() => {
    if (selectedSection) {
      fetchSubjects();
      setSelectedSubject(null);
      setStudents([]);
      setGrades({});
    }
  }, [selectedSection]);

  useEffect(() => {
    if (selectedSection && selectedSubject && selectedQuarter) {
      fetchStudentsAndGrades();
    }
  }, [selectedSection, selectedSubject, selectedQuarter]);

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

  const handleGradeChange = (studentId, field, value) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (isNaN(numValue)) return;
    
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: numValue,
        final_grade: prev[studentId]?.final_grade || null
      }
    }));
  };

  const calculateFinalGrade = (written, performance, assessment) => {
    const ww = written || 0;
    const pt = performance || 0;
    const qa = assessment || 0;
    
    // DepEd weights: Written Works 30%, Performance Tasks 50%, Quarterly Assessment 20%
    const final = (ww * 0.30) + (pt * 0.50) + (qa * 0.20);
    return Math.round(final);
  };

  const handleCalculate = (studentId) => {
    const grade = grades[studentId];
    if (grade) {
      const final = calculateFinalGrade(grade.written_works, grade.performance_tasks, grade.quarterly_assessment);
      setGrades(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          final_grade: final
        }
      }));
    }
  };

  const handleSaveAll = async () => {
    if (!selectedSection || !selectedSubject || !selectedQuarter) {
      showAlert('Please select all required fields', 'error');
      return;
    }
    
    if (selectedQuarter?.is_locked) {
      showAlert('This quarter is locked. Grades cannot be edited.', 'error');
      return;
    }
    
    setIsSaving(true);
    
    const gradesToSave = [];
    for (const student of students) {
      const grade = grades[student.id];
      if (grade) {
        gradesToSave.push({
          enrollment_id: student.enrollment_id,
          subject_id: selectedSubject.id,
          quarter_id: selectedQuarter.id,
          written_works: grade.written_works || 0,
          performance_tasks: grade.performance_tasks || 0,
          quarterly_assessment: grade.quarterly_assessment || 0,
          final_grade: grade.final_grade || calculateFinalGrade(grade.written_works, grade.performance_tasks, grade.quarterly_assessment)
        });
      }
    }
    
    try {
      const response = await axios.post(`${API_URL}/admin/grades/batch`, {
        grades: gradesToSave,
        section_id: selectedSection.id,
        subject_id: selectedSubject.id,
        quarter_id: selectedQuarter.id
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        showAlert(`Successfully saved grades for ${gradesToSave.length} student(s)!`, 'success');
        fetchStudentsAndGrades(); // Refresh data
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      showAlert(error.response?.data?.message || 'Failed to save grades', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lrn?.includes(searchTerm)
  );

  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-400';
    if (grade >= 90) return 'text-green-600';
    if (grade >= 85) return 'text-emerald-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 75) return 'text-indigo-600';
    return 'text-red-600';
  };

  const getGradeBgColor = (grade) => {
    if (!grade) return 'bg-gray-50';
    if (grade >= 90) return 'bg-green-50';
    if (grade >= 85) return 'bg-emerald-50';
    if (grade >= 80) return 'bg-blue-50';
    if (grade >= 75) return 'bg-indigo-50';
    return 'bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <Edit3 size={24} className="text-indigo-600" />
                Grade Encoding
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Encode and manage student grades by subject and quarter
              </p>
            </div>
            
            <button 
              onClick={() => navigate('/admin/grades')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
            >
              <Eye size={16} />
              View All Grades
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

        {/* Warning if quarter is locked */}
        {selectedQuarter?.is_locked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Lock size={20} className="text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">Quarter is Locked</p>
              <p className="text-xs text-amber-600">Grades cannot be edited because this quarter has been locked.</p>
            </div>
          </div>
        )}

        {/* Selection Filters */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* School Year */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">School Year</label>
              <select
                value={selectedSchoolYear?.id || ''}
                onChange={(e) => {
                  const sy = schoolYears.find(s => s.id === parseInt(e.target.value));
                  setSelectedSchoolYear(sy);
                  setSelectedSection(null);
                  setSelectedSubject(null);
                  setSelectedQuarter(null);
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
              >
                <option value="">Select School Year</option>
                {schoolYears.map(sy => (
                  <option key={sy.id} value={sy.id}>
                    {sy.year_start}-{sy.year_end} {sy.is_active ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quarter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quarter</label>
              <select
                value={selectedQuarter?.id || ''}
                onChange={(e) => {
                  const q = quarters.find(q => q.id === parseInt(e.target.value));
                  setSelectedQuarter(q);
                }}
                disabled={!selectedSchoolYear}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none disabled:opacity-50"
              >
                <option value="">Select Quarter</option>
                {quarters.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.name} {q.is_locked ? '(Locked)' : q.is_active ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
              <select
                value={selectedSection?.id || ''}
                onChange={(e) => {
                  const sec = sections.find(s => s.id === parseInt(e.target.value));
                  setSelectedSection(sec);
                }}
                disabled={!selectedSchoolYear}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none disabled:opacity-50"
              >
                <option value="">Select Section</option>
                {sections.map(sec => (
                  <option key={sec.id} value={sec.id}>
                    {sec.grade_display} - {sec.section_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
              <select
                value={selectedSubject?.id || ''}
                onChange={(e) => {
                  const subj = subjects.find(s => s.id === parseInt(e.target.value));
                  setSelectedSubject(subj);
                }}
                disabled={!selectedSection}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none disabled:opacity-50"
              >
                <option value="">Select Subject</option>
                {subjects.map(subj => (
                  <option key={subj.id} value={subj.id}>
                    {subj.subject_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        {selectedSection && selectedSubject && selectedQuarter && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.completionRate.toFixed(1)}%</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Target size={18} className="text-indigo-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{stats.encodedCount} of {stats.totalCount} students</p>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Average Grade</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.averageGrade.toFixed(1)}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <TrendingUp size={18} className="text-emerald-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Passing</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Object.values(grades).filter(g => g.final_grade >= 75).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Award size={18} className="text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Failing</p>
                  <p className="text-2xl font-bold text-red-600">
                    {Object.values(grades).filter(g => g.final_grade < 75 && g.final_grade > 0).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertCircle size={18} className="text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {students.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search student by name or LRN..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Grades Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-gray-500 text-sm mt-4">Loading data...</p>
          </div>
        ) : !selectedSection || !selectedSubject || !selectedQuarter ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Edit3 size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Select Filters</h3>
            <p className="text-gray-400 text-sm">Please select school year, quarter, section, and subject to start encoding grades</p>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Students Found</h3>
            <p className="text-gray-400 text-sm">No students are enrolled in this section</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">LRN</th>
                      <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Written Works<br/>(30%)</th>
                      <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Performance Tasks<br/>(50%)</th>
                      <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Quarterly Assessment<br/>(20%)</th>
                      <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="text-center px-5 py-3 text-[11px] font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50/50">Final Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredStudents.map((student) => {
                      const grade = grades[student.id] || {};
                      const finalGrade = grade.final_grade || calculateFinalGrade(grade.written_works, grade.performance_tasks, grade.quarterly_assessment);
                      
                      return (
                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-indigo-600">
                                  {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 text-sm">{student.full_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="font-mono text-xs text-gray-600">{student.lrn || 'N/A'}</span>
                          </td>
                          <td className="px-5 py-3">
                            <input
                              type="number"
                              value={grade.written_works || ''}
                              onChange={(e) => handleGradeChange(student.id, 'written_works', e.target.value)}
                              disabled={selectedQuarter?.is_locked}
                              className="w-20 mx-auto text-center px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 outline-none text-sm disabled:opacity-50"
                              step="0.01"
                              min="0"
                              max="100"
                            />
                          </td>
                          <td className="px-5 py-3">
                            <input
                              type="number"
                              value={grade.performance_tasks || ''}
                              onChange={(e) => handleGradeChange(student.id, 'performance_tasks', e.target.value)}
                              disabled={selectedQuarter?.is_locked}
                              className="w-20 mx-auto text-center px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 outline-none text-sm disabled:opacity-50"
                              step="0.01"
                              min="0"
                              max="100"
                            />
                          </td>
                          <td className="px-5 py-3">
                            <input
                              type="number"
                              value={grade.quarterly_assessment || ''}
                              onChange={(e) => handleGradeChange(student.id, 'quarterly_assessment', e.target.value)}
                              disabled={selectedQuarter?.is_locked}
                              className="w-20 mx-auto text-center px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 outline-none text-sm disabled:opacity-50"
                              step="0.01"
                              min="0"
                              max="100"
                            />
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => handleCalculate(student.id)}
                              disabled={selectedQuarter?.is_locked}
                              className="px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Calculate
                            </button>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-16 py-1.5 rounded-lg text-sm font-bold ${getGradeBgColor(finalGrade)} ${getGradeColor(finalGrade)}`}>
                              {finalGrade || '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveAll}
                disabled={isSaving || selectedQuarter?.is_locked}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isSaving || selectedQuarter?.is_locked
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Saving...' : 'Save All Grades'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GradeEncoding;