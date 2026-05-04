// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   Calendar, Clock, FileText, CheckCircle, XCircle, 
//   AlertCircle, Loader2, Plus, Edit, Trash2, Eye,
//   Upload, Users, BookOpen, ChevronRight, Send,
//   MessageSquare, Star, Image as ImageIcon, Download
// } from 'lucide-react';
// import axios from 'axios';
// import API_URL from '../config';

// const Activities = () => {
//   const navigate = useNavigate();
//   const [activities, setActivities] = useState([]);
//   const [sections, setSections] = useState([]);
//   const [subjects, setSubjects] = useState([]);
//   const [selectedSection, setSelectedSection] = useState('');
//   const [selectedSubject, setSelectedSubject] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
//   const [selectedActivity, setSelectedActivity] = useState(null);
//   const [submissions, setSubmissions] = useState([]);
//   const [gradingLoading, setGradingLoading] = useState(false);
  
//   // Form state for new/edit activity
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     deadline: '',
//     max_points: 100,
//     section_id: '',
//     subject_id: ''
//   });
//   const [editingId, setEditingId] = useState(null);

//   const token = localStorage.getItem('userToken');

//   useEffect(() => {
//     fetchInitialData();
//   }, []);

//   useEffect(() => {
//     if (selectedSection && selectedSubject) {
//       fetchActivities();
//     }
//   }, [selectedSection, selectedSubject]);

//   const fetchInitialData = async () => {
//     try {
//       const [sectionsRes, subjectsRes] = await Promise.all([
//         axios.get(`${API_URL}/teacher/sections`, { headers: { Authorization: `Bearer ${token}` } }),
//         axios.get(`${API_URL}/teacher/subjects`, { headers: { Authorization: `Bearer ${token}` } })
//       ]);
//       if (sectionsRes.data.success) setSections(sectionsRes.data.sections);
//       if (subjectsRes.data.success) setSubjects(subjectsRes.data.subjects);
//     } catch (err) {
//       console.error(err);
//       setError('Failed to load sections/subjects');
//     }
//   };

//   const fetchActivities = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get(`${API_URL}/teacher/activities`, {
//         headers: { Authorization: `Bearer ${token}` },
//         params: { section_id: selectedSection, subject_id: selectedSubject }
//       });
//       if (response.data.success) {
//         setActivities(response.data.activities);
//       }
//     } catch (err) {
//       console.error(err);
//       setError('Failed to load activities');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateOrUpdate = async (e) => {
//     e.preventDefault();
//     setError('');
//     try {
//       if (editingId) {
//         await axios.put(`${API_URL}/teacher/activities/${editingId}`, formData, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//       } else {
//         await axios.post(`${API_URL}/teacher/activities`, formData, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//       }
//       setShowCreateModal(false);
//       resetForm();
//       fetchActivities();
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to save activity');
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm('Are you sure you want to delete this activity?')) return;
//     try {
//       await axios.delete(`${API_URL}/teacher/activities/${id}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       fetchActivities();
//     } catch (err) {
//       setError('Failed to delete activity');
//     }
//   };

//   const viewSubmissions = async (activity) => {
//     setSelectedActivity(activity);
//     setLoading(true);
//     try {
//       const response = await axios.get(`${API_URL}/teacher/activities/${activity.id}/submissions`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       if (response.data.success) {
//         setSubmissions(response.data.submissions);
//         setShowSubmissionsModal(true);
//       }
//     } catch (err) {
//       setError('Failed to load submissions');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const gradeSubmission = async (submissionId, pointsEarned, feedback) => {
//     setGradingLoading(true);
//     try {
//       await axios.post(`${API_URL}/teacher/submissions/${submissionId}/grade`, 
//         { points_earned: pointsEarned, feedback },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       // Refresh submissions
//       viewSubmissions(selectedActivity);
//     } catch (err) {
//       setError('Failed to save grade');
//     } finally {
//       setGradingLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       title: '',
//       description: '',
//       deadline: '',
//       max_points: 100,
//       section_id: selectedSection,
//       subject_id: selectedSubject
//     });
//     setEditingId(null);
//   };

//   const openEditModal = (activity) => {
//     setFormData({
//       title: activity.title,
//       description: activity.description || '',
//       deadline: activity.deadline ? activity.deadline.slice(0, 16) : '',
//       max_points: activity.max_points,
//       section_id: activity.section_id,
//       subject_id: activity.subject_id
//     });
//     setEditingId(activity.id);
//     setShowCreateModal(true);
//   };

//   const getGradeDisplay = (points, maxPoints) => {
//     if (points === undefined || points === null) return 'Not graded';
//     const percent = (points / maxPoints) * 100;
//     return `${points}/${maxPoints} (${Math.round(percent)}%)`;
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-[1400px] mx-auto">
//         {/* Header */}
//         <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
//               <FileText size={24} className="text-indigo-600" />
//               Learning Activities
//             </h1>
//             <p className="text-gray-500 text-sm mt-1">Create and manage activities for your classes</p>
//           </div>
//           <button
//             onClick={() => { resetForm(); setShowCreateModal(true); }}
//             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
//           >
//             <Plus size={18} />
//             Create Activity
//           </button>
//         </div>

//         {/* Filters */}
//         <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4">
//           <div className="flex-1 min-w-[200px]">
//             <label className="block text-xs font-medium text-gray-500 mb-1">Select Section</label>
//             <select
//               value={selectedSection}
//               onChange={(e) => setSelectedSection(e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
//             >
//               <option value="">All Sections</option>
//               {sections.map(sec => (
//                 <option key={sec.id} value={sec.id}>{sec.section_name}</option>
//               ))}
//             </select>
//           </div>
//           <div className="flex-1 min-w-[200px]">
//             <label className="block text-xs font-medium text-gray-500 mb-1">Select Subject</label>
//             <select
//               value={selectedSubject}
//               onChange={(e) => setSelectedSubject(e.target.value)}
//               className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
//             >
//               <option value="">All Subjects</option>
//               {subjects.map(sub => (
//                 <option key={sub.id} value={sub.id}>{sub.subject_name}</option>
//               ))}
//             </select>
//           </div>
//         </div>

