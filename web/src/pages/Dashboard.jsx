import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  Users, TrendingUp, TrendingDown, Calendar, Award, Activity, Briefcase, 
  GraduationCap, BookOpen, School, UserCheck, Clock, DollarSign, 
  Download, RefreshCw, Eye, ChevronRight, Zap, Target, Globe, Star,
  UserPlus, UserMinus, CheckCircle, XCircle, AlertCircle, Loader
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalSections: 0,
    totalEnrolled: 0,
    attendanceRate: 0,
    graduationRate: 0,
    maleCount: 0,
    femaleCount: 0,
    gradeLevelBreakdown: {},
  });

  const [gradeLevelData, setGradeLevelData] = useState([]);
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);

 
  const token = localStorage.getItem('userToken');

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Student stats (total, gender, grade level breakdown)
        const statsRes = await axios.get(`${API_URL}/admin/students/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statsRes.data.success) {
          const ss = statsRes.data.stats;
          setStats(prev => ({
            ...prev,
            totalStudents: ss.totalStudents,
            maleCount: ss.maleCount,
            femaleCount: ss.femaleCount,
            gradeLevelBreakdown: ss.gradeLevelBreakdown || {},
          }));
          // Build grade level data for chart
          const breakdown = ss.gradeLevelBreakdown || {};
          const levels = ['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
          const chartData = levels.map((level, idx) => ({
            grade: level,
            students: breakdown[idx] || 0,
            boys: 0, // breakdown doesn't have gender per grade, we can skip or estimate
            girls: 0,
          }));
          setGradeLevelData(chartData);
        }

        // 2. Teachers count
        const teachersRes = await axios.get(`${API_URL}/admin/teachers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (teachersRes.data.success) {
          setStats(prev => ({ ...prev, totalTeachers: teachersRes.data.teachers.length }));
        }

        // 3. Sections count
        const sectionsRes = await axios.get(`${API_URL}/admin/sections`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (sectionsRes.data.success) {
          setStats(prev => ({ ...prev, totalSections: sectionsRes.data.sections.length }));
        }

        // 4. Enrollment stats (active, total enrolled, etc.)
        const enrollStatsRes = await axios.get(`${API_URL}/admin/enrollments/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (enrollStatsRes.data.success) {
          const es = enrollStatsRes.data.stats;
          setStats(prev => ({
            ...prev,
            totalEnrolled: es.active || 0,
            // graduation rate maybe from completed enrollments
            graduationRate: es.total > 0 ? (es.completed / es.total) * 100 : 0,
          }));
        }

        // 5. Attendance rate (current quarter or overall)
        // Use attendance report for current school year? For simplicity, fetch attendance summary
        const attendanceRes = await axios.get(`${API_URL}/admin/attendance/summary`, {
          params: { 
            section_id: null, // we might need a default, but we can use overall enrollment
            quarter_id: null, // fallback: compute average from last 4 quarters
          },
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);
        if (attendanceRes && attendanceRes.data.success) {
          // compute average attendance rate from daily summary
          const dailySummary = attendanceRes.data.summary?.daily || [];
          if (dailySummary.length > 0) {
            const totalPresent = dailySummary.reduce((sum, day) => sum + (day.present || 0), 0);
            const totalRecords = dailySummary.reduce((sum, day) => sum + (day.present + day.late + day.absent), 0);
            const rate = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;
            setStats(prev => ({ ...prev, attendanceRate: parseFloat(rate.toFixed(1)) }));
          }
        } else {
          // fallback: use demo data for charts
          setAttendanceData([
            { quarter: '1st Qtr', present: 92, late: 5, absent: 3 },
            { quarter: '2nd Qtr', present: 94, late: 4, absent: 2 },
            { quarter: '3rd Qtr', present: 91, late: 6, absent: 3 },
            { quarter: '4th Qtr', present: 95, late: 3, absent: 2 },
          ]);
        }

        // 6. Enrollment trend (monthly) – we might need a custom endpoint; fallback to demo
        // For now, keep demo enrollmentData but could be fetched from backend if available
        setEnrollmentData([
          { month: 'Jun', enrolled: 120, transferred: 5, dropped: 2 },
          { month: 'Jul', enrolled: 45, transferred: 3, dropped: 1 },
          { month: 'Aug', enrolled: 35, transferred: 4, dropped: 0 },
          { month: 'Sep', enrolled: 25, transferred: 2, dropped: 1 },
          { month: 'Oct', enrolled: 20, transferred: 1, dropped: 0 },
          { month: 'Nov', enrolled: 15, transferred: 2, dropped: 1 },
        ]);

        // 7. Subject performance – need custom endpoint; keep demo
        setSubjectPerformance([
          { subject: 'Math', avg: 85.5, passing: 92, failing: 8 },
          { subject: 'Science', avg: 87.2, passing: 94, failing: 6 },
          { subject: 'English', avg: 86.8, passing: 93, failing: 7 },
          { subject: 'Filipino', avg: 88.1, passing: 95, failing: 5 },
          { subject: 'AP', avg: 84.9, passing: 90, failing: 10 },
          { subject: 'MAPEH', avg: 90.2, passing: 97, failing: 3 },
        ]);

        // 8. Recent activities – from activity_logs endpoint
        const activitiesRes = await axios.get(`${API_URL}/admin/activity-logs`, {
          params: { limit: 5 },
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);
        if (activitiesRes && activitiesRes.data.success) {
          const logs = activitiesRes.data.activities.slice(0, 5);
          setRecentActivities(logs.map(log => ({
            id: log.id,
            action: log.description || `${log.action_type} on ${log.table_name}`,
            user: log.user_name || 'System',
            time: new Date(log.created_at).toLocaleString(),
            icon: <Activity size={14} />,
            color: 'indigo',
          })));
        } else {
          // fallback demo
          setRecentActivities([
            { id: 1, action: 'New student enrolled', user: 'Admin', time: '2 minutes ago', icon: <UserPlus size={14} />, color: 'emerald' },
            { id: 2, action: 'Teacher assignment updated', user: 'Admin', time: '1 hour ago', icon: <Briefcase size={14} />, color: 'blue' },
            { id: 3, action: 'Grades uploaded for Grade 6', user: 'Teacher Maria', time: '3 hours ago', icon: <Award size={14} />, color: 'purple' },
            { id: 4, action: 'New school year created', user: 'Admin', time: '1 day ago', icon: <Calendar size={14} />, color: 'indigo' },
            { id: 5, action: 'QR codes generated for students', user: 'Admin', time: '2 days ago', icon: <Activity size={14} />, color: 'orange' },
          ]);
        }

        // 9. Recent enrollments (latest active enrollments)
        const enrollmentsRes = await axios.get(`${API_URL}/admin/enrollments`, {
          params: { limit: 4, status: 'Active' },
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);
        if (enrollmentsRes && enrollmentsRes.data.success) {
          const recents = enrollmentsRes.data.enrollments.slice(0, 4);
          setRecentEnrollments(recents.map(e => ({
            id: e.id,
            name: e.student_name,
            lrn: e.lrn,
            grade: e.grade_display,
            section: e.section,
            date: e.enrolled_date,
          })));
        } else {
          setRecentEnrollments([
            { id: 1, name: 'Juan Dela Cruz', lrn: '123456789012', grade: 'Grade 6', section: 'Section A', date: '2024-06-10' },
            { id: 2, name: 'Maria Reyes', lrn: '123456789013', grade: 'Grade 5', section: 'Section B', date: '2024-06-09' },
            { id: 3, name: 'Jose Rivera', lrn: '123456789014', grade: 'Grade 4', section: 'Section A', date: '2024-06-08' },
            { id: 4, name: 'Ana Martinez', lrn: '123456789015', grade: 'Grade 3', section: 'Section C', date: '2024-06-07' },
          ]);
        }

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to load dashboard data. Please refresh.');
        // Optionally set some fallback data
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  // Helper for grade display
  const getGradeDisplay = (grade) => {
    if (grade === 0) return 'Kinder';
    return `Grade ${grade}`;
  };

  const COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-${trend === 'up' ? 'emerald' : 'rose'}-600 bg-${trend === 'up' ? 'emerald' : 'rose'}-50 px-2 py-1 rounded-full`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span className="text-xs font-semibold">{trendValue}</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-800">{loading ? <Loader size={20} className="animate-spin" /> : value}</h3>
      <p className="text-sm text-gray-500 mt-1 font-medium">{title}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center text-red-600">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="max-w-[1600px] mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Welcome back, Administrator! Here's your school overview.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.location.reload()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <RefreshCw size={18} className="text-gray-500" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
                <Download size={16} />
                <span className="text-sm font-medium">Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Students" value={stats.totalStudents.toLocaleString()} icon={Users} trend="up" trendValue="+12%" color="indigo" />
          <StatCard title="Total Teachers" value={stats.totalTeachers} icon={GraduationCap} trend="up" trendValue="+5%" color="purple" />
          <StatCard title="Active Sections" value={stats.totalSections} icon={School} trend="up" trendValue="+2" color="emerald" />
          <StatCard title="Enrollment Rate" value={`${Math.round((stats.totalEnrolled / stats.totalStudents) * 100)}%`} icon={UserCheck} trend="up" trendValue="+8%" color="blue" />
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 rounded-lg p-2"><Target size={20} /></div>
              <Zap size={20} className="opacity-80" />
            </div>
            <p className="text-3xl font-bold">{stats.attendanceRate}%</p>
            <p className="text-indigo-100 text-sm mt-1">Average Attendance Rate</p>
            <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${stats.attendanceRate}%` }}></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 rounded-lg p-2"><Award size={20} /></div>
              <Star size={20} className="opacity-80" />
            </div>
            <p className="text-3xl font-bold">{stats.graduationRate}%</p>
            <p className="text-emerald-100 text-sm mt-1">Graduation Rate</p>
            <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${stats.graduationRate}%` }}></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 rounded-lg p-2"><Globe size={20} /></div>
              <ChevronRight size={20} className="opacity-80" />
            </div>
            <p className="text-3xl font-bold">SY 2024-2025</p>
            <p className="text-amber-100 text-sm mt-1">Current School Year</p>
            <p className="text-xs text-amber-100/80 mt-2">1st Quarter • Active</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Enrollment Trend */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div><h3 className="text-lg font-semibold text-gray-800">Enrollment Trend</h3><p className="text-xs text-gray-500 mt-1">Monthly enrollment data for SY 2024-2025</p></div>
              <div className="flex gap-3"><div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div><span className="text-xs text-gray-600">Enrolled</span></div><div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div><span className="text-xs text-gray-600">Transferred</span></div></div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="enrolled" stackId="1" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="transferred" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grade Level Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6"><div><h3 className="text-lg font-semibold text-gray-800">Grade Level Distribution</h3><p className="text-xs text-gray-500 mt-1">Students per grade level</p></div></div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeLevelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="grade" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="students" fill="#8B5CF6" radius={[8, 8, 0, 0]} barSize={50}>
                    {gradeLevelData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Subject Performance & Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subject Performance */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6"><div><h3 className="text-lg font-semibold text-gray-800">Subject Performance</h3><p className="text-xs text-gray-500 mt-1">Average grades by subject</p></div><Eye size={18} className="text-gray-400" /></div>
            <div className="space-y-4">
              {subjectPerformance.map((subject, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1.5"><span className="font-medium text-gray-700">{subject.subject}</span><span className="text-gray-600">{subject.avg}%</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${subject.avg}%` }}></div></div>
                  <div className="flex justify-between text-xs mt-1"><span className="text-emerald-600">✓ Passing: {subject.passing}%</span><span className="text-rose-600">✗ Failing: {subject.failing}%</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Rate by Quarter */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6"><div><h3 className="text-lg font-semibold text-gray-800">Attendance Rate</h3><p className="text-xs text-gray-500 mt-1">By quarter comparison</p></div><Clock size={18} className="text-gray-400" /></div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} domain={[0, 100]} />
                  <YAxis type="category" dataKey="quarter" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="present" stackId="a" fill="#10B981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="late" stackId="a" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="absent" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs text-gray-600">Present</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-xs text-gray-600">Late</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-xs text-gray-600">Absent</span></div>
            </div>
          </div>
        </div>

        {/* Recent Activities & Enrollments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6"><div><h3 className="text-lg font-semibold text-gray-800">Recent Activities</h3><p className="text-xs text-gray-500 mt-1">Latest system activities</p></div><Activity size={18} className="text-gray-400" /></div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg bg-${activity.color}-100 flex items-center justify-center flex-shrink-0`}><div className={`text-${activity.color}-600`}>{activity.icon}</div></div>
                  <div className="flex-1"><p className="text-sm font-medium text-gray-800">{activity.action}</p><div className="flex items-center gap-2 mt-1"><span className="text-xs text-gray-500">{activity.user}</span><span className="w-1 h-1 rounded-full bg-gray-300"></span><span className="text-xs text-gray-400">{activity.time}</span></div></div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Enrollments */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6"><div><h3 className="text-lg font-semibold text-gray-800">Recent Enrollments</h3><p className="text-xs text-gray-500 mt-1">Latest student enrollments</p></div><UserPlus size={18} className="text-gray-400" /></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-100"><tr><th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th><th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">LRN</th><th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th><th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {recentEnrollments.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors"><td className="py-3 text-sm font-medium text-gray-800">{student.name}</td><td className="py-3 text-xs text-gray-500 font-mono">{student.lrn}</td><td className="py-3 text-sm text-gray-600">{student.grade}</td><td className="py-3 text-xs text-gray-400">{student.date}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="w-full mt-4 py-2 text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:bg-indigo-50 rounded-lg transition-colors">View All Enrollments</button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between"><p className="text-xs text-gray-400">© 2024 Laguindingan Central School - Admin Portal. All rights reserved.</p><div className="flex items-center gap-4"><span className="text-xs text-gray-400">Last updated: {new Date().toLocaleDateString()}</span><div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-xs text-gray-400">System Online</span></div></div></div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;