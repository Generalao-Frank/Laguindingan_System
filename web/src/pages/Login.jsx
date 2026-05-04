import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, Info, Eye, EyeOff } from 'lucide-react';
import schoolLogo from '../assets/les_logo.png';
import API_URL from '../config';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);



  // Force video to play
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Auto-play failed:", error);
        videoRef.current.muted = true;
        videoRef.current.play();
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          username: username,
          password: password,
           device_type: 'web' 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store user data in localStorage
          localStorage.setItem('userToken', data.token);
    localStorage.setItem('userRole', data.user.role);
    localStorage.setItem('userData', JSON.stringify(data.user));
    localStorage.setItem('userProfilePicture', data.user.profile_picture_url || '');
        
        // Trigger the app to update
        onLogin(data.user.role);
      } else {
        setError(data.message || 'Invalid username or password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Cannot connect to server. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans overflow-x-hidden relative">
      
      {/* VIDEO BACKGROUND */}
      <div className="fixed inset-0 z-0">
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/lesV.mp4" type="video/mp4" />
        </video>
        
        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 to-indigo-900/70"></div>
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        
        <div className="w-full max-w-[440px]">
          
          {/* Branding Section with Logo */}
          <div className="text-center mb-8 group">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-xl group-hover:-translate-y-1 transition-transform duration-500">
                <img 
                  src={schoolLogo} 
                  alt="LES Logo" 
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-md">Welcome Back</h1>
            <p className="text-indigo-200 font-medium uppercase text-[10px] tracking-[0.3em] mt-2">
              Laguindingan Central School
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-400/50 rounded-xl">
                  <p className="text-red-200 text-xs font-medium text-center">{error}</p>
                </div>
              )}
              
              {/* Username Field - Changed from Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider ml-1">
                  Username (LRN or Employee ID)
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-white transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter your LRN (Student) or Employee ID (Teacher/Admin)"
                    className="w-full pl-11 pr-4 py-3 bg-white/20 border border-white/20 rounded-xl focus:bg-white/30 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all font-medium text-white placeholder:text-white/50"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">
                    Password
                  </label>
                  <button type="button" className="text-[10px] font-medium text-indigo-300 hover:text-white transition-colors">
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-white transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-11 py-3 bg-white/20 border border-white/20 rounded-xl focus:bg-white/30 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all font-medium text-white placeholder:text-white/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In to Dashboard
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Hint Box - Updated credentials based on migration */}
            <div className="mt-6 p-3 bg-indigo-500/20 backdrop-blur-sm border border-indigo-400/30 rounded-xl">
              <div className="flex items-start gap-2 mb-2">
                <Info size={14} className="text-indigo-300 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] font-bold text-white">Demo Credentials:</p>
              </div>
              <div className="space-y-1.5 text-[10px] font-medium text-indigo-200">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={10} className="text-indigo-300" />
                    <span>Admin:</span>
                  </span>
                  <code className="bg-indigo-500/30 px-1.5 py-0.5 rounded text-white">admin / admin123</code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <User size={10} className="text-indigo-300" />
                    <span>Teacher:</span>
                  </span>
                  <code className="bg-indigo-500/30 px-1.5 py-0.5 rounded text-white">TCH-2024-001 / password123</code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <User size={10} className="text-indigo-300" />
                    <span>Student:</span>
                  </span>
                  <code className="bg-indigo-500/30 px-1.5 py-0.5 rounded text-white">123456789012 / 2015-05-15</code>
                </div>
              </div>
              <p className="text-[8px] text-indigo-300/60 mt-2 text-center">
                Make sure your Laravel backend is running on port 8000
              </p>
            </div>
          </div>

          {/* Footer info */}
          <div className="text-center mt-8 space-y-3">
            <div className="flex justify-center gap-6">
              <button className="text-[10px] font-medium text-indigo-200/70 hover:text-white transition-colors uppercase tracking-wider">
                Privacy Policy
              </button>
              <button className="text-[10px] font-medium text-indigo-200/70 hover:text-white transition-colors uppercase tracking-wider">
                Help Desk
              </button>
            </div>
            <p className="text-indigo-200/50 text-[9px] font-medium leading-relaxed">
              This system is for authorized Laguindingan ES personnel only.<br />
              All activities are logged and monitored for security.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-indigo-300/40 text-[8px]">
              <ShieldCheck size={10} />
              <span>LES Portal 2026 — Role-Based Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;