//         {/* Activities List */}
//         {loading ? (
//           <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
//         ) : activities.length === 0 ? (
//           <div className="bg-white rounded-xl p-12 text-center">
//             <FileText size={48} className="mx-auto text-gray-300 mb-3" />
//             <p className="text-gray-500">No activities found. Create your first activity!</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
//             {activities.map(activity => (
//               <div key={activity.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition p-5">
//                 <div className="flex justify-between items-start">
//                   <h3 className="font-semibold text-gray-800 text-lg">{activity.title}</h3>
//                   <div className="flex gap-1">
//                     <button onClick={() => openEditModal(activity)} className="p-1 text-gray-400 hover:text-indigo-600">
//                       <Edit size={16} />
//                     </button>
//                     <button onClick={() => handleDelete(activity.id)} className="p-1 text-gray-400 hover:text-red-600">
//                       <Trash2 size={16} />
//                     </button>
//                   </div>
//                 </div>
//                 <p className="text-sm text-gray-600 mt-2 line-clamp-2">{activity.description || 'No description'}</p>
//                 <div className="mt-3 space-y-1 text-xs text-gray-500">
//                   <div className="flex items-center gap-1"><Calendar size={12} /> Due: {activity.deadline ? new Date(activity.deadline).toLocaleString() : 'No deadline'}</div>
//                   <div className="flex items-center gap-1"><Star size={12} /> Max points: {activity.max_points}</div>
//                   <div className="flex items-center gap-1"><BookOpen size={12} /> {activity.subject_name} | {activity.section_name}</div>
//                 </div>
//                 <div className="mt-4 flex gap-2">
//                   <button
//                     onClick={() => viewSubmissions(activity)}
//                     className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border border-indigo-200 text-indigo-700 rounded-lg text-sm hover:bg-indigo-50"
//                   >
//                     <Users size={14} /> Submissions
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Create/Edit Modal */}
//         {showCreateModal && (
//           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
//               <div className="p-6">
//                 <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Activity' : 'New Activity'}</h2>
//                 <form onSubmit={handleCreateOrUpdate} className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">Title *</label>
//                     <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
//                       className="mt-1 w-full px-3 py-2 border rounded-lg" />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">Description</label>
//                     <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
//                       className="mt-1 w-full px-3 py-2 border rounded-lg" />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">Deadline</label>
//                     <input type="datetime-local" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})}
//                       className="mt-1 w-full px-3 py-2 border rounded-lg" />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">Max Points</label>
//                     <input type="number" min="1" required value={formData.max_points} onChange={(e) => setFormData({...formData, max_points: parseInt(e.target.value)})}
//                       className="mt-1 w-full px-3 py-2 border rounded-lg" />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">Section</label>
//                     <select value={formData.section_id} onChange={(e) => setFormData({...formData, section_id: e.target.value})} required
//                       className="mt-1 w-full px-3 py-2 border rounded-lg">
//                       <option value="">Select Section</option>
//                       {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.section_name}</option>)}
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">Subject</label>
//                     <select value={formData.subject_id} onChange={(e) => setFormData({...formData, subject_id: e.target.value})} required
//                       className="mt-1 w-full px-3 py-2 border rounded-lg">
//                       <option value="">Select Subject</option>
//                       {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.subject_name}</option>)}
//                     </select>
//                   </div>
//                   <div className="flex gap-3 pt-2">
//                     <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
//                     <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">{editingId ? 'Update' : 'Create'}</button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Submissions Modal */}
//         {showSubmissionsModal && selectedActivity && (
//           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//               <div className="p-6">
//                 <div className="flex justify-between items-start mb-4">
//                   <h2 className="text-xl font-bold">Submissions: {selectedActivity.title}</h2>
//                   <button onClick={() => setShowSubmissionsModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
//                 </div>
//                 {submissions.length === 0 ? (
//                   <p className="text-gray-500 text-center py-8">No submissions yet.</p>
//                 ) : (
//                   <div className="space-y-4">
//                     {submissions.map(sub => (
//                       <div key={sub.id} className="border rounded-lg p-4">
//                         <div className="flex justify-between items-start flex-wrap gap-2">
//                           <div>
//                             <p className="font-medium">{sub.student_name}</p>
//                             <p className="text-sm text-gray-500">LRN: {sub.lrn}</p>
//                           </div>
//                           <div className="text-sm">
//                             <span className="font-medium">Status: </span>
//                             {sub.points_earned !== null ? (
//                               <span className="text-green-600">{getGradeDisplay(sub.points_earned, selectedActivity.max_points)}</span>
//                             ) : (
//                               <span className="text-yellow-600">Pending</span>
//                             )}
//                           </div>
//                         </div>
//                         {sub.image_path && (
//                           <div className="mt-2">
//                             <a href={sub.image_path} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-sm flex items-center gap-1">
//                               <ImageIcon size={14} /> View Submission Image
//                             </a>
//                           </div>
//                         )}
//                         {sub.feedback && (
//                           <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
//                             <MessageSquare size={12} className="inline mr-1" /> Feedback: {sub.feedback}
//                           </div>
//                         )}
//                         {sub.points_earned === null && (
//                           <div className="mt-3 pt-3 border-t">
//                             <div className="flex gap-2 items-center">
//                               <input type="number" placeholder="Points" className="w-24 px-2 py-1 border rounded text-sm" id={`points-${sub.id}`} />
//                               <input type="text" placeholder="Feedback (optional)" className="flex-1 px-2 py-1 border rounded text-sm" id={`feedback-${sub.id}`} />
//                               <button
//                                 onClick={() => {
//                                   const points = document.getElementById(`points-${sub.id}`).value;
//                                   const feedback = document.getElementById(`feedback-${sub.id}`).value;
//                                   if (points !== '') gradeSubmission(sub.id, parseInt(points), feedback);
//                                 }}
//                                 disabled={gradingLoading}
//                                 className="px-3 py-1 bg-indigo-600 text-white rounded text-sm flex items-center gap-1"
//                               >
//                                 <Send size={12} /> Grade
//                               </button>
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Activities;