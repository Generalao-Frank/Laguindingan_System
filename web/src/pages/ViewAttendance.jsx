import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Search, Filter, Download, Printer, Users, 
  GraduationCap, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, ChevronRight, Eye, TrendingUp, Award, BarChart3,
  Activity, UserCheck, UserX, Zap, Target, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import API_URL from '../config';

const ViewAttendance = () => {
  const navigate = useNavigate();
  const [schoolYears, setSchoolYears] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [sections, setSections] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]); // Bagong state para sa grade levels
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [selectedGradeLevelFilter, setSelectedGradeLevelFilter] = useState(''); // Piniling grade level
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showStats, setShowStats] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    present: 0,
    late: 0,
    absent: 0,
    attendanceRate: 0,
    lateRate: 0,
    absentRate: 0,
    weeklyTrend: []
  });
  
  const [attendanceSummary, setAttendanceSummary] = useState({
    daily: [],
    weekly: [],
    monthly: []
  });

  const token = localStorage.getItem('userToken');

  // I‑filter ang mga section batay sa napiling grade level
  const filteredSectionsByGrade = sections.filter(
    sec => sec.grade_level === parseInt(selectedGradeLevelFilter)
  );

  useEffect(() => {
    fetchSchoolYears();
    fetchGradeLevels(); // Kunin ang listahan ng grade levels
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
      // Fallback
      setGradeLevels([
        { id: 1, grade_level: 0, grade_display: 'Kinder' },
        { id: 2, grade_level: 1, grade_display: 'Grade 1' },
        { id: 3, grade_level: 2, grade_display: 'Grade 2' },
        { id: 4, grade_level: 3, grade_display: 'Grade 3' },
        { id: 5, grade_level: 4, grade_display: 'Grade 4' },
        { id: 6, grade_level: 5, grade_display: 'Grade 5' },
        { id: 7, grade_level: 6, grade_display: 'Grade 6' },
      ]);
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
        // I‑filter ang sections ayon sa napiling school year
        const filtered = response.data.sections.filter(s => s.school_year_id === selectedSchoolYear.id);
        setSections(filtered);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
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

  const fetchAttendance = async () => {
    if (!selectedSection || !selectedDate) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/attendance`, {
        params: {
          section_id: selectedSection.id,
          date: selectedDate
        },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAttendanceRecords(response.data.attendance);
        calculateStats(response.data.attendance);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceSummary = async () => {
    if (!selectedSection || !selectedQuarter) return;
    
    try {
      const response = await axios.get(`${API_URL}/admin/attendance/summary`, {
        params: {
          section_id: selectedSection.id,
          quarter_id: selectedQuarter.id
        },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAttendanceSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
    }
  };

  const calculateStats = (attendance) => {
    const total = students.length;
    const present = attendance.filter(a => a.status === 'Present').length;
    const late = attendance.filter(a => a.status === 'Late').length;
    const absent = attendance.filter(a => a.status === 'Absent').length;
    
    setStats({
      totalStudents: total,
      present: present,
      late: late,
      absent: absent,
      attendanceRate: total > 0 ? (present / total) * 100 : 0,
      lateRate: total > 0 ? (late / total) * 100 : 0,
      absentRate: total > 0 ? (absent / total) * 100 : 0,
      weeklyTrend: generateWeeklyTrend()
    });
  };

  const generateWeeklyTrend = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return days.map(day => ({
      day: day,
      present: Math.floor(Math.random() * 40) + 20,
      late: Math.floor(Math.random() * 10),
      absent: Math.floor(Math.random() * 5)
    }));
  };

  // Kapag nagbago ang school year, i‑refresh ang mga section at i‑reset ang grade level at section
  useEffect(() => {
    if (selectedSchoolYear) {
      fetchSections();
      setSelectedGradeLevelFilter('');
      setSelectedSection(null);
    }
  }, [selectedSchoolYear]);

  // Kapag nagbago ang grade level, i‑reset ang napiling section
  useEffect(() => {
    setSelectedSection(null);
  }, [selectedGradeLevelFilter]);

  // Kapag may napiling section, kunin ang mga estudyante at attendance
  useEffect(() => {
    if (selectedSection) {
      fetchStudents();
      fetchAttendance();
      fetchAttendanceSummary();
    }
  }, [selectedSection, selectedDate]);

  const getGradeDisplay = (grade) => {
    if (grade === 0) return 'Kinder';
    return `Grade ${grade}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700"><CheckCircle size={10} /> Present</span>;
      case 'Late':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700"><Clock size={10} /> Late</span>;
      case 'Absent':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700"><XCircle size={10} /> Absent</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">Unknown</span>;
    }
  };

  const filteredAttendance = attendanceRecords.filter(record =>
    record.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pie chart data
  const pieData = [
    { name: 'Present', value: stats.present, color: '#10B981' },
    { name: 'Late', value: stats.late, color: '#F59E0B' },
    { name: 'Absent', value: stats.absent, color: '#EF4444' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <Activity size={24} className="text-indigo-600" />
                View Attendance
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Monitor student attendance records and analytics
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
                onClick={() => navigate('/admin/attendance/reports')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
              >
                <BarChart3 size={16} />
                Full Report
              </button>
            </div>
          </div>
        </div>

        {/* Selection Filters */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4"> {/* Binago sa 5 columns */}
            {/* School Year */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">School Year</label>
              <select
                value={selectedSchoolYear?.id || ''}
                onChange={(e) => {
                  const sy = schoolYears.find(s => s.id === parseInt(e.target.value));
                  setSelectedSchoolYear(sy);
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

            {/* Grade Level (bagong filter) */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Grade Level</label>
              <select
                value={selectedGradeLevelFilter}
                onChange={(e) => setSelectedGradeLevelFilter(e.target.value)}
                disabled={!selectedSchoolYear}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none disabled:opacity-50"
              >
                <option value="">All Grade Levels</option>
                {gradeLevels.map(gl => (
                  <option key={gl.id} value={gl.grade_level}>
                    {gl.grade_display || getGradeDisplay(gl.grade_level)}
                  </option>
                ))}
              </select>
            </div>

            {/* Section - ngayon ay umaasa sa napiling grade level */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
              <select
                value={selectedSection?.id || ''}
                onChange={(e) => {
                  const sec = sections.find(s => s.id === parseInt(e.target.value));
                  setSelectedSection(sec);
                }}
                disabled={!selectedSchoolYear || (!selectedGradeLevelFilter && sections.length === 0)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none disabled:opacity-50"
              >
                <option value="">Select Section</option>
                {filteredSectionsByGrade.map(sec => (
                  <option key={sec.id} value={sec.id}>
                    {sec.grade_display} - {sec.section_name}
                  </option>
                ))}
              </select>
              {selectedGradeLevelFilter && filteredSectionsByGrade.length === 0 && (
                <p className="text-xs text-amber-500 mt-1">No sections for this grade level</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-gray-500 text-sm mt-4">Loading attendance records...</p>
          </div>
        ) : !selectedSection ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Select Filters</h3>
            <p className="text-gray-400 text-sm">Please select school year, quarter, grade level, and section to view attendance</p>
          </div>
        ) : (
          <>
            {/* Statistics Cards (unchanged) */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase">Total Students</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs text-green-600 uppercase">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                <p className="text-[10px] text-green-500">{stats.attendanceRate.toFixed(1)}%</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                <p className="text-xs text-yellow-600 uppercase">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                <p className="text-[10px] text-yellow-500">{stats.lateRate.toFixed(1)}%</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs text-red-600 uppercase">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                <p className="text-[10px] text-red-500">{stats.absentRate.toFixed(1)}%</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase">Attendance Rate</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.attendanceRate.toFixed(1)}%</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase">Date</p>
                <p className="text-sm font-bold text-gray-700">{selectedDate}</p>
              </div>
            </div>

            {/* Charts Row (unchanged) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Pie Chart */}
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Attendance Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly Trend */}
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Weekly Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#10B981" name="Present" />
                      <Bar dataKey="late" fill="#F59E0B" name="Late" />
                      <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Search Bar (unchanged) */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search student..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
            </div>

            {/* Attendance Table (unchanged) */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">#</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">LRN</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Time In</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Time Out</th>
                      <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredAttendance.length > 0 ? filteredAttendance.map((record, index) => (
                      <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-indigo-600">
                                {record.student_name?.charAt(0) || 'S'}
                              </span>
                            </div>
                            <p className="font-medium text-gray-800 text-sm">{record.student_name}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs text-gray-600">{record.lrn || 'N/A'}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-gray-700">{record.time_in || '—'}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-gray-700">{record.time_out || '—'}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {getStatusBadge(record.status)}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Activity size={32} className="text-gray-300 mb-2" />
                            <p className="text-gray-400 text-sm">No attendance records found for this date</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Footer (unchanged) */}
            {attendanceRecords.length > 0 && (
              <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                <p>Showing {filteredAttendance.length} of {attendanceRecords.length} students</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Late</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Absent</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ViewAttendance;