import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from "react-router-dom";
import styles from "./App.module.css";
import LandingPage from "./components/Landing/LandingPage";
import Dashboard from "./components/user/UserDashboard";
import LoginModal from "./components/Landing/LoginModal";
import SignupModal from "./components/Landing/SignupModal";
import Promotion from "./assets/Promotion";
import Logo from "./assets/logo.png";
import NameTag from "./assets/nameTag.png";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// List of pages that don't require authentication
const PUBLIC_PAGES = [ "/"];

const App = () => {
  return <AppContent />;
};

const AppContent = () => {
  const [loginStatus, setLoginStatus] = useState(false);
  const navigate = useNavigate();
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
      navigate("/login");
    }
  }, [navigate, currentPath]);

  useEffect(() => {
    const validateToken = async () => {
      const token = sessionStorage.getItem("token");
      const userStr = sessionStorage.getItem("user");

      if (!loginStatus) {
        return;
      }

      if (token && userStr) {
        try {
          const { user, token } = getUserData();
          console.log("Validating token...");

          const response = await axios.get(
            // `${API_BASE_URL}/user/validate_token`,
            {
              params: {
                emailId: user.emailId,
                token: token,
              },
            }
          );

          if (response.data.response === "unauthorized") {
            console.log("Token validation failed: 401 Unauthorized");
            sessionStorage.clear();
            setLoginStatus(false);
            navigate("/login");
          }
        } catch (error) {
          console.error("Error validating token:", error);
          sessionStorage.clear();
          setLoginStatus(false);
          navigate("/");
        }
      }
    };

    if (loginStatus) {
      const interval = setInterval(validateToken, 6000);
      return () => clearInterval(interval);
    }
  }, [loginStatus]);

  useEffect(() => {
    if (!loginStatus) {
      return;
    }

    const handleStorageChange = () => {
      const hasToken = !!sessionStorage.getItem("token");
      setLoginStatus(hasToken);

      if (!hasToken) {
        navigate("/");
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate, currentPath]);

  return (
    <div className={styles.appContainer}>
      <NavbarWithRouter setLoginStatus={setLoginStatus} />
      <main>
        <Routes>
          <Route path="/" element={<Promotion/>} />
          {/* <Route
            path="/login"
            element={<LoginModal setLoginStatus={setLoginStatus} />}
          />
          <Route path="/signup" element={<SignupModal />} /> */}

          <Route
            path="/landing" element={<LandingPage />}
          />

          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

const NavbarWithRouter = ({ setLoginStatus }) => {
  const navigate = useNavigate();
  const userData = JSON.parse(sessionStorage.getItem("user"));
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const location = useLocation();

  const handleSwitchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    sessionStorage.clear();
    localStorage.clear();

    setLoginStatus(false);
    navigate("/landing");
  };

  const handleDashboardNavigate = () => {
    if (userData.role === "instructor") navigate("/instructor-dashboard");
    else if (userData.role === "user") navigate("/user-dashboard");
  };

  const handleSignupClick = (e) => {
    e.preventDefault();
    navigate("/signup");
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  if (location.pathname === '/') {
    return null;
  }

  return (
    <>
      <header className={`${styles.header} sticky-top`}>
        <div className="container-fluid">
          <div className="row align-items-center py-2">
            <div className="col-md-6">
              <div
                className={`${styles.logo} d-flex align-items-center`}
                onClick={handleDashboardNavigate}
                style={{ cursor: "pointer" }}
              >
                {/* <img
                  src={Logo}
                  alt="CodeGram Logo"
                  className={styles.logoImage}
                />

                 <img
                  src={NameTag}
                  alt="CodeGram Name Tag"
                  className={styles.nameTagImage}
                />                       */}
              </div>
            </div>
            <div className="col-md-6">
              <nav
                className={`${styles.nav} d-flex justify-content-md-end justify-content-center gap-3 align-items-center`}
              >
                {userData ? (
                  <>
                    <div className={styles.userProfile}>
                      <div className={styles.userAvatar}>
                        <span>
                          {userData.fullName?.[0] || ""}
                        </span>
                      </div>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>
                          {userData.fullName} 
                        </span>
                      </div>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`${styles.loginBtn} btn`}
                      onClick={() => setShowLoginModal(true)}
                    >
                      Login
                    </button>
                    <button
                      className={`${styles.signupBtn} btn`}
                      onClick={() => setShowSignupModal(true)}
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={closeModals}
        onSwitchToSignup={handleSwitchToSignup}
      />

      <SignupModal
        isOpen={showSignupModal}
        onClose={closeModals}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  );
};

export default App;
