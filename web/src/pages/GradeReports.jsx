import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, Printer, Search, Filter, Calendar, 
  BookOpen, Users, GraduationCap, ChevronRight, 
  TrendingUp, Award, AlertCircle, Loader2, X,
  CheckCircle, Clock, FileText, BarChart3, PieChart,
  FileDown, Eye, Settings, Zap, Target, Star
} from 'lucide-react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import API_URL from '../config';

const GradeReports = () => {
  const navigate = useNavigate();
  const [schoolYears, setSchoolYears] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportType, setReportType] = useState('class');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageGrade: 0,
    passingCount: 0,
    failingCount: 0,
    highestGrade: 0,
    lowestGrade: 0,
    medianGrade: 0,
    passingRate: 0
  });
  
  const [gradeDistribution, setGradeDistribution] = useState([
    { range: '90-100', count: 0, color: '#10B981' },
    { range: '85-89', count: 0, color: '#34D399' },
    { range: '80-84', count: 0, color: '#60A5FA' },
    { range: '75-79', count: 0, color: '#818CF8' },
    { range: '70-74', count: 0, color: '#FBBF24' },
    { range: 'Below 70', count: 0, color: '#EF4444' }
  ]);
  
  const [topPerformers, setTopPerformers] = useState([]);
  const [subjectAverages, setSubjectAverages] = useState([]);
  const [gradeTrends, setGradeTrends] = useState([]);


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

  const fetchStudents = async () => {
    if (!selectedSection) return;
    
    try {
      const response = await axios.get(`${API_URL}/admin/sections/${selectedSection.id}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchReportData = async () => {
    if (!selectedSection || !selectedQuarter) return;
    
    setIsLoading(true);
    try {
      // Fetch grades for the selected section and quarter
      let gradesResponse;
      if (reportType === 'class' && selectedSubject) {
        gradesResponse = await axios.get(`${API_URL}/admin/grades`, {
          params: {
            section_id: selectedSection.id,
            subject_id: selectedSubject.id,
            quarter_id: selectedQuarter.id
          },
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else if (reportType === 'class') {
        gradesResponse = await axios.get(`${API_URL}/admin/grades`, {
          params: {
            section_id: selectedSection.id,
            quarter_id: selectedQuarter.id
          },
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        gradesResponse = await axios.get(`${API_URL}/admin/grades`, {
          params: {
            section_id: selectedSection.id,
            quarter_id: selectedQuarter.id
          },
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      if (gradesResponse.data.success) {
        const grades = gradesResponse.data.grades;
        calculateStatistics(grades);
        calculateGradeDistribution(grades);
        calculateTopPerformers(grades);
        calculateSubjectAverages(grades);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStatistics = (grades) => {
    const validGrades = grades.filter(g => g.final_grade && g.final_grade > 0);
    const total = validGrades.length;
    
    if (total === 0) {
      setStats({
        totalStudents: grades.length,
        averageGrade: 0,
        passingCount: 0,
        failingCount: 0,
        highestGrade: 0,
        lowestGrade: 0,
        medianGrade: 0,
        passingRate: 0
      });
      return;
    }
    
    const passing = validGrades.filter(g => g.final_grade >= 75).length;
    const failing = validGrades.filter(g => g.final_grade < 75).length;
    const avg = validGrades.reduce((sum, g) => sum + g.final_grade, 0) / total;
    const highest = Math.max(...validGrades.map(g => g.final_grade));
    const lowest = Math.min(...validGrades.map(g => g.final_grade));
    
    // Calculate median
    const sorted = validGrades.map(g => g.final_grade).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    
    setStats({
      totalStudents: grades.length,
      averageGrade: avg,
      passingCount: passing,
      failingCount: failing,
      highestGrade: highest,
      lowestGrade: lowest,
      medianGrade: median,
      passingRate: (passing / total) * 100
    });
  };

  const calculateGradeDistribution = (grades) => {
    const distribution = [
      { range: '90-100', count: 0, color: '#10B981' },
      { range: '85-89', count: 0, color: '#34D399' },
      { range: '80-84', count: 0, color: '#60A5FA' },
      { range: '75-79', count: 0, color: '#818CF8' },
      { range: '70-74', count: 0, color: '#FBBF24' },
      { range: 'Below 70', count: 0, color: '#EF4444' }
    ];
    
    grades.forEach(grade => {
      if (!grade.final_grade || grade.final_grade === 0) return;
      
      if (grade.final_grade >= 90) distribution[0].count++;
      else if (grade.final_grade >= 85) distribution[1].count++;
      else if (grade.final_grade >= 80) distribution[2].count++;
      else if (grade.final_grade >= 75) distribution[3].count++;
      else if (grade.final_grade >= 70) distribution[4].count++;
      else distribution[5].count++;
    });
    
    setGradeDistribution(distribution);
  };

  const calculateTopPerformers = (grades) => {
    const performers = [...grades]
      .filter(g => g.final_grade && g.final_grade > 0)
      .sort((a, b) => b.final_grade - a.final_grade)
      .slice(0, 10)
      .map(g => ({
        name: g.student_name,
        grade: g.final_grade,
        rank: 0
      }));
    
    performers.forEach((p, i) => p.rank = i + 1);
    setTopPerformers(performers);
  };

  const calculateSubjectAverages = (grades) => {
    const subjectMap = new Map();
    
    grades.forEach(grade => {
      if (!grade.final_grade || grade.final_grade === 0) return;
      
      const subjectName = grade.subject_name || 'Unknown';
      if (!subjectMap.has(subjectName)) {
        subjectMap.set(subjectName, { total: 0, count: 0 });
      }
      const data = subjectMap.get(subjectName);
      data.total += grade.final_grade;
      data.count++;
    });
    
    const averages = Array.from(subjectMap.entries()).map(([name, data]) => ({
      subject: name,
      average: data.total / data.count
    })).sort((a, b) => b.average - a.average);
    
    setSubjectAverages(averages);
  };

  useEffect(() => {
    if (selectedSchoolYear) {
      fetchSections();
    }
  }, [selectedSchoolYear]);

  useEffect(() => {
    if (selectedSection) {
      fetchSubjects();
      fetchStudents();
    }
  }, [selectedSection]);

  useEffect(() => {
    if (selectedSection && selectedQuarter) {
      fetchReportData();
    }
  }, [selectedSection, selectedQuarter, selectedSubject, reportType]);

  const handleViewStudentReport = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const downloadCSV = () => {
    // Implement CSV download
    alert('CSV export feature coming soon');
  };

  const downloadPDF = () => {
    // Implement PDF download
    alert('PDF export feature coming soon');
  };

  const getPerformanceLabel = (grade) => {
    if (grade >= 90) return 'Excellent';
    if (grade >= 85) return 'Very Good';
    if (grade >= 80) return 'Good';
    if (grade >= 75) return 'Satisfactory';
    return 'Needs Improvement';
  };

  const getPerformanceColor = (grade) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 85) return 'text-emerald-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 75) return 'text-indigo-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <BarChart3 size={24} className="text-indigo-600" />
                Grade Reports
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Generate and analyze comprehensive grade reports
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
              >
                <FileDown size={16} />
                Export CSV
              </button>
              <button 
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
              >
                <Printer size={16} />
                Print Report
              </button>
            </div>
          </div>
        </div>

        {/* Selection Filters */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Report Type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
              >
                <option value="class">Class Performance</option>
                <option value="subject">Subject Analysis</option>
                <option value="student">Student Progress</option>
              </select>
            </div>

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
                    {q.name}
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

            {/* Subject (only for class report) */}
            {reportType === 'class' && (
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
                  <option value="">All Subjects</option>
                  {subjects.map(subj => (
                    <option key={subj.id} value={subj.id}>
                      {subj.subject_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-gray-500 text-sm mt-4">Generating report...</p>
          </div>
        ) : !selectedSection || !selectedQuarter ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Select Filters</h3>
            <p className="text-gray-400 text-sm">Please select school year, quarter, and section to generate report</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
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
                <p className="text-xs text-gray-400 uppercase">Median</p>
                <p className="text-2xl font-bold text-gray-800">{stats.medianGrade.toFixed(1)}</p>
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

            {/* Grade Distribution Chart */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <PieChart size={18} className="text-indigo-600" />
                Grade Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="count" name="Number of Students" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={60}>
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Award size={18} className="text-yellow-500" />
                  Top Performers
                </h3>
                <div className="space-y-3">
                  {topPerformers.map((performer) => (
                    <div 
                      key={performer.name} 
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg hover:shadow-md transition-all cursor-pointer"
                      onClick={() => {
                        const student = students.find(s => s.full_name === performer.name);
                        if (student) handleViewStudentReport(student);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-700 font-bold text-sm">
                          #{performer.rank}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{performer.name}</p>
                          <p className="text-xs text-gray-500">{getPerformanceLabel(performer.grade)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-600">{performer.grade}</p>
                      </div>
                    </div>
                  ))}
                  {topPerformers.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No grade data available</p>
                  )}
                </div>
              </div>

              {/* Subject Averages */}
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-indigo-600" />
                  Subject Averages
                </h3>
                <div className="space-y-3">
                  {subjectAverages.map((subject) => (
                    <div key={subject.subject} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{subject.subject}</span>
                        <span className="font-semibold text-indigo-600">{subject.average.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 rounded-full h-2 transition-all"
                          style={{ width: `${(subject.average / 100) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {subjectAverages.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No subject data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Passing Rate Circle */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target size={18} className="text-indigo-600" />
                Overall Performance
              </h3>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                    <circle 
                      cx="50" cy="50" r="45" fill="none" 
                      stroke={stats.passingRate >= 75 ? '#10B981' : '#EF4444'} 
                      strokeWidth="10"
                      strokeDasharray={`${(stats.passingRate / 100) * 283} 283`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1F2937">
                      {stats.passingRate.toFixed(1)}%
                    </text>
                  </svg>
                </div>
                <p className="mt-4 text-sm text-gray-600">Passing Rate</p>
                <div className="flex gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.passingCount}</p>
                    <p className="text-xs text-gray-500">Passed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.failingCount}</p>
                    <p className="text-xs text-gray-500">Failed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Report Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Student Performance Report</h3>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center pb-3 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-indigo-600">
                    {selectedStudent.full_name?.charAt(0) || 'S'}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800">{selectedStudent.full_name}</h4>
                <p className="text-xs text-gray-500">LRN: {selectedStudent.lrn || 'N/A'}</p>
                <p className="text-xs text-gray-500">{selectedSection?.grade_display} - {selectedSection?.section_name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Average Grade</p>
                  <p className="text-2xl font-bold text-green-600">85.5</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Rank</p>
                  <p className="text-2xl font-bold text-indigo-600">#5</p>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-3">
                <button
                  onClick={() => {
                    setShowStudentModal(false);
                    navigate(`/admin/students/${selectedStudent.id}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
                >
                  <Eye size={16} />
                  View Complete Student Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeReports;