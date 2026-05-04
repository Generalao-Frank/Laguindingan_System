import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Calendar, GraduationCap, 
  BookOpen, CheckCircle, XCircle, AlertCircle, Loader2,
  Eye, Download, Printer, ChevronRight, Award, TrendingUp,
  UserCheck, UserX, Clock, Zap, Target, FileText, X,
  History, Users, School
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const EnrollmentHistory = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState(null);
  const [stats, setStats] = useState({
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    droppedEnrollments: 0,
    uniqueStudents: 0,
    bySchoolYear: []
  });

  
  const token = localStorage.getItem('userToken');

  useEffect(() => {
    fetchSchoolYears();
    fetchSections();
    fetchStudents();
    fetchEnrollments();
    fetchStats();
  }, []);

  const fetchSchoolYears = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/school-years`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setSchoolYears(response.data.school_years);
      }
    } catch (error) {
      console.error('Error fetching school years:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/sections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setSections(response.data.sections);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchEnrollments = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedSchoolYear) {
        params.school_year_id = selectedSchoolYear.id;
      }
      if (selectedSection) {
        params.section_id = selectedSection.id;
      }
      if (selectedStudent) {
        params.student_id = selectedStudent.id;
      }
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const response = await axios.get(`${API_URL}/admin/enrollments`, {
        params,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setEnrollments(response.data.enrollments);
        setFilteredEnrollments(response.data.enrollments);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      showError('Failed to load enrollment data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      if (selectedSchoolYear) {
        params.school_year_id = selectedSchoolYear.id;
      }
      
      const response = await axios.get(`${API_URL}/admin/enrollments/stats`, {
        params,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchStudentEnrollmentHistory = async (student) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/enrollments/student/${student.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSelectedStudentHistory({
          student: response.data.student,
          enrollments: response.data.enrollments
        });
        setShowStudentModal(true);
      }
    } catch (error) {
      console.error('Error fetching student history:', error);
      showError('Failed to load student history');
    } finally {
      setIsLoading(false);
    }
  };

  const showError = (message) => {
    alert(message);
  };

  useEffect(() => {
    fetchEnrollments();
    fetchStats();
  }, [selectedSchoolYear, selectedSection, selectedStudent, filterStatus]);

  useEffect(() => {
    let filtered = [...enrollments];
    
    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.lrn?.includes(searchTerm)
      );
    }
    
    setFilteredEnrollments(filtered);
  }, [searchTerm, enrollments]);

  const handleFilterChange = (type, value) => {
    if (type === 'school_year') {
      setSelectedSchoolYear(value);
    } else if (type === 'section') {
      setSelectedSection(value);
    } else if (type === 'student') {
      setSelectedStudent(value);
    } else if (type === 'status') {
      setFilterStatus(value);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700"><CheckCircle size={10} /> Active</span>;
      case 'Completed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700"><Award size={10} /> Completed</span>;
      case 'Dropped':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700"><XCircle size={10} /> Dropped</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">{status}</span>;
    }
  };

  const downloadCSV = () => {
    const headers = ['Student Name', 'LRN', 'Grade Level', 'Section', 'School Year', 'Status', 'Enrolled Date'];
    const rows = filteredEnrollments.map(e => [
      e.student_name,
      e.lrn,
      e.grade_display,
      e.section,
      e.school_year,
      e.status,
      e.enrolled_date
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollment_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <History size={24} className="text-indigo-600" />
                Enrollment History
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                View complete enrollment history across all school years
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={downloadCSV}
                disabled={filteredEnrollments.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button 
                onClick={downloadPDF}
                disabled={filteredEnrollments.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">School Year</label>
              <select
                value={selectedSchoolYear?.id || ''}
                onChange={(e) => {
                  const sy = schoolYears.find(s => s.id === parseInt(e.target.value));
                  handleFilterChange('school_year', sy || null);
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
              >
                <option value="">All School Years</option>
                {schoolYears.map(sy => (
                  <option key={sy.id} value={sy.id}>
                    {sy.year_start}-{sy.year_end} {sy.is_active ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
              <select
                value={selectedSection?.id || ''}
                onChange={(e) => {
                  const sec = sections.find(s => s.id === parseInt(e.target.value));
                  handleFilterChange('section', sec || null);
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
              >
                <option value="">All Sections</option>
                {sections.map(sec => (
                  <option key={sec.id} value={sec.id}>
                    {sec.grade_display} - {sec.section_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Student</label>
              <select
                value={selectedStudent?.id || ''}
                onChange={(e) => {
                  const stu = students.find(s => s.id === parseInt(e.target.value));
                  handleFilterChange('student', stu || null);
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
              >
                <option value="">All Students</option>
                {students.map(stu => (
                  <option key={stu.id} value={stu.id}>
                    {stu.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search by name or LRN..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              value={filterStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Dropped">Dropped</option>
            </select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase">Total Enrollments</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalEnrollments || 0}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase">Unique Students</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.uniqueStudents || 0}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.activeEnrollments || 0}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase">Completed</p>
            <p className="text-2xl font-bold text-blue-600">{stats.completedEnrollments || 0}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase">Dropped</p>
            <p className="text-2xl font-bold text-red-600">{stats.droppedEnrollments || 0}</p>
          </div>
        </div>

        {/* Enrollment by School Year */}
        {stats.bySchoolYear && stats.bySchoolYear.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Enrollment by School Year</h3>
            <div className="space-y-3">
              {stats.bySchoolYear.map((sy, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{sy.school_year}</span>
                    <span className="text-gray-500">{sy.count} students</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500" style={{ width: `${(sy.active / sy.count) * 100}%` }}></div>
                    <div className="bg-blue-500" style={{ width: `${(sy.completed / sy.count) * 100}%` }}></div>
                    <div className="bg-red-500" style={{ width: `${(sy.dropped / sy.count) * 100}%` }}></div>
                  </div>
                  <div className="flex gap-4 mt-1 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Active {sy.active}</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Completed {sy.completed}</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Dropped {sy.dropped}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
            <p className="text-gray-500 text-sm mt-4">Loading enrollment history...</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">LRN</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Grade & Section</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">School Year</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Enrolled Date</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEnrollments.length > 0 ? filteredEnrollments.map((enrollment, index) => (
                    <tr key={enrollment.id || index} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-indigo-600">
                              {enrollment.student_name?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{enrollment.student_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs text-gray-600">{enrollment.lrn || 'N/A'}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap size={12} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{enrollment.grade_display} - {enrollment.section}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{enrollment.school_year}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-gray-600">{enrollment.enrolled_date}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {getStatusBadge(enrollment.status)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button 
                          onClick={() => {
                            const student = students.find(s => s.full_name === enrollment.student_name);
                            if (student) {
                              fetchStudentEnrollmentHistory(student);
                            } else {
                              // Try to find by ID
                              const studentById = students.find(s => s.id === enrollment.student_id);
                              if (studentById) {
                                fetchStudentEnrollmentHistory(studentById);
                              }
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye size={12} />
                          View History
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <History size={32} className="text-gray-300 mb-2" />
                          <p className="text-gray-400 text-sm">No enrollment records found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Summary */}
        {filteredEnrollments.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
            <p>Showing {filteredEnrollments.length} of {enrollments.length} enrollment records</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Dropped</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Enrollment History Modal */}
      {showStudentModal && selectedStudentHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Enrollment History</h3>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Student Info */}
              <div className="text-center pb-3 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-indigo-600">
                    {selectedStudentHistory.student?.name?.charAt(0) || 'S'}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800">{selectedStudentHistory.student?.name}</h4>
                <p className="text-xs text-gray-500">LRN: {selectedStudentHistory.student?.lrn || 'N/A'}</p>
              </div>
              
              {/* Timeline */}
              <div className="space-y-4">
                {selectedStudentHistory.enrollments?.map((enrollment, index) => (
                  <div key={index} className="relative pl-8">
                    {/* Timeline line */}
                    {index !== selectedStudentHistory.enrollments.length - 1 && (
                      <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${
                      enrollment.status === 'Active' ? 'bg-green-100' :
                      enrollment.status === 'Completed' ? 'bg-blue-100' : 'bg-red-100'
                    }`}>
                      {enrollment.status === 'Active' && <CheckCircle size={14} className="text-green-600" />}
                      {enrollment.status === 'Completed' && <Award size={14} className="text-blue-600" />}
                      {enrollment.status === 'Dropped' && <XCircle size={14} className="text-red-600" />}
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          enrollment.status === 'Active' ? 'bg-green-100 text-green-700' :
                          enrollment.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {enrollment.status}
                        </span>
                        <span className="text-xs text-gray-500">{enrollment.date_enrolled}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-[10px] text-gray-400">School Year</p>
                          <p className="font-medium text-gray-700">{enrollment.school_year}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Grade & Section</p>
                          <p className="font-medium text-gray-700">{enrollment.grade_display} - {enrollment.section}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentHistory;