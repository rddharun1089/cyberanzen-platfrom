import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, Menu, X, LogIn, UserPlus, LogOut, 
  Settings, Trophy, User, ChevronDown, Calendar, Search
} from 'lucide-react';
import CyberAnzenBrand from './CyberAnzenBrand';

export default function Navbar({ user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const isAdmin = user && (
    ['super_admin', 'event_admin', 'challenge_author', 'admin'].includes(user.role?.toLowerCase())
  );

  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      const elem = document.getElementById(sectionId);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate(`/#${sectionId}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#030A16]/90 backdrop-blur-md border-b border-[#18385E] shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <CyberAnzenBrand to={user ? (isAdmin ? "/admin" : "/events") : "/"} />

        {/* Primary Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-4">
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium font-sans transition-colors ${
              location.pathname === '/' && !location.hash
                ? 'text-[#00CFFF] bg-[#07182B] border border-[#18385E]'
                : 'text-[#A9BCD6] hover:text-[#F2F7FF] hover:bg-[#07182B]'
            }`}
          >
            Home
          </Link>

          <Link
            to="/events"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium font-sans transition-colors flex items-center space-x-1.5 ${
              location.pathname.startsWith('/events')
                ? 'text-[#00CFFF] bg-[#07182B] border border-[#18385E]'
                : 'text-[#A9BCD6] hover:text-[#00CFFF] hover:bg-[#07182B]'
            }`}
          >
            <span>Events</span>
          </Link>

          {!user && (
            <>
              <button
                onClick={() => scrollToSection('about')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium font-sans text-[#A9BCD6] hover:text-[#F2F7FF] hover:bg-[#07182B] transition-colors"
              >
                About
              </button>

              <button
                onClick={() => scrollToSection('creator')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium font-sans text-[#A9BCD6] hover:text-[#F2F7FF] hover:bg-[#07182B] transition-colors"
              >
                Creator
              </button>
            </>
          )}

          {user && isAdmin && (
            <Link
              to="/admin"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium font-sans transition-colors flex items-center space-x-1.5 ${
                location.pathname.startsWith('/admin')
                  ? 'text-[#00CFFF] bg-[#07182B] border border-[#18385E]'
                  : 'text-[#A9BCD6] hover:text-[#00CFFF] hover:bg-[#07182B]'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-[#00CFFF]" />
              <span>Admin Studio</span>
            </Link>
          )}
        </nav>

        {/* User Account / Sign In & Sign Up Controls */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Search Button (Accessible when signed in) */}
          {user && (
            <button
              onClick={() => navigate('/events')}
              className="p-2 rounded-xl bg-[#07182B] border border-[#18385E] text-[#A9BCD6] hover:text-[#00CFFF] hover:border-[#00CFFF]/40 transition-colors"
              title="Search competitions"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-[#07182B] border border-[#18385E] hover:border-[#00CFFF]/50 transition-colors"
              >
                <div className="w-6 h-6 rounded bg-[#087FFF]/20 text-[#00CFFF] flex items-center justify-center font-mono text-xs font-bold border border-[#087FFF]/40">
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-[#F2F7FF]">
                    {user.username}
                  </span>
                  <span className="text-[9px] font-mono text-[#00CFFF]">
                    {user.points || 0} PTS
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#A9BCD6]" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#07182B] border border-[#18385E] shadow-2xl p-2 z-50 font-sans animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-[#18385E] mb-1">
                    <span className="text-[10px] font-mono text-[#00CFFF] uppercase tracking-wider block font-bold">
                      CLEARANCE: {user.role?.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-[#F2F7FF] truncate block">
                      {user.username}
                    </span>
                  </div>

                  <Link
                    to="/events"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-[#A9BCD6] hover:text-[#F2F7FF] hover:bg-[#102746] transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-[#00CFFF]" />
                    <span>Tournament Arenas</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-[#00CFFF] bg-[#087FFF]/20 hover:bg-[#087FFF]/30 border border-[#087FFF]/40 transition-colors my-1 font-mono font-medium"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Admin Control Center</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-950/40 transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold font-mono text-[#F2F7FF] hover:text-[#00CFFF] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 rounded-xl text-xs font-semibold font-mono text-slate-950 bg-[#00CFFF] hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all font-bold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Action Controls */}
        <div className="flex md:hidden items-center space-x-2">
          {user && (
            <button
              onClick={() => navigate('/events')}
              className="p-2 rounded-xl bg-[#07182B] border border-[#18385E] text-[#A9BCD6] hover:text-[#00CFFF]"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[#07182B] border border-[#18385E] text-[#A9BCD6] hover:text-[#F2F7FF]"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#07182B] border-b border-[#18385E] px-4 pt-3 pb-6 space-y-3 font-sans animate-in fade-in slide-in-from-top-2 duration-150">
          {!user && (
            <>
              <Link
                to="/"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-[#F2F7FF] hover:bg-[#102746]"
              >
                Home
              </Link>
              <Link
                to="/events"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-[#00CFFF] hover:bg-[#102746]"
              >
                Events
              </Link>
              <button
                onClick={() => scrollToSection('about')}
                className="w-full text-left block px-3 py-2 rounded-xl text-sm font-medium text-[#A9BCD6] hover:text-[#F2F7FF] hover:bg-[#102746]"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('creator')}
                className="w-full text-left block px-3 py-2 rounded-xl text-sm font-medium text-[#A9BCD6] hover:text-[#F2F7FF] hover:bg-[#102746]"
              >
                Creator
              </button>
            </>
          )}
          {user && (
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-medium text-[#00CFFF] hover:bg-[#102746]"
            >
              Events
            </Link>
          )}

          <div className="pt-4 border-t border-[#18385E] flex flex-col gap-2">
            {user ? (
              <>
                <div className="px-3 py-2 font-mono text-xs text-[#A9BCD6]">
                  Signed in as <span className="text-[#00CFFF] font-bold">{user.username}</span> ({user.role})
                </div>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-mono text-[#00CFFF] bg-[#087FFF]/20 border border-[#087FFF]/40"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Admin Control Center</span>
                  </Link>
                )}
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-950/40"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl text-xs font-mono font-semibold text-[#F2F7FF] bg-[#102746] border border-[#18385E]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl text-xs font-mono font-bold text-slate-950 bg-[#00CFFF]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
