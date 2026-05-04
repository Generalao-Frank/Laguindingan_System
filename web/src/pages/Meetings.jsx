import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, Users, AlertCircle, 
  Plus, Edit, Trash2, X, CheckCircle, XCircle, 
  Loader2, Filter, ChevronDown, ChevronUp, 
  Video, Map, Building, MessageSquare, UserCheck
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const Meetings = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    audience: '',
    status: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    meeting_datetime: '',
    audience: 'All',
    status: 'Scheduled'
  });

  const token = localStorage.getItem('userToken');

  useEffect(() => {
    fetchMeetings();
  }, [filters]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.audience) params.audience = filters.audience;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      
      const response = await axios.get(`${API_URL}/admin/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      if (response.data.success) {
        setMeetings(response.data.meetings);
      } else {
        setError(response.data.message || 'Failed to load meetings');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title || !formData.meeting_datetime) {
      setError('Title and meeting date/time are required');
      return;
    }
    
    try {
      // Convert local datetime to ISO string for backend
      const payload = {
        ...formData,
        meeting_datetime: new Date(formData.meeting_datetime).toISOString()
      };
      
      if (editingId) {
        await axios.put(`${API_URL}/admin/meetings/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/admin/meetings`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      resetForm();
      fetchMeetings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save meeting');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await axios.delete(`${API_URL}/admin/meetings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMeetings();
    } catch (err) {
      setError('Failed to delete meeting');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/admin/meetings/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMeetings();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const openEditModal = (meeting) => {
    // Format datetime for local datetime-local input
    const localDateTime = meeting.meeting_datetime 
      ? new Date(meeting.meeting_datetime).toISOString().slice(0, 16)
      : '';
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      location: meeting.location || '',
      meeting_datetime: localDateTime,
      audience: meeting.audience,
      status: meeting.status
    });
    setEditingId(meeting.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      meeting_datetime: '',
      audience: 'All',
      status: 'Scheduled'
    });
    setEditingId(null);
  };

  const getAudienceBadge = (audience) => {
    const colors = {
      Teachers: 'bg-blue-100 text-blue-800',
      Students: 'bg-green-100 text-green-800',
      All: 'bg-purple-100 text-purple-800'
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[audience]}`}>{audience}</span>;
  };

  const getStatusBadge = (status) => {
    const colors = {
      Scheduled: 'bg-yellow-100 text-yellow-800',
      Completed: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800'
    };
    const icons = {
      Scheduled: <Clock size={12} className="mr-1" />,
      Completed: <CheckCircle size={12} className="mr-1" />,
      Cancelled: <XCircle size={12} className="mr-1" />
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
        {icons[status]} {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar size={24} className="text-indigo-600" />
              Meeting Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">Schedule and manage meetings for teachers and students</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={18} />
            Schedule Meeting
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-500"><X size={16} /></button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="font-medium text-gray-700">Filters</span>
              {(filters.audience || filters.status || filters.search) && (
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">Active</span>
              )}
            </div>
            {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {showFilters && (
            <div className="border-t p-4 grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Audience</label>
                <select
                  value={filters.audience}
                  onChange={(e) => setFilters({...filters, audience: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Audiences</option>
                  <option value="Teachers">Teachers</option>
                  <option value="Students">Students</option>
                  <option value="All">All</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ audience: '', status: '', search: '' })}
                  className="text-sm text-gray-500 hover:text-indigo-600"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : meetings.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No meetings found. Schedule your first meeting!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {meetings.map(meeting => (
              <div key={meeting.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">{meeting.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {getAudienceBadge(meeting.audience)}
                      {getStatusBadge(meeting.status)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {meeting.status === 'Scheduled' && (
                      <>
                        <button onClick={() => openEditModal(meeting)} className="p-1 text-gray-400 hover:text-indigo-600" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleStatusChange(meeting.id, 'Completed')} className="p-1 text-gray-400 hover:text-green-600" title="Mark Completed">
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={() => handleStatusChange(meeting.id, 'Cancelled')} className="p-1 text-gray-400 hover:text-red-600" title="Cancel">
                          <XCircle size={16} />
                        </button>
                        <button onClick={() => handleDelete(meeting.id)} className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {(meeting.status === 'Completed' || meeting.status === 'Cancelled') && (
                      <button onClick={() => handleDelete(meeting.id)} className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                {meeting.description && (
                  <p className="text-sm text-gray-600 mt-2">{meeting.description}</p>
                )}
                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>{new Date(meeting.meeting_datetime).toLocaleDateString()}</span>
                    <Clock size={14} className="ml-2" />
                    <span>{new Date(meeting.meeting_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {meeting.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{meeting.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <UserCheck size={14} />
                    <span>Created by: {meeting.creator_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">{editingId ? 'Edit Meeting' : 'Schedule Meeting'}</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Faculty Meeting, PTA Assembly"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Agenda, notes, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location / Link</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg"
                        placeholder="Room 101, Google Meet link, etc."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.meeting_datetime}
                      onChange={(e) => setFormData({...formData, meeting_datetime: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Audience *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Teachers', 'Students', 'All'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFormData({...formData, audience: opt})}
                          className={`py-2 rounded-lg text-sm font-medium transition ${
                            formData.audience === opt
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {editingId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">
                      {editingId ? 'Update' : 'Schedule'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Meetings;