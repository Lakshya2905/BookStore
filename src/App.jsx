import React, { useEffect, useState, createContext, useContext, useMemo, useCallback } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import styles from "./App.module.css";
import NavBar from "./components/User/NavBar";
import LandingPage from "./components/Landing/LandingPage";
import LoginModal from "./components/Landing/LoginModal";
import SignupModal from "./components/Landing/SignupModal";
import BookViewCard from "./components/Books/BookViewCard";
import Footer from "./components/User/Footer";
import CategoriesView from "./components/Books/CategoriesView";
import AddBookPage from "./components/Admin/AddBookPage";
import AddCategory from "./components/Admin/AddCategory";
import InvoiceExportPage from "./components/Admin/InvoiceExportPage";
import WhatsAppFloatingButton from "./components/User/WhatsAppFloatingButton";
import PriorityUpdate from "./components/Books/PriorityUpdate";
import BookUpdate from "./components/Books/BookUpdate";
import AddDiscoveryImage from "./components/Admin/AddDiscoveryImage";
import DiscoveryImageEditPanel from "./components/Admin/DiscoveryImageEditPanel";

// ========================
// Auth Context
// ========================
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [loginStatus, setLoginStatus] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const openLogin = useCallback(() => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  }, []);

  const openSignup = useCallback(() => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  }, []);

  const closeModals = useCallback(() => {
    setShowLoginModal(false);
    setShowSignupModal(false);
  }, []);

  // 🔥 Listen for API events (open login modal globally)
  useEffect(() => {
    const handleOpenLogin = () => openLogin();
    window.addEventListener("openLoginModal", handleOpenLogin);

    return () => {
      window.removeEventListener("openLoginModal", handleOpenLogin);
    };
  }, [openLogin]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    loginStatus,
    setLoginStatus,
    openLogin,
    openSignup,
    closeModals,
  }), [loginStatus, openLogin, openSignup, closeModals]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}

      {/* 🔥 Universal Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={closeModals}
        onSwitchToSignup={openSignup}
        setLoginStatus={setLoginStatus}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={closeModals}
        onSwitchToLogin={openLogin}
      />
    </AuthContext.Provider>
  );
};

// ========================
// Protected Route (Basic Authentication)
// ========================
const ProtectedRoute = React.memo(({ children }) => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
});

// ========================
// Admin Protected Route (Role-based Authentication)
// ========================
const AdminProtectedRoute = React.memo(({ children }) => {
  const token = sessionStorage.getItem("token");
  const userString = sessionStorage.getItem("user");
  
  // Check if user is logged in
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Check if user data exists and parse it
  let user = null;
  try {
    user = userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return <Navigate to="/" replace />;
  }

  // Check if user has OWNER role
  if (!user || user.userRole !== 'OWNER') {
    return <Navigate to="/" replace />;
  }

  return children;
});

// List of pages that don't require authentication - moved outside component
const PUBLIC_PAGES = ["/", "/landing", "/books"];

// ========================
// App Content
// ========================
const AppContent = React.memo(() => {
  const [searchQuery, setSearchQuery] = useState("");
  const [bookViewKey, setBookViewKey] = useState(0); // Key to force BookViewCard re-mount
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);

  const { openLogin, openSignup } = useAuth();

  // Force BookViewCard re-render when URL params change
  useEffect(() => {
    if (currentPath === '/books') {
      setBookViewKey(prev => prev + 1);
      console.log('BookView re-mount triggered by URL change:', location.pathname + location.search);
    }
  }, [location.pathname, location.search, currentPath]);

  // Memoize getUserData function to prevent recreation
  const getUserData = useCallback(() => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem("user") || 'null'),
        token: sessionStorage.getItem("token"),
        role: sessionStorage.getItem("role"),
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  }, []);

  // Check token on initial load, but allow access to public pages
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const isPublicPage =
      PUBLIC_PAGES.includes(currentPath) ||
      PUBLIC_PAGES.some((page) => currentPath.startsWith(page));

    if (!token && !isPublicPage) {
      navigate("/");
    }
  }, [navigate, currentPath]);

  // Handle cart click - memoized
  const handleCartClick = useCallback(() => {
    const { user } = getUserData();
    if (!user) {
      openLogin(); // 🔥 universal login modal
      return;
    }
    navigate("/cart");
  }, [getUserData, openLogin, navigate]);

  // Handle search functionality - memoized
  const handleSearch = useCallback((query) => {
    if (query.trim()) {
      navigate(`/books?search=${encodeURIComponent(query.trim())}`);
    }
  }, [navigate]);

  // Enhanced navigation handler for NavBar
  const handleNavigation = useCallback((path) => {
    console.log('Navigation requested to:', path);
    
    // Clear search query if navigating to a different filter
    if (path !== `/books?search=${encodeURIComponent(searchQuery)}`) {
      setSearchQuery("");
    }
    
    // Navigate and force BookView update
    navigate(path);
    
    // Force immediate re-render for book page
    if (path.startsWith('/books')) {
      setTimeout(() => {
        setBookViewKey(prev => prev + 1);
      }, 50);
    }
  }, [navigate, searchQuery]);

  // Memoize display flags to prevent recalculation
  const displayFlags = useMemo(() => {
    const shouldShowNavbar = currentPath !== "/payment";
    const shouldShowFooter = currentPath !== "/payment";
    const shouldShowWhatsApp = currentPath !== "/payment" && !currentPath.startsWith("/admin");
    
    return { shouldShowNavbar, shouldShowFooter, shouldShowWhatsApp };
  }, [currentPath]);

  // Static WhatsApp configuration
  const whatsappConfig = useMemo(() => ({
    whatsappLink: "https://wa.link/wac1at",
    phoneNumber: "", 
    message: "Hello! I'm interested in your books and services.",
    showTooltip: true,
    position: "bottom-right"
  }), []);

  return (
    <div className={styles.appContainer}>
      {displayFlags.shouldShowNavbar && (
        <NavBar
          onSignIn={openLogin}
          onSignUp={openSignup}
          onCartClick={handleCartClick}
          onSearch={handleSearch}
          onNavigation={handleNavigation} // Pass navigation handler to NavBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route 
            path="/books" 
            element={
              <BookViewCard 
                key={bookViewKey} // Force re-mount when this changes
                showPagination={true}
              />
            } 
          />          
          <Route path="/categories" element={<CategoriesView />} />

          {/* Protected Admin Routes - Only accessible by users with OWNER role */}
          <Route 
            path="/admin/book/add" 
            element={
              <AdminProtectedRoute>
                <AddBookPage />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/category/add" 
            element={
              <AdminProtectedRoute>
                <AddCategory />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/invoice" 
            element={
              <AdminProtectedRoute>
                <InvoiceExportPage />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/proprity/update" 
            element={
              <AdminProtectedRoute>
                <PriorityUpdate />
              </AdminProtectedRoute>
            } 
          />

            <Route 
            path="/admin/add/discoveryImage" 
            element={
              <AdminProtectedRoute>
                <AddDiscoveryImage />
              </AdminProtectedRoute>
            } 
          />

                 <Route 
            path="/admin/edit/discoveryImage" 
            element={
              <AdminProtectedRoute>
                <DiscoveryImageEditPanel />
              </AdminProtectedRoute>
            } 
          />
          

          <Route 
            path="/admin/book/priority/update" 
            element={
              <AdminProtectedRoute>
                <PriorityUpdate />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/book/update" 
            element={
              <AdminProtectedRoute>
                <BookUpdate />
              </AdminProtectedRoute>
            } 
          />
          
          {/* Add more routes as needed */}
        </Routes>
      </main>

      {displayFlags.shouldShowFooter && <Footer />}
      
      {/* WhatsApp Floating Button */}
      {displayFlags.shouldShowWhatsApp && (
        <WhatsAppFloatingButton {...whatsappConfig} />
      )}
    </div>
  );
});

AppContent.displayName = 'AppContent';

// ========================
// Main App Export
// ========================
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;