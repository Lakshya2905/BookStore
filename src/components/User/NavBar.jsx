import React, { useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Menu, X } from "lucide-react";
import CartSidebar from "../Cart/CartSidebar";
import styles from "./NavBar.module.css";
import Logo from "../images/logo.jpg";

const NavBar = React.memo(({ onSignIn, onSignUp, onSearch }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [forceRender, setForceRender] = useState(0); // 👈 dummy state
  const location = useLocation();
  const navigate = useNavigate();

  const getUserData = useCallback(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      const token = sessionStorage.getItem("token");
      return { user, token, role: user?.role || null };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  }, []);

  const { user } = useMemo(() => getUserData(), [getUserData, forceRender]); 
  // 👆 re-run when forceRender changes

  const handleSignOut = useCallback(() => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    navigate("/landing");
    window.location.reload();
  }, [navigate]);

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`/landing?search=${encodeURIComponent(searchQuery.trim())}`);
        setForceRender((prev) => prev + 1); // 👈 force re-render
      }
    },
    [searchQuery, navigate]
  );

  const handleCategoriesClick = useCallback(() => {
    navigate("/landing");
    window.location.hash = "#categories";
    setForceRender((prev) => prev + 1); // 👈 force re-render
  }, [navigate]);

  const handleSearchInputChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") {
        handleSearchSubmit(e);
      }
    },
    [handleSearchSubmit]
  );

  const handleCartClick = useCallback(() => {
    if (!user) {
      onSignIn();
      return;
    }
    setCartOpen(true);
  }, [user, onSignIn]);

  const handleCartClose = useCallback(() => {
    setCartOpen(false);
  }, []);

  const handleCheckout = useCallback(
    (cartData) => {
      console.log("Proceeding to checkout with:", cartData);
      navigate("/checkout", { state: { cartData } });
    },
    [navigate]
  );

  const handleNavigation = useCallback(
    (path) => {
      navigate(path);
      setForceRender((prev) => prev + 1); // 👈 force re-render on nav
    },
    [navigate]
  );

  const handleAuthorsClick = useCallback(() => {
    if (location.pathname === "/landing") {
      window.location.hash = "#authors";
    } else {
      navigate("/landing");
      window.location.hash = "#authors";
    }
    setForceRender((prev) => prev + 1); // 👈 force re-render
  }, [location.pathname, navigate]);

  const closeMobileMenuAndNavigate = useCallback(
    (path) => {
      setMobileMenuOpen(false);
      navigate(path);
      setForceRender((prev) => prev + 1); // 👈 force re-render
    },
    [navigate]
  );

  const closeMobileMenuAndRunAction = useCallback((action) => {
    setMobileMenuOpen(false);
    action();
    setForceRender((prev) => prev + 1); // 👈 force re-render
  }, []);

  const navigationButtons = useMemo(
    () => [
      { label: "Home", path: "/landing" },
      { label: "All Books", path: "/books" },
      { label: "New Releases", path: "/books?tag=NEW_RELEASE" },
      { label: "Best Sellers", path: "/books?tag=BESTSELLER" },
      { label: "Top Rated", path: "/books?tag=TOP_RATED" },
      { label: "Sale", path: "/books?tag=SALE" },
    ],
    []
  );

  return (
    <>
      <header className={styles.header}>
        {/* Main Header */}
        <div className={styles.mainHeader}>
          <div className={styles.headerContent}>
            <div
              className={styles.logo}
              onClick={() => handleNavigation("/landing")}
              style={{ cursor: "pointer" }}
            >
              <img src={Logo} alt="Shah Cart Logo" className={styles.logoImg} />
            </div>

            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search books, authors, genres..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
              />
              <button
                className={styles.searchButton}
                onClick={handleSearchSubmit}
                type="submit"
              >
                <Search size={20} />
                Search
              </button>
            </div>

            <div className={styles.headerActions}>
              <button className={styles.actionButton}>
                <Heart size={20} />
              </button>
              <button className={styles.actionButton} onClick={handleCartClick}>
                <ShoppingCart size={20} />
              </button>
              {user ? (
                <div className={styles.userInfo}>
                  <User size={20} />
                  <span>
                    {user.fullName || user.name || user.email || "User"}
                  </span>
                  <button className={styles.signOutBtn} onClick={handleSignOut}>
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className={styles.signInButtons}>
                  <button className={styles.signInBtn} onClick={onSignIn}>
                    Sign In
                  </button>
                  <button className={styles.signUpBtn} onClick={onSignUp}>
                    Sign Up
                  </button>
                </div>
              )}

              <button
                className={styles.mobileMenuButton}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.navigation}>
          <div className={styles.navContent}>
            {navigationButtons.map((item) => (
              <button
                key={item.label}
                className={styles.navButton}
                onClick={() => handleNavigation(item.path)}
              >
                {item.label}
              </button>
            ))}

            <button
              className={styles.categoryBtn}
              onClick={handleCategoriesClick}
            >
              Categories
            </button>
            <button className={styles.navButton} onClick={handleAuthorsClick}>
              Authors
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            {navigationButtons.map((item) => (
              <button
                key={`mobile-${item.label}`}
                className={styles.mobileNavButton}
                onClick={() => closeMobileMenuAndNavigate(item.path)}
              >
                {item.label}
              </button>
            ))}

            <button
              className={styles.categoryBtn}
              onClick={() =>
                closeMobileMenuAndRunAction(handleCategoriesClick)
              }
            >
              Categories
            </button>

            <button
              className={styles.mobileNavButton}
              onClick={() => closeMobileMenuAndRunAction(handleAuthorsClick)}
            >
              Authors
            </button>

            {/* Mobile Search */}
            <div className={styles.mobileSearchBar}>
              <input
                type="text"
                placeholder="Search books..."
                className={styles.mobileSearchInput}
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
              />
              <button
                className={styles.mobileSearchButton}
                onClick={handleSearchSubmit}
              >
                <Search size={18} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={cartOpen}
        onClose={handleCartClose}
        onCheckout={handleCheckout}
      />
    </>
  );
});

NavBar.displayName = "NavBar";

export default NavBar;
