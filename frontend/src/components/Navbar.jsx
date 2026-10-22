import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, Menu, X, LogIn, UserPlus, LogOut, 
  Settings, Trophy, User, ChevronDown, Calendar
} from 'lucide-react';

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
    <header className="sticky top-0 z-50 bg-[#030B12]/90 backdrop-blur-md border-b border-[#123746] shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#071B28] border border-[#123746] flex items-center justify-center group-hover:border-[#00E5F0] group-hover:shadow-[0_0_20px_rgba(0,229,240,0.3)] transition-all duration-300 overflow-hidden p-1">
            <img 
              src="/logo.png" 
              alt="CyberAnzen Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            <Shield className="w-6 h-6 text-[#00E5F0] hidden" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold tracking-wider text-lg text-[#F2FAFF] font-mono">
                CYBER<span className="text-[#00E5F0]">ANZEN</span>
              </span>
            </div>
            <span className="text-[9px] text-[#9BB3C2] font-mono tracking-widest uppercase">
              Secure · Learn · Compete
            </span>
          </div>
        </Link>

        {/* Primary Desktop Navigation: Exactly Home, About, Creator (+ Events for active cadets) */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium font-sans transition-colors ${
              location.pathname === '/' && !location.hash
                ? 'text-[#00E5F0] bg-[#071B28] border border-[#123746]'
                : 'text-[#9BB3C2] hover:text-[#F2FAFF] hover:bg-[#061521]'
            }`}
          >
            Home
          </Link>

          <button
            onClick={() => scrollToSection('about')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium font-sans text-[#9BB3C2] hover:text-[#F2FAFF] hover:bg-[#061521] transition-colors"
          >
            About
          </button>

          <button
            onClick={() => scrollToSection('creator')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium font-sans text-[#9BB3C2] hover:text-[#F2FAFF] hover:bg-[#061521] transition-colors"
          >
            Creator
          </button>

          {/* Events link is accessible to discover tournaments */}
          <Link
            to="/events"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium font-sans transition-colors flex items-center space-x-1.5 ${
              location.pathname.startsWith('/events')
                ? 'text-[#00E5F0] bg-[#071B28] border border-[#123746]'
                : 'text-[#9BB3C2] hover:text-[#00E5F0] hover:bg-[#061521]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#00E5F0]" />
            <span>Events</span>
          </Link>
        </nav>

        {/* User Account / Sign In & Sign Up Controls */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-[#071B28] border border-[#123746] hover:border-[#00E5F0]/50 transition-colors"
              >
                <div className="w-6 h-6 rounded bg-[#00E5F0]/20 text-[#00E5F0] flex items-center justify-center font-mono text-xs font-bold">
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-[#F2FAFF]">
                    {user.username}
                  </span>
                  <span className="text-[9px] font-mono text-[#00E5F0]">
                    {user.points || 0} PTS
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#9BB3C2]" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#071B28] border border-[#123746] shadow-2xl p-2 z-50 font-sans animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-[#123746] mb-1">
                    <span className="text-[10px] font-mono text-[#00E5F0] uppercase tracking-wider block font-bold">
                      CLEARANCE: {user.role?.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-[#F2FAFF] truncate block">
                      {user.username}
                    </span>
                  </div>

                  <Link
                    to="/events"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-[#9BB3C2] hover:text-[#F2FAFF] hover:bg-[#061521] transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-[#00E5F0]" />
                    <span>Tournament Arenas</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-[#00E5F0] bg-[#00E5F0]/10 hover:bg-[#00E5F0]/20 border border-[#00E5F0]/30 transition-colors my-1 font-mono font-medium"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Admin Control Center</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-[#FF5263] hover:bg-[#FF5263]/10 transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold font-mono text-[#F2FAFF] bg-[#071B28] hover:bg-[#061521] border border-[#123746] hover:border-[#00E5F0]/40 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-xs font-semibold font-mono text-[#030B12] bg-[#00E5F0] hover:bg-[#00BFCB] shadow-[0_0_15px_rgba(0,229,240,0.4)] transition-all font-bold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[#071B28] border border-[#123746] text-[#9BB3C2] hover:text-[#F2FAFF]"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#071B28] border-b border-[#123746] px-4 pt-3 pb-6 space-y-3 font-sans">
          <Link
            to="/"
            onClick={() => {
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-[#F2FAFF] hover:bg-[#061521]"
          >
            Home
          </Link>
          <button
            onClick={() => scrollToSection('about')}
            className="w-full text-left block px-3 py-2 rounded-xl text-sm font-medium text-[#9BB3C2] hover:text-[#F2FAFF] hover:bg-[#061521]"
          >
            About
          </button>
          <button
            onClick={() => scrollToSection('creator')}
            className="w-full text-left block px-3 py-2 rounded-xl text-sm font-medium text-[#9BB3C2] hover:text-[#F2FAFF] hover:bg-[#061521]"
          >
            Creator
          </button>
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-medium text-[#00E5F0] hover:bg-[#061521]"
          >
            Events
          </Link>

          <div className="pt-4 border-t border-[#123746] flex flex-col gap-2">
            {user ? (
              <>
                <div className="px-3 py-2 font-mono text-xs text-[#9BB3C2]">
                  Signed in as <span className="text-[#00E5F0] font-bold">{user.username}</span> ({user.role})
                </div>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-mono text-[#00E5F0] bg-[#00E5F0]/10 border border-[#00E5F0]/30"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Admin Control Center</span>
                  </Link>
                )}
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-[#FF5263] hover:bg-[#FF5263]/10"
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
                  className="py-2.5 text-center rounded-xl text-xs font-mono font-semibold text-[#F2FAFF] bg-[#061521] border border-[#123746]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl text-xs font-mono font-bold text-[#030B12] bg-[#00E5F0]"
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
