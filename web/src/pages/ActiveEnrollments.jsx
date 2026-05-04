import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Filter, Calendar, GraduationCap, 
  BookOpen, CheckCircle, XCircle, AlertCircle, Loader2,
  Eye, Download, Printer, ChevronRight, Award, TrendingUp,
  UserCheck, UserX, Clock, Zap, Target, FileText, X, UserPlus  
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const ActiveEnrollments = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(null);
  const [selectedGradeLevelFilter, setSelectedGradeLevelFilter] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalEnrollments: 0,
    totalStudents: 0,
    totalSections: 0,
    totalGradeLevels: 0,
    maleCount: 0,
    femaleCount: 0,
    byGradeLevel: []
  });

  const token = localStorage.getItem('userToken');

  // I‑filter ang mga section ayon sa napiling grade level
  const filteredSectionsByGrade = sections.filter(
    sec => sec.grade_level === parseInt(selectedGradeLevelFilter)
  );

  useEffect(() => {
    fetchSchoolYears();
    fetchGradeLevels();
    fetchEnrollments();
  }, []);

  const fetchSchoolYears = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/school-years`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setSchoolYears(response.data.school_years);
        const active = response.data.school_years.find(sy => sy.is_active);
        if (active) setSelectedSchoolYear(active);
      }
    } catch (error) {
      console.error('Error fetching school years:', error);
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

  const fetchEnrollments = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedSchoolYear) params.school_year_id = selectedSchoolYear.id;
      if (selectedSection) params.section_id = selectedSection.id;
      
      const response = await axios.get(`${API_URL}/admin/enrollments/active`, {
        params,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // I‑normalize ang data: siguraduhing may grade_display
        const normalized = response.data.enrollments.map(e => ({
          ...e,
          grade_display: e.grade_display || (e.grade_level === 0 ? 'Kinder' : `Grade ${e.grade_level}`)
        }));
        setEnrollments(normalized);
        setFilteredEnrollments(normalized);
        calculateStats(normalized);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      // Demo data (may grade_display na)
      const demoEnrollments = [
        { id: 1, student_name: 'DELA CRUZ, JUAN D', lrn: '123456789012', grade_level: 6, grade_display: 'Grade 6', section: 'DIAMOND', status: 'Active', enrolled_date: '2024-06-10', guardian: 'PEDRO DELA CRUZ', contact: '09171234569' },
        { id: 2, student_name: 'REYES, MARIA E', lrn: '123456789013', grade_level: 5, grade_display: 'Grade 5', section: 'EMERALD', status: 'Active', enrolled_date: '2024-06-09', guardian: 'RAMON REYES', contact: '09171234571' },
        { id: 3, student_name: 'RIVERA, JOSE M', lrn: '123456789014', grade_level: 4, grade_display: 'Grade 4', section: 'RUBY', status: 'Active', enrolled_date: '2024-06-08', guardian: 'MANUEL RIVERA', contact: '09171234573' },
        { id: 4, student_name: 'MARTINEZ, ANA L', lrn: '123456789015', grade_level: 3, grade_display: 'Grade 3', section: 'SAPPHIRE', status: 'Active', enrolled_date: '2024-06-07', guardian: 'CARLOS MARTINEZ', contact: '09171234575' },
      ];
      setEnrollments(demoEnrollments);
      setFilteredEnrollments(demoEnrollments);
      calculateStats(demoEnrollments);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalStudents = data.length;
    const uniqueSections = [...new Set(data.map(e => e.section))];
    const uniqueGradeLevels = [...new Set(data.map(e => e.grade_level))];
    const maleCount = data.filter(e => e.gender === 'Male').length;
    const femaleCount = data.filter(e => e.gender === 'Female').length;
    
    // Count by grade level
    const gradeLevelMap = new Map();
    data.forEach(e => {
      const key = e.grade_level;
      if (!gradeLevelMap.has(key)) {
        gradeLevelMap.set(key, { grade: e.grade_display || (key === 0 ? 'Kinder' : `Grade ${key}`), count: 0 });
      }
      gradeLevelMap.get(key).count++;
    });
    const byGradeLevel = Array.from(gradeLevelMap.values()).sort((a, b) => {
      const order = { 'Kinder': 0, 'Grade 1': 1, 'Grade 2': 2, 'Grade 3': 3, 'Grade 4': 4, 'Grade 5': 5, 'Grade 6': 6 };
      return (order[a.grade] || 99) - (order[b.grade] || 99);
    });
    
    setStats({
      totalEnrollments: totalStudents,
      totalStudents: totalStudents,
      totalSections: uniqueSections.length,
      totalGradeLevels: uniqueGradeLevels.length,
      maleCount: maleCount,
      femaleCount: femaleCount,
      byGradeLevel: byGradeLevel
    });
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

  useEffect(() => {
    fetchEnrollments();
  }, [selectedSchoolYear, selectedSection]);

  useEffect(() => {
    let filtered = [...enrollments];
    
    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.lrn?.includes(searchTerm)
      );
    }
    
    if (filterGrade !== 'all') {
      filtered = filtered.filter(e => e.grade_level === parseInt(filterGrade));
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }
    
    setFilteredEnrollments(filtered);
  }, [searchTerm, filterGrade, filterStatus, enrollments]);

  const getGradeLevelOptions = () => {
    // Gumamit ng gradeLevels mula sa API (Kinder hanggang Grade 6)
    return gradeLevels.map(gl => ({
      value: gl.grade_level,
      label: gl.grade_display || (gl.grade_level === 0 ? 'Kinder' : `Grade ${gl.grade_level}`)
    }));
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
    const headers = ['Student Name', 'LRN', 'Grade Level', 'Section', 'Status', 'Enrolled Date', 'Guardian', 'Contact Number'];
    const rows = filteredEnrollments.map(e => [
      e.student_name,
      e.lrn,
      e.grade_display || (e.grade_level === 0 ? 'Kinder' : `Grade ${e.grade_level}`),
      e.section,
      e.status,
      e.enrolled_date,
      e.guardian || 'N/A',
      e.contact || 'N/A'
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `active_enrollments_${new Date().toISOString().split('T')[0]}.csv`;
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
                <UserCheck size={24} className="text-indigo-600" />
                Active Enrollments
              </h1>
              <p className="text-gray-500 text-sm mt-1">View and manage currently enrolled students</p>
            </div>
            <div className="flex gap-3">
              <button onClick={downloadCSV} disabled={filteredEnrollments.length === 0} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Download size={16} /> Export CSV</button>
              <button onClick={downloadPDF} disabled={filteredEnrollments.length === 0} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"><Printer size={16} /> Print</button>
              <button onClick={() => navigate('/admin/students/enroll')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"><UserPlus size={16} /> New Enrollment</button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* School Year */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">School Year</label>
              <select value={selectedSchoolYear?.id || ''} onChange={(e) => { const sy = schoolYears.find(s => s.id === parseInt(e.target.value)); setSelectedSchoolYear(sy); setSelectedSection(null); setSelectedGradeLevelFilter(''); }} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none">
                <option value="">All School Years</option>
                {schoolYears.map(sy => <option key={sy.id} value={sy.id}>{sy.year_start}-{sy.year_end} {sy.is_active ? '(Active)' : ''}</option>)}
              </select>
            </div>

            {/* Grade Level */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Grade Level</label>
              <select value={selectedGradeLevelFilter} onChange={(e) => setSelectedGradeLevelFilter(e.target.value)} disabled={!selectedSchoolYear} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none disabled:opacity-50">
                <option value="">All Grade Levels</option>
                {getGradeLevelOptions().map(gl => <option key={gl.value} value={gl.value}>{gl.label}</option>)}
              </select>
            </div>

            {/* Section - filtered by selected grade level */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
              <select value={selectedSection?.id || ''} onChange={(e) => { const sec = sections.find(s => s.id === parseInt(e.target.value)); setSelectedSection(sec); }} disabled={!selectedSchoolYear || (!selectedGradeLevelFilter && sections.length === 0)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none disabled:opacity-50">
                <option value="">All Sections</option>
                {filteredSectionsByGrade.map(sec => <option key={sec.id} value={sec.id}>{sec.section_name}</option>)}
              </select>
              {selectedGradeLevelFilter && filteredSectionsByGrade.length === 0 && <p className="text-xs text-amber-500 mt-1">No sections for this grade level</p>}
            </div>

            {/* Search */}
           
           <div className="relative">
  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
  <input type="text" placeholder="Search by name or LRN..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
</div>

            {/* Status Filter (replaces the old filterGrade & filterStatus we moved) */}
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none">
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Dropped">Dropped</option>
            </select>
          </div>
        </div>

        {/* Statistics Cards (unchanged) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase">Total Students</p><p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p></div>
          <div className="bg-white border border-gray-100 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase">Sections</p><p className="text-2xl font-bold text-gray-800">{stats.totalSections}</p></div>
          <div className="bg-white border border-gray-100 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase">Grade Levels</p><p className="text-2xl font-bold text-gray-800">{stats.totalGradeLevels}</p></div>
          <div className="bg-white border border-gray-100 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase">Male</p><p className="text-2xl font-bold text-blue-600">{stats.maleCount}</p></div>
          <div className="bg-white border border-gray-100 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase">Female</p><p className="text-2xl font-bold text-pink-600">{stats.femaleCount}</p></div>
          <div className="bg-white border border-gray-100 rounded-xl p-4"><p className="text-xs text-gray-400 uppercase">Active</p><p className="text-2xl font-bold text-green-600">{stats.totalEnrollments}</p></div>
        </div>

        {/* Grade Level Distribution */}
        {stats.byGradeLevel.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Enrollment by Grade Level</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {stats.byGradeLevel.map(grade => (
                <div key={grade.grade} className="text-center">
                  <div className="text-xs font-medium text-gray-500 mb-1">{grade.grade}</div>
                  <div className="text-xl font-bold text-indigo-600">{grade.count}</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2"><div className="bg-indigo-600 rounded-full h-1.5" style={{ width: `${(grade.count / stats.totalStudents) * 100}%` }}></div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32"><Loader2 className="animate-spin text-indigo-600" size={48} /><p className="text-gray-500 text-sm mt-4">Loading enrollments...</p></div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">LRN</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Grade & Section</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Guardian</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Enrolled Date</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-center px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEnrollments.length > 0 ? filteredEnrollments.map((enrollment, idx) => (
                    <tr key={enrollment.id || idx} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center"><span className="text-xs font-bold text-indigo-600">{enrollment.student_name?.charAt(0) || 'S'}</span></div>
                          <p className="font-medium text-gray-800 text-sm">{enrollment.student_name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3"><span className="font-mono text-xs text-gray-600">{enrollment.lrn || 'N/A'}</span></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap size={12} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{enrollment.grade_display || (enrollment.grade_level === 0 ? 'Kinder' : `Grade ${enrollment.grade_level}`)} - {enrollment.section}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3"><div><p className="text-sm text-gray-700">{enrollment.guardian || 'N/A'}</p><p className="text-[10px] text-gray-400">{enrollment.contact || 'No contact'}</p></div></td>
                      <td className="px-5 py-3"><span className="text-sm text-gray-600">{enrollment.enrolled_date || 'N/A'}</span></td>
                      <td className="px-5 py-3 text-center">{getStatusBadge(enrollment.status)}</td>
                      <td className="px-5 py-3 text-center">
                        <button onClick={() => navigate(`/admin/students/${enrollment.student_id || enrollment.id}`)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Eye size={12} /> View</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="px-5 py-12 text-center"><div className="flex flex-col items-center"><Users size={32} className="text-gray-300 mb-2" /><p className="text-gray-400 text-sm">No enrollment records found</p></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Summary */}
        {filteredEnrollments.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
            <p>Showing {filteredEnrollments.length} of {enrollments.length} enrollments</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Active</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Completed</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Dropped</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveEnrollments;