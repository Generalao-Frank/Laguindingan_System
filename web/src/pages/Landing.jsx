import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, BarChart3, Users, Zap, ArrowRight, Search, 
  Lock, LineChart, GraduationCap, Calendar, Award, ChevronRight,
  PlayCircle, CheckCircle, TrendingUp, UserPlus, BookOpen
} from 'lucide-react';
import schoolVideo from '/lesV.mp4';
// Import ang school logo
import schoolLogo from '../assets/les_logo.png';

const Landing = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, teachers: 0, prevented: 0 });
  const statsRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  // Force video to play when component mounts
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Auto-play failed, trying muted:", error);
        videoRef.current.muted = true;
        videoRef.current.play();
      });
    }
  }, []);

  // Animate stats when they come into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const targets = { students: 1248, teachers: 98, prevented: 24 };
            const duration = 2000;
            const stepTime = 20;
            const steps = duration / stepTime;
            
            let step = 0;
            const interval = setInterval(() => {
              step++;
              setStats({
                students: Math.min(targets.students, Math.floor(targets.students * (step / steps))),
                teachers: Math.min(targets.teachers, Math.floor(targets.teachers * (step / steps))),
                prevented: Math.min(targets.prevented, Math.floor(targets.prevented * (step / steps))),
              });
              if (step >= steps) clearInterval(interval);
            }, stepTime);
            
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen font-sans overflow-x-hidden relative">
      
      {/* VIDEO BACKGROUND - Fixed at z-0 (pinakalikod) */}
      <div className="fixed inset-0 z-0">
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
          onError={() => setVideoError(true)}
        >
          <source src={schoolVideo} type="video/mp4" />
        </video>
        
        {/* Gradient overlay para mabasa ang text */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 to-indigo-900/70"></div>
        
        {/* Fallback kung hindi mag-load ang video */}
        {videoError && (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900">
            <div className="flex items-center justify-center h-full">
              <div className="text-white text-center">
                <ShieldCheck size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-white/70">School video background</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- CONTENT WRAPPER - Lahat ng content nasa harap (z-10) --- */}
      <div className="relative z-10">
        
        {/* --- TOP BAR / NAVIGATION with Logo --- */}
        <nav className="fixed top-0 w-full z-20 bg-white/10 backdrop-blur-md border-b border-white/20 px-6 md:px-8 py-3 flex justify-between items-center animate-slideDown">
          <div className="flex items-center gap-3">
            {/* School Logo Image */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <img 
                src={schoolLogo} 
                alt="LES Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white drop-shadow-md">Laguindingan <span className="text-indigo-300">Central School</span></span>
              <p className="text-[10px] text-white/60 -mt-0.5">Learning Information System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-white/90 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-white text-indigo-700 text-[13px] font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-md active:scale-95"
            >
              Admin Access
            </button>
          </div>
        </nav>

        {/* --- HERO SECTION --- */}
        <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex items-center">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-indigo-100 text-[11px] font-bold uppercase tracking-wider mb-6 animate-fadeUp">
              <Zap size={12} fill="currentColor" /> Live • Real‑time Intelligence
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 animate-fadeUp animation-delay-200 drop-shadow-xl">
              The future of <span className="text-indigo-300">Student</span> <br /> 
              <span className="italic font-serif font-light text-indigo-200">Monitoring</span> starts now.
            </h1>
            
            <p className="text-lg text-white/80 font-medium max-w-2xl mx-auto leading-relaxed mb-10 animate-fadeUp animation-delay-400 backdrop-blur-sm bg-black/20 rounded-xl p-4">
              A live, data‑driven early warning system for Laguindingan Elementary School. 
              Prevent dropouts, track performance, and manage records in real‑time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-fadeUp animation-delay-600">
              <button 
                onClick={() => navigate('/login')}
                className="group px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-2xl hover:bg-indigo-500 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-lg"
              >
                Launch Live Portal <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
                <PlayCircle size={20} /> Watch demo
              </button>
            </div>

            {/* Live indicator badge */}
            <div className="mt-12 flex items-center justify-center gap-2 text-white/70 text-sm animate-pulse">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
             
              <span>Live system active • 24/7 monitoring</span>
            </div>
          </div>
        </section>

        {/* --- FEATURE GRID (glass cards) --- */}
        <section className="px-6 py-24 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-md">Intelligent tools for modern education</h2>
            <p className="text-white/70 text-lg mt-3 max-w-2xl mx-auto">Everything you need to manage, monitor, and elevate student success – live.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, title: "Early Warning System", description: "Live dropout prediction based on real-time grades & attendance." },
              { icon: Search, title: "LRN Instant Search", description: "Retrieve complete student records using the 12-digit LRN in seconds." },
              { icon: Lock, title: "Role‑Based Access", description: "Secure portals for Admins, Teachers, and Parents with live updates." },
              { icon: LineChart, title: "Performance Analytics", description: "Live dashboards for academic trends and intervention tracking." }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all hover:-translate-y-2 group animate-scaleIn"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-indigo-500/30 text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- LIVE DEMO CARD (Interactive) --- */}
        <section className="px-6 py-10 max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-r from-indigo-600/90 to-indigo-800/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="flex flex-col md:flex-row items-center justify-between p-10 gap-8 relative">
              <div className="text-white max-w-lg">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-5">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-3">Live dropout risk alerts</h3>
                <p className="text-indigo-100 mb-6">The system automatically flags students with declining performance in real‑time, so you can intervene immediately.</p>
                <div className="flex gap-4">
                  <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                    See live demo <ChevronRight size={16} />
                  </button>
                  <button className="flex items-center gap-2 text-white/80 hover:text-white">
                    <PlayCircle size={16} /> Watch video
                  </button>
                </div>
              </div>
              <div className="w-full md:w-80 bg-black/30 backdrop-blur rounded-2xl p-5 border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-white">Live At‑Risk Students</span>
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">24 right now</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-indigo-100"><span>Maria Santos</span><span>Grade 3 - 68%</span></div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full"><div className="w-2/3 h-full bg-red-400 rounded-full"></div></div>
                  <div className="flex justify-between text-xs text-indigo-100"><span>John Cruz</span><span>Grade 5 - 71%</span></div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full"><div className="w-1/2 h-full bg-yellow-400 rounded-full"></div></div>
                  <div className="flex justify-between text-xs text-indigo-100"><span>Anna Reyes</span><span>Grade 2 - 74%</span></div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full"><div className="w-2/3 h-full bg-yellow-400 rounded-full"></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- STATS SECTION (live counters) --- */}
        <section ref={statsRef} className="px-6 py-24 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 animate-scaleIn">
              <Users size={40} className="text-indigo-300 mx-auto mb-4" />
              <div className="text-5xl font-black text-white">{stats.students.toLocaleString()}</div>
              <div className="text-white/70 text-sm mt-2">Active Students</div>
              <div className="text-green-400 text-xs mt-3 flex items-center justify-center gap-1"><TrendingUp size={12} /> +12% from last year</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 animate-scaleIn animation-delay-200">
              <Award size={40} className="text-indigo-300 mx-auto mb-4" />
              <div className="text-5xl font-black text-white">{stats.teachers}</div>
              <div className="text-white/70 text-sm mt-2">Qualified Teachers</div>
              <div className="text-green-400 text-xs mt-3 flex items-center justify-center gap-1"><UserPlus size={12} /> +8 new this year</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 animate-scaleIn animation-delay-400">
              <CheckCircle size={40} className="text-indigo-300 mx-auto mb-4" />
              <div className="text-5xl font-black text-white">{stats.prevented}</div>
              <div className="text-white/70 text-sm mt-2">Dropouts Prevented</div>
              <div className="text-emerald-400 text-xs mt-3 flex items-center justify-center gap-1">Intervention success rate: 89%</div>
            </div>
          </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="px-6 py-16 max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-md rounded-3xl p-12 text-center border border-white/20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to go live?</h2>
            <p className="text-white/80 text-lg mb-8">Join Laguindingan Central School's digital transformation today.</p>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all inline-flex items-center gap-2 text-lg shadow-xl"
            >
              Launch Portal <ArrowRight size={20} />
            </button>
            <p className="text-white/50 text-sm mt-6">No credit card required • Free for public schools</p>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="bg-black/30 backdrop-blur-md text-white border-t border-white/20">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <img src={schoolLogo} alt="LES Logo" className="w-5 h-5 object-cover rounded" />
                <span className="text-sm font-medium">Laguindingan Central School 2026 — Live MIS Department</span>
              </div>
              <div className="flex gap-6 text-sm text-white/60">
                <a href="#" className="hover:text-white transition">About</a>
                <a href="#" className="hover:text-white transition">Privacy</a>
                <a href="#" className="hover:text-white transition">Contact</a>
              </div>
              <p className="text-sm text-white/50">© Laguindingan Central School. All rights reserved.</p>
            </div>
          </div>
        </footer>

      </div> {/* End of Content Wrapper */}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-100px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeUp { animation: fadeUp 0.8s ease-out forwards; opacity: 0; }
        .animate-slideDown { animation: slideDown 0.6s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.5s ease-out forwards; opacity: 0; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-400 { animation-delay: 400ms; }
        .animation-delay-600 { animation-delay: 600ms; }
      `}</style>
    </div>
  );
};

export default Landing;