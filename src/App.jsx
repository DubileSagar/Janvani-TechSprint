import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Form from './form'
import './App.css'
import SignupForm from './components/SignupForm'
import Home from './components/Home'
import About from './components/About'
import Report from './components/Report'
import Chatbot from './components/Chatbot'
import Issues from './components/Issues'
import Profile from './components/Profile'
import IssueDetails from './components/IssueDetails'
import Wallet from './components/Wallet'
import RedeemPoints from './components/RedeemPoints'
import Certificate from './components/Certificate';
import ChatWidget from './components/ChatWidget';
import { authService } from './api/auth'
import logo from './assets/janvani-logo-v5.svg'
import { account } from './appwrite'
import { supabase } from './supabase';
import { dbService } from './api/db';
import VPNBlocker from './components/VPNBlocker';

import { useLanguage } from './context/LanguageContext';

function App() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockDetails, setBlockDetails] = useState(null);
  const [debugIp, setDebugIp] = useState('');
  const navigate = useNavigate();
  const location = useLocation();


  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        handleNoSession();
      }
      setIsLoading(false);
    });


    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        handleNoSession();
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);


  useEffect(() => {
    const checkAccess = async () => {
      try {



        const API_URL = import.meta.env.VITE_API_BASE_URL || '';


        let publicIp = '';
        try {
          const ipResponse = await fetch(`${API_URL}/api/get-ip`, {
            signal: AbortSignal.timeout(5000)
          });
          const ipData = await ipResponse.json();
          if (ipData.success && ipData.ip) {
            publicIp = ipData.ip;
            console.log(`⚡ IP detected: ${publicIp}${ipData.fallback ? ' (fallback)' : ''}`);
            setDebugIp(publicIp);
          }
        } catch (error) {
          console.warn("Failed to get IP from backend", error);
        }

        if (!publicIp) {
          console.error("IP detection failed, defaulting to server detection.");
        }







        const response = await fetch(`${API_URL}/api/check-access?ip=${publicIp || ''}`);

        if (response.status === 403) {
          const data = await response.json();
          setBlockDetails(data.details);
          setIsBlocked(true);
        }
      } catch (e) {
        console.error("Failed to check access:", e);
      }
    };


    if (!isBlocked) {
      checkAccess();
    }
  }, [location]);


  const handleUserSession = (user) => {
    // For Email Auth, phone might not be in user.phone, so check metadata
    const phone = user.phone || user.user_metadata?.phone;

    const userData = {
      $id: user.id,
      name: user.user_metadata?.display_name || 'Citizen',
      phone: phone,
      email: user.email,
      state: user.user_metadata?.state,
      district: user.user_metadata?.district,
      age: user.user_metadata?.age,
      gender: user.user_metadata?.gender
    };
    setCurrentUser(userData);
    setIsAuthenticated(true);

    localStorage.setItem('cc_user', JSON.stringify(userData));
    if (userData.phone) {
      localStorage.setItem('cc_user_phone', userData.phone);
      sessionStorage.setItem('cc_user_phone', userData.phone);

      // Sync user to DB
      // We pass the composite user object which has the correct phone now
      dbService.syncUser({ ...user, phone: phone }).then(() => console.log("User synced to DB"));
    }

    // Redirect logic
    if (window.location.pathname === '/' || window.location.pathname === '/signup') {
      navigate('/home', { replace: true });
    }
  };

  const handleNoSession = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('cc_user_phone');
      localStorage.removeItem('cc_user_phone');
    } catch (_) { }

    // Protected routes
    const protectedPaths = ['/report', '/issues', '/profile', '/wallet', '/redeem'];
    const isOnProtected = protectedPaths.includes(window.location.pathname);
    if (isOnProtected) {
      navigate('/', { replace: true });
    }
  };

  const handleSendOtp = async ({ email }) => {
    // Send OTP to Email
    setError('')
    try {
      await authService.sendOtp({ email })
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      // setLoading(false)
    }
  }

  const handleLogin = async ({ email, otp, phone }) => {
    // Login with Email OTP
    setError('')

    try {
      const response = await authService.login({ email, otp })
      if (response.success) {
        setIsAuthenticated(true)

        // Try to persist phone if we have it from params or user object
        const userPhone = response.user.phone || response.user.user_metadata?.phone || phone;
        try {
          if (userPhone) {
            sessionStorage.setItem('cc_user_phone', userPhone)
            localStorage.setItem('cc_user_phone', userPhone)
          }
        } catch (_) { }
        navigate('/home', { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      // setLoading(false)
    }
  }

  const handleLoginWithGoogle = async () => {
    // ... existing google login ...
    setIsLoading(true)
    setError('')
    try {
      await authService.loginWithGoogle()
      // Redirect handled by Supabase OAuth flow
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  const handleLoginWithApple = async () => {
    setIsLoading(true)
    setError('')
    try {
      await authService.loginWithApple()
      // Redirect handled by Supabase OAuth flow
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  const handleSignup = async ({ name, phone, email, otp }) => {
    // Signup with Email OTP
    setError('')

    try {
      const response = await authService.signup({ name, phone, email, otp })
      if (response.success) {
        setIsAuthenticated(true)

        try {
          sessionStorage.setItem('cc_user_phone', response.user.phone || '')
          localStorage.setItem('cc_user_phone', response.user.phone || '')
        } catch (_) { }

        // Navigate to profile to complete details
        navigate('/profile', { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      // setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      setIsAuthenticated(false)


      setError('')
      try {
        sessionStorage.removeItem('cc_user_phone')
        localStorage.removeItem('cc_user_phone')
      } catch (_) { }
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const PrivateRoute = ({ children }) => {
    if (isLoading) return <div>Loading...</div>;
    return isAuthenticated ? children : <Navigate to="/" replace />
  }

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="page">
      { }
      {isBlocked && <VPNBlocker details={blockDetails} onRetry={() => window.location.reload()} />}

      <nav className="main-nav">
        <div className="nav-container">
          <NavLink to="/home" className="nav-brand" onClick={closeMenu}>
            <img src={logo} alt="Emblem" className="nav-logo-img" />
            <div className="nav-brand-text">
              <span className="nav-brand-title">जनvani</span>
              <span className="nav-brand-subtitle">{t('gov_title_jh')}</span>
            </div>
          </NavLink>

          { }
          {isAuthenticated && (
            <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle navigation">
              {isMenuOpen ? '✕' : '☰'}
            </button>
          )}

          <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
            <NavLink to="/home" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>{t('nav_home')}</NavLink>
            <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>{t('nav_about')}</NavLink>
            <NavLink to="/chatbot" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>{t('nav_jansathi')}</NavLink>

            {isAuthenticated && (
              <>
                <NavLink to="/report" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>{t('nav_report')}</NavLink>
                <NavLink to="/issues" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>{t('nav_issues')}</NavLink>
                <NavLink to="/wallet" className={({ isActive }) => `nav-link wallet-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>JanWallet</NavLink>
                <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>{t('nav_profile')}</NavLink>
              </>
            )}
            {isAuthenticated ? (
              <div className="user-actions">
                <button onClick={() => { handleLogout(); closeMenu(); }} className="logout-btn">{t('nav_logout')}</button>
              </div>
            ) : (
              <div className="user-actions">
                <NavLink to="/" className="login-btn" onClick={closeMenu}>{t('nav_login')}</NavLink>
              </div>
            )}
          </div>
        </div>
      </nav>
      <div className="page-content">
        <Routes>
          { }
          <Route path="/" element={<Form onLogin={handleLogin} onSendOtp={handleSendOtp} isLoading={isLoading} error={error} onLoginWithGoogle={handleLoginWithGoogle} onLoginWithApple={handleLoginWithApple} />} />
          <Route path="/signup" element={<SignupForm onSignup={handleSignup} onSendOtp={handleSendOtp} isLoading={isLoading} error={error} onLoginWithGoogle={handleLoginWithGoogle} onLoginWithApple={handleLoginWithApple} />} />

          { }
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/report" element={<PrivateRoute><Report currentUser={currentUser} /></PrivateRoute>} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/issues" element={<PrivateRoute><Issues /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile currentUser={currentUser} /></PrivateRoute>} />
          <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
          <Route path="/redeem" element={<PrivateRoute><RedeemPoints /></PrivateRoute>} />
          <Route path="/certificate" element={<PrivateRoute><Certificate /></PrivateRoute>} /> { }
          <Route path="/issue/:id" element={<PrivateRoute><IssueDetails /></PrivateRoute>} />

          { }
          <Route path="*" element={<Navigate to={isAuthenticated ? '/home' : '/'} replace />} />
        </Routes>
      </div>


      {isAuthenticated && <ChatWidget />} { }
    </div >
  )
}

export default App
