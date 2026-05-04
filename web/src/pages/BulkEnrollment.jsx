import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, Download, FileText, CheckCircle, 
  AlertCircle, Loader2, ArrowLeft, Trash2, X
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const BulkEnrollment = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [sections, setSections] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [gradeLevelMapping, setGradeLevelMapping] = useState({});

  const token = localStorage.getItem('userToken');

  // Static grade levels: Kinder (0) to Grade 6 (6)
  const gradeLevels = [
    { grade_level: 0, display: 'Kinder' },
    { grade_level: 1, display: 'Grade 1' },
    { grade_level: 2, display: 'Grade 2' },
    { grade_level: 3, display: 'Grade 3' },
    { grade_level: 4, display: 'Grade 4' },
    { grade_level: 5, display: 'Grade 5' },
    { grade_level: 6, display: 'Grade 6' },
  ];

  // Build mapping from numeric grade_level (0-6) to grade_level_id (DB primary key)
  useEffect(() => {
    if (sections.length > 0) {
      const mapping = {};
      sections.forEach(sec => {
        if (sec.grade_level !== undefined && sec.grade_level_id) {
          mapping[sec.grade_level] = sec.grade_level_id;
        }
      });
      setGradeLevelMapping(mapping);
    }
  }, [sections]);

  // Filter sections based on selected grade_level_id AND selected school_year
  const filteredSections = selectedGradeLevelId === '' || selectedSchoolYear === ''
    ? []
    : sections.filter(sec => 
        sec.grade_level_id === selectedGradeLevelId && 
        sec.school_year_id === selectedSchoolYear
      );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/bulk-enrollment`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setSections(response.data.sections);
        setSchoolYears(response.data.school_years);
        const activeYear = response.data.school_years.find(sy => sy.is_active);
        if (activeYear) {
          setSelectedSchoolYear(activeYear.id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    }
  };

  const handleSchoolYearChange = (schoolYearId) => {
    setSelectedSchoolYear(schoolYearId);
    setSelectedGradeLevel('');
    setSelectedGradeLevelId('');
    setSelectedSection('');
  };

  const handleGradeLevelChange = (numericGradeLevel) => {
    setSelectedGradeLevel(numericGradeLevel);
    const mappedId = gradeLevelMapping[numericGradeLevel];
    setSelectedGradeLevelId(mappedId || '');
    setSelectedSection('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/bulk-enrollment/template`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'enrollment_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      setError('Failed to download template');
    }
  };

  const handleUpload = async () => {
    // Check for file
    if (!file) {
      setError('Please select a file');
      return;
    }
    // Check grade level - important: 0 is valid (Kinder)
    if (selectedGradeLevel === '' || selectedGradeLevel === null) {
      setError('Please select a grade level');
      return;
    }
    if (!selectedSection) {
      setError('Please select a section');
      return;
    }
    if (!selectedSchoolYear) {
      setError('Please select a school year');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('section_id', selectedSection);
    formData.append('school_year_id', selectedSchoolYear);
    
    try {
      const response = await axios.post(`${API_URL}/admin/bulk-enrollment/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.success) {
        setResult(response.data);
        setFile(null);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      // Ipakita ang validation errors mula sa backend
      if (error.response?.status === 422 && error.response?.data?.errors) {
        // Kunin ang unang error message
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0]?.[0] || 'Validation failed';
        setError(firstError);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to upload file');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <Upload size={24} className="text-indigo-600" />
                Bulk Enrollment
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Upload CSV/Excel file to enroll multiple students at once
              </p>
            </div>
            
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30">
              <h2 className="text-base font-semibold text-gray-800">Upload File</h2>
              <p className="text-xs text-gray-500 mt-0.5">Upload CSV or Excel file with student data</p>
            </div>
            
            <div className="p-5">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">School Year *</label>
                  <select
                    value={selectedSchoolYear}
                    onChange={(e) => handleSchoolYearChange(Number(e.target.value))}
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
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Grade Level *</label>
                  <select
                    value={selectedGradeLevel}
                    onChange={(e) => handleGradeLevelChange(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
                    disabled={!selectedSchoolYear}
                  >
                    <option value="">{!selectedSchoolYear ? 'Select school year first' : 'Select Grade Level'}</option>
                    {gradeLevels.map(level => (
                      <option key={level.grade_level} value={level.grade_level}>
                        {level.display}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Section *</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
                    disabled={!selectedGradeLevelId}
                  >
                    <option value="">
                      {!selectedGradeLevelId 
                        ? 'Please select a grade level first' 
                        : filteredSections.length === 0 
                          ? 'No sections available for this grade level and school year' 
                          : 'Select Section'}
                    </option>
                    {filteredSections.map(sec => (
                      <option key={sec.id} value={sec.id}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select>
                  {selectedGradeLevelId && filteredSections.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      No sections found for this grade level in the selected school year.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Drop Zone */}
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                    <Upload size={24} className="text-indigo-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {file ? file.name : 'Drag and drop your file here'}
                  </p>
                  <p className="text-xs text-gray-400 mb-4">or</p>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium">
                      <FileText size={16} />
                      Browse Files
                    </span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-gray-400 mt-3">
                    Supported formats: CSV, XLSX, XLS (Max 5MB)
                  </p>
                </div>
              </div>
              
              {file && (
                <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-indigo-600" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-400">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={downloadTemplate}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  <Download size={16} />
                  Download Template
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || !selectedSection || !selectedSchoolYear || isUploading}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                    !file || !selectedSection || !selectedSchoolYear || isUploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {isUploading ? 'Uploading...' : 'Upload & Enroll'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Instructions Section */}
          <div className="space-y-5">
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30">
                <h2 className="text-base font-semibold text-gray-800">Instructions</h2>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">1. Download Template</h3>
                    <p className="text-xs text-gray-500">Click "Download Template" to get the CSV template file.</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">2. Fill in Student Data</h3>
                    <p className="text-xs text-gray-500">Populate the template with student information.</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">3. Select School Year, Grade Level & Section</h3>
                    <p className="text-xs text-gray-500">Choose the appropriate school year, grade level and section for the students.</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">4. Upload File</h3>
                    <p className="text-xs text-gray-500">Upload the completed file.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <AlertCircle size={16} />
                Important Notes
              </h3>
              <ul className="space-y-2 text-xs text-amber-700">
                <li>• LRN must be exactly 12 digits (used as username)</li>
                <li>• Default password: <strong>password</strong></li>
                <li>• Students should change password after first login</li>
                <li>• Status will be "Active"</li>
                <li>• Invalid rows are skipped and reported</li>
                <li>• Max file size: 5MB</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Results Section */}
        {result && (
          <div className="mt-6 bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30">
              <h2 className="text-base font-semibold text-gray-800">Upload Results</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-indigo-50 rounded-xl">
                  <p className="text-2xl font-bold text-indigo-600">{result.stats.total}</p>
                  <p className="text-xs text-gray-500">Total Records</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{result.stats.success}</p>
                  <p className="text-xs text-gray-500">Successful</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <p className="text-2xl font-bold text-red-600">{result.stats.failed}</p>
                  <p className="text-xs text-gray-500">Failed</p>
                </div>
              </div>
              
              {result.default_password && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="text-blue-600" />
                  <p className="text-sm text-blue-700">
                    Default password: <strong>{result.default_password}</strong>
                  </p>
                </div>
              )}
              
              {result.failed_rows && result.failed_rows.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Failed Rows</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Row</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">LRN</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {result.failed_rows.map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-xs">{row.row}</td>
                            <td className="px-3 py-2 text-xs font-mono">{row.lrn}</td>
                            <td className="px-3 py-2 text-xs text-red-600">{row.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {result.failed_csv_url && (
                    <a 
                      href={result.failed_csv_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <Download size={14} />
                      Download Failed Rows Report
                    </a>
                  )}
                </div>
              )}
              
              {result.stats.success > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <p className="text-sm text-green-700">
                    Successfully enrolled {result.stats.success} student(s)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkEnrollment;