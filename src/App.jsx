import React, { useEffect, useState, createContext, useContext } from "react";
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

// ========================
// Auth Context
// ========================
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [loginStatus, setLoginStatus] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const openLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  const openSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  // 🔥 Listen for API events (open login modal globally)
  useEffect(() => {
    const handleOpenLogin = () => openLogin();
    window.addEventListener("openLoginModal", handleOpenLogin);

    return () => {
      window.removeEventListener("openLoginModal", handleOpenLogin);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loginStatus,
        setLoginStatus,
        openLogin,
        openSignup,
        closeModals,
      }}
    >
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
// Protected Route
// ========================
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// List of pages that don't require authentication
const PUBLIC_PAGES = ["/", "/landing", "/books"];

// ========================
// App Content
// ========================
const AppContent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = window.location.pathname;

  const { openLogin, openSignup } = useAuth();

  const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem("user")),
        token: sessionStorage.getItem("token"),
        role: sessionStorage.getItem("role"),
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

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

  // Handle cart click
  const handleCartClick = () => {
    const { user } = getUserData();
    if (!user) {
      openLogin(); // 🔥 universal login modal
      return;
    }
    navigate("/cart");
  };

  // Handle search functionality
  const handleSearch = (query) => {
    if (query.trim()) {
      navigate(`/books?search=${encodeURIComponent(query.trim())}`);
    }
  };

  // Don't show navbar/footer on payment page
  const shouldShowNavbar = location.pathname !== "/payment";
  const shouldShowFooter = location.pathname !== "/payment";

  return (
    <div className={styles.appContainer}>
      {shouldShowNavbar && (
        <NavBar
          onSignIn={openLogin}
          onSignUp={openSignup}
          onCartClick={handleCartClick}
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/books" element={<BookViewCard />} />          
          <Route path="/categories" element={<CategoriesView />} />

           <Route path="/admin/book/add" element={<AddBookPage />} />
           <Route path="/admin/category/add" element={<AddCategory />} />
             <Route path="/admin/invoice" element={<InvoiceExportPage />} />

          {/* Add more routes as needed */}
        </Routes>
      </main>

      {shouldShowFooter && <Footer />}
    </div>
  );
};

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