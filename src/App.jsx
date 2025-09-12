import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Menu, X } from "lucide-react";
import styles from "./App.module.css";
import NavBar from "./components/User/NavBar";
import LandingPage from "./components/Landing/LandingPage";
import LoginModal from "./components/Landing/LoginModal";
import SignupModal from "./components/Landing/SignupModal";
import BookViewCard from "./components/Books/BookViewCard";
import Promotion from "./assets/Promotion";
import Discovery from "./components/Landing/Discovery";
import Footer from "./components/User/Footer";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// List of pages that don't require authentication
const PUBLIC_PAGES = ["/", "/landing", "/books"];

const App = () => {
  return <AppContent />;
};

const AppContent = () => {
  const [loginStatus, setLoginStatus] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = window.location.pathname;

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

  // Check token on initial load, but allow access to login and register pages
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    // Only redirect to login if not on a public page AND no token
    const isPublicPage =
      PUBLIC_PAGES.includes(currentPath) ||
      PUBLIC_PAGES.some((page) => currentPath.startsWith(page));

    if (!token && !isPublicPage) {
      navigate("/");
    }
  }, [navigate, currentPath]);

  useEffect(() => {
    const hasToken = !!sessionStorage.getItem("token");
    setLoginStatus(hasToken);
  }, []);

  // Handle sign in modal
  const handleSignIn = () => {
    setShowLoginModal(true);
  };

  // Handle sign up modal
  const handleSignUp = () => {
    setShowSignupModal(true);
  };

  // Handle cart click
  const handleCartClick = () => {
    const { user } = getUserData();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    navigate("/cart");
  };

  // Handle search functionality
  const handleSearch = (query) => {
    if (query.trim()) {
      // Navigate to books page with search query
      navigate(`/books?search=${encodeURIComponent(query.trim())}`);
    }
  };

  // Handle switching between modals
  const handleSwitchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  // Close all modals
  const closeModals = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  // Don't show navbar on promotion page
  const shouldShowNavbar = location.pathname !== '/payment';
const  shouldShowFooter = location.pathname !== '/payment';


  return (
    <div className={styles.appContainer}>
      {shouldShowNavbar && (
        <NavBar
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
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
          <Route 
            path="/books" 
            element={
                <BookViewCard />
             } 
          />


          {/* Add more routes as needed */}
        </Routes>
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={closeModals}
        onSwitchToSignup={handleSwitchToSignup}
        setLoginStatus={setLoginStatus}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={closeModals}
        onSwitchToLogin={handleSwitchToLogin}
      />


    {shouldShowFooter && (
        <Footer />
      )}

    </div>
  );
};

export default App;