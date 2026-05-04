import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Save, X, Loader2, 
  DoorOpen, Users, Building, Calendar, CheckCircle, 
  AlertCircle, Search, RefreshCw, ArrowLeft, 
  ChevronRight, Layers, Home, Settings, Activity
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const Rooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    room_name: '',
    capacity: '',
  });


  const token = localStorage.getItem('userToken');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setRooms(response.data.rooms);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showAlert('Failed to load rooms', 'error');
      // Fallback data
      setRooms([
        { id: 1, room_name: 'ROOM 101', capacity: 40, sections_count: 2, status: 'Occupied' },
        { id: 2, room_name: 'ROOM 102', capacity: 35, sections_count: 1, status: 'Occupied' },
        { id: 3, room_name: 'ROOM 103', capacity: 40, sections_count: 0, status: 'Available' },
        { id: 4, room_name: 'MUSIC ROOM', capacity: 30, sections_count: 0, status: 'Available' },
        { id: 5, room_name: 'COMPUTER LAB', capacity: 25, sections_count: 1, status: 'Occupied' },
        { id: 6, room_name: 'SCIENCE LAB', capacity: 30, sections_count: 0, status: 'Available' },
      ]);
    } finally {
      setIsLoading(false);
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

    // Validate duplicate room name
    if (!editingRoom) {
      const existingRoom = rooms.find(r => 
        r.room_name === formData.room_name.toUpperCase()
      );
      
      if (existingRoom) {
        showAlert(`Room "${formData.room_name}" already exists!`, 'error');
        setIsLoading(false);
        return;
      }
    } else {
      const existingRoom = rooms.find(r => 
        r.room_name === formData.room_name.toUpperCase() && 
        r.id !== editingRoom.id
      );
      
      if (existingRoom) {
        showAlert(`Room "${formData.room_name}" already exists!`, 'error');
        setIsLoading(false);
        return;
      }
    }

    try {
      let response;
      const submitData = {
        room_name: formData.room_name.toUpperCase(),
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
      };

      if (editingRoom) {
        response = await axios.put(`${API_URL}/admin/rooms/${editingRoom.id}`, submitData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        response = await axios.post(`${API_URL}/admin/rooms`, submitData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      if (response.data.success) {
        showAlert(
          editingRoom ? 'Room updated successfully!' : 'Room added successfully!', 
          'success'
        );
        setShowModal(false);
        setFormData({ room_name: '', capacity: '' });
        setEditingRoom(null);
        fetchRooms();
      }
    } catch (error) {
      console.error('Error saving room:', error);
      
      if (error.response?.status === 422) {
        const errors = error.response?.data?.errors;
        if (errors && errors.room_name) {
          showAlert(errors.room_name[0] || 'Invalid room name', 'error');
        } else if (errors && errors.capacity) {
          showAlert('Invalid capacity value', 'error');
        } else {
          showAlert(error.response?.data?.message || 'Failed to save room', 'error');
        }
      } else if (error.response?.data?.message?.includes('already exists')) {
        showAlert(`Room "${formData.room_name}" already exists!`, 'error');
      } else {
        showAlert(error.response?.data?.message || 'Failed to save room', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (room) => {
    if (room.sections_count > 0) {
      showAlert(`Cannot delete "${room.room_name}" because it has ${room.sections_count} section(s) assigned.`, 'error');
      return;
    }
    
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to delete room "${room.room_name}"?\n\nThis action cannot be undone!`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/admin/rooms/${room.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchRooms();
      showAlert(`Room "${room.room_name}" deleted successfully!`, 'success');
    } catch (error) {
      console.error('Error deleting room:', error);
      showAlert(error.response?.data?.message || 'Failed to delete room', 'error');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Available') {
      return <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Available</span>;
    } else if (status === 'Occupied') {
      return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Occupied</span>;
    }
    return <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Unknown</span>;
  };

  const filteredRooms = rooms.filter(room => 
    room.room_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalRooms = rooms.length;
  const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0);
  const occupiedRooms = rooms.filter(room => room.status === 'Occupied').length;
  const availableRooms = rooms.filter(room => room.status === 'Available').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <DoorOpen size={24} className="text-indigo-600" />
                Rooms Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage classrooms and facilities
              </p>
            </div>
            
            <button 
              onClick={() => {
                setEditingRoom(null);
                setFormData({ room_name: '', capacity: '' });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
            >
              <Plus size={16} />
              Add Room
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalRooms}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <DoorOpen size={18} className="text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total Capacity</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{totalCapacity}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Users size={18} className="text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Occupied</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{occupiedRooms}</p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Activity size={18} className="text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Available</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{availableRooms}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle size={18} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search rooms..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Rooms Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-gray-500 text-sm mt-4">Loading rooms...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRooms.map((room) => (
              <div 
                key={room.id} 
                className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 group"
              >
                <div className={`p-4 ${
                  room.status === 'Available' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                } text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DoorOpen size={20} className="text-white/90" />
                      <h3 className="text-lg font-bold">{room.room_name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingRoom(room);
                          setFormData({
                            room_name: room.room_name,
                            capacity: room.capacity?.toString() || '',
                          });
                          setShowModal(true);
                        }}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                      >
                        <Edit2 size={14} className="text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(room)}
                        className="p-1.5 bg-white/20 hover:bg-red-500/50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users size={14} />
                        <span className="text-xs">Capacity</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {room.capacity ? `${room.capacity} students` : 'No limit'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Building size={14} />
                        <span className="text-xs">Sections</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{room.sections_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Activity size={14} />
                        <span className="text-xs">Status</span>
                      </div>
                      {getStatusBadge(room.status)}
                    </div>
                  </div>

                  <div className="my-3 border-t border-gray-100"></div>

                  <button 
                    onClick={() => navigate(`/admin/rooms/${room.id}/sections`)}
                    className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    View Assigned Sections
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredRooms.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DoorOpen size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Rooms Found</h3>
            <p className="text-gray-400 text-sm mb-4">Get started by adding your first room</p>
            <button 
              onClick={() => {
                setEditingRoom(null);
                setFormData({ room_name: '', capacity: '' });
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm"
            >
              <Plus size={16} />
              Add Room
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingRoom ? 'Edit Room' : 'Add New Room'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Room Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    value={formData.room_name}
                    onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                    placeholder="e.g., ROOM 101, MUSIC ROOM, COMPUTER LAB"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-sm uppercase"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Use uppercase letters for room names</p>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="e.g., 40"
                    min="0"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Maximum number of students (leave empty for no limit)</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isLoading ? 'Saving...' : (editingRoom ? 'Update' : 'Save')}
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

export default Rooms;