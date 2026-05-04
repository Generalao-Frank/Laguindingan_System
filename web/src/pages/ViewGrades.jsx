import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, Download, Printer, Search, Filter, Calendar, 
  BookOpen, Users, GraduationCap, ChevronRight, 
  TrendingUp, Award, AlertCircle, Loader2, X,
  CheckCircle, Clock, FileText, Edit3
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const ViewGrades = () => {
  const navigate = useNavigate();
  const [schoolYears, setSchoolYears] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageGrade: 0,
    passingCount: 0,
    failingCount: 0,
    highestGrade: 0,
    lowestGrade: 0
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

  const fetchGrades = async () => {
    if (!selectedSection || !selectedSubject || !selectedQuarter) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/grades`, {
        params: {
          section_id: selectedSection.id,
          subject_id: selectedSubject.id,
          quarter_id: selectedQuarter.id
        },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setGrades(response.data.grades);
        calculateStats(response.data.grades);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (gradesData) => {
    const validGrades = gradesData.filter(g => g.final_grade && g.final_grade > 0);
    const total = validGrades.length;
    
    if (total === 0) {
      setStats({
        totalStudents: gradesData.length,
        averageGrade: 0,
        passingCount: 0,
        failingCount: 0,
        highestGrade: 0,
        lowestGrade: 0
      });
      return;
    }
    
    const passing = validGrades.filter(g => g.final_grade >= 75).length;
    const failing = validGrades.filter(g => g.final_grade < 75).length;
    const avg = validGrades.reduce((sum, g) => sum + g.final_grade, 0) / total;
    const highest = Math.max(...validGrades.map(g => g.final_grade));
    const lowest = Math.min(...validGrades.map(g => g.final_grade));
    
    setStats({
      totalStudents: gradesData.length,
      averageGrade: avg,
      passingCount: passing,
      failingCount: failing,
      highestGrade: highest,
      lowestGrade: lowest
    });
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
      setGrades([]);
    }
  }, [selectedSection]);

  useEffect(() => {
    if (selectedSection && selectedSubject && selectedQuarter) {
      fetchGrades();
    }
  }, [selectedSection, selectedSubject, selectedQuarter]);

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

  const getPassingStatus = (grade) => {
    if (!grade) return { label: 'No Grade', color: 'bg-gray-100 text-gray-500' };
    if (grade >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-700' };
    if (grade >= 85) return { label: 'Very Good', color: 'bg-emerald-100 text-emerald-700' };
    if (grade >= 80) return { label: 'Good', color: 'bg-blue-100 text-blue-700' };
    if (grade >= 75) return { label: 'Passed', color: 'bg-indigo-100 text-indigo-700' };
    return { label: 'Failed', color: 'bg-red-100 text-red-700' };
  };

  const filteredGrades = grades.filter(grade =>
    grade.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <Eye size={24} className="text-indigo-600" />
                View All Grades
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                View and analyze student grades by subject and quarter
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
              >
                <Printer size={16} />
                Print
              </button>
              <button 
                onClick={() => navigate('/admin/grades/encode')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
              >
                <Edit3 size={16} />
                Encode Grades
              </button>
            </div>
          </div>
        </div>

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
        {selectedSection && selectedSubject && selectedQuarter && grades.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase">Students</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase">Average</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.averageGrade.toFixed(1)}</p>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase">Highest</p>
              <p className="text-2xl font-bold text-green-600">{stats.highestGrade}</p>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase">Lowest</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowestGrade}</p>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase">Passed</p>
              <p className="text-2xl font-bold text-green-600">{stats.passingCount}</p>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failingCount}</p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {grades.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search student by name..."
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
            <p className="text-gray-500 text-sm mt-4">Loading grades...</p>
          </div>
        ) : !selectedSection || !selectedSubject || !selectedQuarter ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Select Filters</h3>
            <p className="text-gray-400 text-sm">Please select school year, quarter, section, and subject to view grades</p>
          </div>
        ) : grades.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Grades Found</h3>
            <p className="text-gray-400 text-sm">No grades have been encoded for this selection yet</p>
            <button 
              onClick={() => navigate('/admin/grades/encode')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm"
            >
              <Edit3 size={16} />
              Encode Grades
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">#</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">LRN</th>
                      <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Written Works<br/>(30%)</th>
                      <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Performance Tasks<br/>(50%)</th>
                      <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Quarterly Assessment<br/>(20%)</th>
                      <th className="text-center px-5 py-3 text-[11px] font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50/50">Final Grade</th>
                      <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredGrades.map((grade, index) => {
                      const status = getPassingStatus(grade.final_grade);
                      return (
                        <tr 
                          key={grade.id} 
                          className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedGrade(grade);
                            setShowModal(true);
                          }}
                        >
                          <td className="px-5 py-3 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-indigo-600">
                                  {grade.student_name?.charAt(0) || 'S'}
                                </span>
                              </div>
                              <p className="font-medium text-gray-800 text-sm">{grade.student_name}</p>
                            </div>
                           </td>
                          <td className="px-5 py-3">
                            <span className="font-mono text-xs text-gray-600">{grade.lrn || 'N/A'}</span>
                           </td>
                          <td className="px-5 py-3 text-center">
                            <span className="text-sm text-gray-700">{grade.written_works || '—'}</span>
                           </td>
                          <td className="px-5 py-3 text-center">
                            <span className="text-sm text-gray-700">{grade.performance_tasks || '—'}</span>
                           </td>
                          <td className="px-5 py-3 text-center">
                            <span className="text-sm text-gray-700">{grade.quarterly_assessment || '—'}</span>
                           </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-16 py-1.5 rounded-lg text-sm font-bold ${getGradeBgColor(grade.final_grade)} ${getGradeColor(grade.final_grade)}`}>
                              {grade.final_grade || '—'}
                            </span>
                           </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${status.color}`}>
                              {status.label}
                            </span>
                           </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Footer */}
            <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
              <p>Showing {filteredGrades.length} of {grades.length} students</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Passed (≥75)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Failed (&lt;75)</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Grade Details Modal */}
      {showModal && selectedGrade && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Grade Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center pb-3 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-indigo-600">
                    {selectedGrade.student_name?.charAt(0) || 'S'}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800">{selectedGrade.student_name}</h4>
                <p className="text-xs text-gray-500">LRN: {selectedGrade.lrn || 'N/A'}</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Written Works (30%)</span>
                  <span className="text-lg font-semibold text-gray-800">{selectedGrade.written_works || '—'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Performance Tasks (50%)</span>
                  <span className="text-lg font-semibold text-gray-800">{selectedGrade.performance_tasks || '—'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Quarterly Assessment (20%)</span>
                  <span className="text-lg font-semibold text-gray-800">{selectedGrade.quarterly_assessment || '—'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                  <span className="text-sm font-medium text-indigo-600">Final Grade</span>
                  <span className={`text-xl font-bold ${getGradeColor(selectedGrade.final_grade)}`}>
                    {selectedGrade.final_grade || '—'}
                  </span>
                </div>
              </div>
              
              <div className="pt-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    navigate('/admin/grades/encode');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
                >
                  <Edit3 size={16} />
                  Edit Grade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewGrades;