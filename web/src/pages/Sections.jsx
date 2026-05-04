import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Save, X, Loader2, 
  Users, BookOpen, Calendar, CheckCircle, AlertCircle, 
  Search, RefreshCw, ArrowLeft, School, User, Home,
  ChevronRight, Layers, GraduationCap, Briefcase, DoorOpen
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const Sections = () => {
  const navigate = useNavigate();
  const { gradeLevelId } = useParams();
  const [sections, setSections] = useState([]);
  const [gradeLevel, setGradeLevel] = useState(null);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // I-convert ang gradeLevelId sa integer para sigurado
  const parsedGradeLevelId = gradeLevelId ? parseInt(gradeLevelId, 10) : null;
  
  const [formData, setFormData] = useState({
    section_name: '',
    grade_level_id: parsedGradeLevelId || '',
    room_id: '',
    adviser_id: '',
    school_year_id: '',
  });

  
  const token = localStorage.getItem('userToken');

  useEffect(() => {
    fetchGradeLevels();
    fetchRooms();
    fetchTeachers();
    fetchSchoolYears();
    
    if (parsedGradeLevelId) {
      fetchGradeLevelDetails();
      fetchSections();
    } else {
      fetchAllSections();
    }
  }, [parsedGradeLevelId]);

  const fetchGradeLevels = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/grade-levels`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) setGradeLevels(response.data.grade_levels);
    } catch (error) {
      console.error('Error fetching grade levels:', error);
    }
  };

  const fetchGradeLevelDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/grade-levels/${parsedGradeLevelId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) setGradeLevel(response.data.grade_level);
    } catch (error) {
      console.error('Error fetching grade level details:', error);
    }
  };

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/grade-levels/${parsedGradeLevelId}/sections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) setSections(response.data.sections);
    } catch (error) {
      console.error('Error fetching sections:', error);
      showAlert('Failed to load sections', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllSections = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/sections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) setSections(response.data.sections);
    } catch (error) {
      console.error('Error fetching sections:', error);
      showAlert('Failed to load sections', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) setRooms(response.data.rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) setTeachers(response.data.teachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchSchoolYears = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/school-years`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setSchoolYears(response.data.school_years);
        const activeYear = response.data.school_years.find(sy => sy.is_active);
        if (activeYear && !formData.school_year_id) {
          setFormData(prev => ({ ...prev, school_year_id: activeYear.id }));
        }
      }
    } catch (error) {
      console.error('Error fetching school years:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Tiyaking ang grade_level_id ay integer at hindi null
    let targetGradeLevelId = formData.grade_level_id;
    if (parsedGradeLevelId) {
      // Kung nasa grade-specific page, i-force ang grade_level_id mula sa URL
      targetGradeLevelId = parsedGradeLevelId;
    } else if (!targetGradeLevelId) {
      showAlert('Please select a grade level', 'error');
      setIsLoading(false);
      return;
    }

    const gradeLevelIdInt = parseInt(targetGradeLevelId, 10);
    if (isNaN(gradeLevelIdInt)) {
      showAlert('Invalid grade level', 'error');
      setIsLoading(false);
      return;
    }

    // Validate duplicate section name
    const existingSection = sections.find(s => 
      s.section_name === formData.section_name.toUpperCase() && 
      s.grade_level_id === gradeLevelIdInt &&
      (!editingSection || s.id !== editingSection.id)
    );
    
    if (existingSection) {
      showAlert(`Section "${formData.section_name}" already exists in this grade level!`, 'error');
      setIsLoading(false);
      return;
    }

    try {
      const submitData = {
        section_name: formData.section_name.toUpperCase(),
        grade_level_id: gradeLevelIdInt,
        room_id: formData.room_id ? parseInt(formData.room_id, 10) : null,
        adviser_id: formData.adviser_id ? parseInt(formData.adviser_id, 10) : null,
        school_year_id: parseInt(formData.school_year_id, 10),
      };

      let response;
      if (editingSection) {
        response = await axios.put(`${API_URL}/admin/sections/${editingSection.id}`, submitData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        response = await axios.post(`${API_URL}/admin/sections`, submitData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      if (response.data.success) {
        showAlert(editingSection ? 'Section updated successfully!' : 'Section added successfully!', 'success');
        setShowModal(false);
        setFormData({
          section_name: '',
          grade_level_id: parsedGradeLevelId || '',
          room_id: '',
          adviser_id: '',
          school_year_id: schoolYears.find(sy => sy.is_active)?.id || '',
        });
        setEditingSection(null);
        
        if (parsedGradeLevelId) fetchSections();
        else fetchAllSections();
      }
    } catch (error) {
      console.error('Error saving section:', error);
      const msg = error.response?.data?.message || 'Failed to save section';
      showAlert(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (section) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to delete section "${section.section_name}"?\n\nThis will delete enrollments, grades, attendance, and teacher assignments.\nAction cannot be undone!`)) return;

    try {
      await axios.delete(`${API_URL}/admin/sections/${section.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (parsedGradeLevelId) fetchSections();
      else fetchAllSections();
      showAlert(`Section "${section.section_name}" deleted successfully!`, 'success');
    } catch (error) {
      showAlert(error.response?.data?.message || 'Failed to delete section', 'error');
    }
  };

  const getGradeDisplay = (grade) => grade === 0 ? 'Kinder' : `Grade ${grade}`;

  const filteredSections = sections.filter(section =>
    section.section_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.grade_display?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              {parsedGradeLevelId && (
                <button onClick={() => navigate('/admin/grade-levels')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-2">
                  <ArrowLeft size={16} /> Back to Grade Levels
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <Users size={24} className="text-indigo-600" />
                {gradeLevel ? `${gradeLevel.grade_display} - Sections` : 'Sections Management'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {gradeLevel ? `Manage sections for ${gradeLevel.grade_display}` : 'Manage all sections across grade levels'}
              </p>
            </div>
            <button onClick={() => {
              setEditingSection(null);
              setFormData({
                section_name: '',
                grade_level_id: parsedGradeLevelId || '',
                room_id: '',
                adviser_id: '',
                school_year_id: schoolYears.find(sy => sy.is_active)?.id || '',
              });
              setShowModal(true);
            }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium">
              <Plus size={16} /> Add Section
            </button>
          </div>
        </div>

        {/* Alerts */}
        {showSuccess && <div className="fixed top-24 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3"><CheckCircle size={18} />{successMessage}</div>}
        {error && <div className="fixed top-24 right-6 z-50 bg-red-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3"><AlertCircle size={18} />{errorMessage}<button onClick={() => setError(false)} className="ml-auto"><X size={14} /></button></div>}

        {/* Search */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search sections..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* Sections Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32"><Loader2 className="animate-spin text-indigo-600" size={40} /><p className="text-gray-500 text-sm mt-4">Loading sections...</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSections.map(section => (
              <div key={section.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 group">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><School size={20} /><h3 className="text-lg font-bold">{section.section_name}</h3></div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => {
                        setEditingSection(section);
                        setFormData({
                          section_name: section.section_name,
                          grade_level_id: section.grade_level_id,
                          room_id: section.room_id || '',
                          adviser_id: section.adviser_id || '',
                          school_year_id: section.school_year_id || schoolYears.find(sy => sy.is_active)?.id || '',
                        });
                        setShowModal(true);
                      }} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(section)} className="p-1.5 bg-white/20 hover:bg-red-500/50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="flex items-center gap-2 text-gray-500"><GraduationCap size={14} /> Grade Level</span><span className="font-semibold">{section.grade_display || getGradeDisplay(section.grade_level)}</span></div>
                    <div className="flex justify-between"><span className="flex items-center gap-2 text-gray-500"><DoorOpen size={14} /> Room</span><span>{section.room_name || 'Not Assigned'}</span></div>
                    <div className="flex justify-between"><span className="flex items-center gap-2 text-gray-500"><User size={14} /> Adviser</span><span>{section.adviser_name || 'Not Assigned'}</span></div>
                    <div className="flex justify-between"><span className="flex items-center gap-2 text-gray-500"><Users size={14} /> Students</span><span className="font-semibold text-indigo-600">{section.students_count || 0}</span></div>
                    <div className="flex justify-between"><span className="flex items-center gap-2 text-gray-500"><Calendar size={14} /> School Year</span><span>{section.school_year || 'Current'}</span></div>
                  </div>
                  <div className="my-3 border-t border-gray-100"></div>
                  <button onClick={() => navigate(`/admin/sections/${section.id}/students`)} className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"><ChevronRight size={12} /> View Students</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredSections.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <Users size={24} className="text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Sections Found</h3>
            <p className="text-gray-400 text-sm mb-4">{gradeLevel ? `No sections added for ${gradeLevel.grade_display} yet` : 'No sections added yet'}</p>
            <button onClick={() => { setEditingSection(null); setFormData({ section_name: '', grade_level_id: parsedGradeLevelId || '', room_id: '', adviser_id: '', school_year_id: schoolYears.find(sy => sy.is_active)?.id || '' }); setShowModal(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus size={16} /> Add Section</button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{editingSection ? 'Edit Section' : 'Add New Section'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Name *</label>
                  <input type="text" value={formData.section_name} onChange={(e) => setFormData({ ...formData, section_name: e.target.value })} placeholder="e.g., DIAMOND, EMERALD" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg uppercase" required />
                </div>
                {!parsedGradeLevelId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level *</label>
                    <select value={formData.grade_level_id} onChange={(e) => setFormData({ ...formData, grade_level_id: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" required>
                      <option value="">Select Grade Level</option>
                      {gradeLevels.map(grade => <option key={grade.id} value={grade.id}>{grade.grade_display}</option>)}
                    </select>
                  </div>
                )}
                {/* Hidden input to ensure grade_level_id is sent when in grade-specific view */}
                {parsedGradeLevelId && <input type="hidden" name="grade_level_id" value={parsedGradeLevelId} />}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
                  <select value={formData.room_id} onChange={(e) => setFormData({ ...formData, room_id: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <option value="">Select Room</option>
                    {rooms.map(room => <option key={room.id} value={room.id}>{room.room_name} {room.capacity ? `(Cap: ${room.capacity})` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adviser (Optional)</label>
                  <select value={formData.adviser_id} onChange={(e) => setFormData({ ...formData, adviser_id: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <option value="">Select Adviser</option>
                    {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.first_name} {teacher.last_name} ({teacher.employee_id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Year *</label>
                  <select value={formData.school_year_id} onChange={(e) => setFormData({ ...formData, school_year_id: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" required>
                    <option value="">Select School Year</option>
                    {schoolYears.map(sy => <option key={sy.id} value={sy.id}>{sy.year_start}-{sy.year_end} {sy.is_active ? '(Active)' : ''}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isLoading ? 'Saving...' : (editingSection ? 'Update' : 'Save')}
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

export default Sections;