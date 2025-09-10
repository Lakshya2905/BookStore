import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Menu, X } from "lucide-react";
import styles from "./NavBar.module.css";

const NavBar = ({ onSignIn, onSignUp, onCartClick, onSearch }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const getUserData = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      const token = sessionStorage.getItem("token");
      return { user, token, role: user?.role || null };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

  const { user } = getUserData();

  const handleSignOut = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    navigate("/landing");
    window.location.reload();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to books page with search query
      navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  return (
    <header className={styles.header}>

      {/* Main Header */}
      <div className={styles.mainHeader}>
        <div className={styles.headerContent}>
          <div className={styles.logo} onClick={() => navigate('/landing')}>
            <span className={styles.logoIcon}>📚</span>
            <h5>Shah Cart</h5>
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
            <button className={styles.actionButton} onClick={onCartClick}>
              <ShoppingCart size={20} />
            </button>
            {user ? (
              <div className={styles.userInfo}>
                <User size={20} />
                <span>{user.fullName || user.name || user.email || "User"}</span>

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
          <Link to="/landing" className={styles.navLink}>
            Home
          </Link>
          <Link to="/books" className={styles.navLink}>
            All Books
          </Link>
          <Link to="/books?category=NEW_RELEASE" className={styles.navLink}>
            New Releases
          </Link>
          <Link to="/books?category=BESTSELLER" className={styles.navLink}>
            Best Sellers
          </Link>
          <a href="#categories" className={styles.navLink}>
            Categories
          </a>
          <a href="#authors" className={styles.navLink}>
            Authors
          </a>
          <Link to="/books?category=SALE" className={styles.navLink}>
            Sale
          </Link>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/landing" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/books" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
            All Books
          </Link>
          <Link to="/books?category=NEW_RELEASE" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
            New Releases
          </Link>
          <Link to="/books?category=BESTSELLER" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
            Best Sellers
          </Link>
          <a href="#categories" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
            Categories
          </a>
          <a href="#authors" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
            Authors
          </a>
          <Link to="/books?category=SALE" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
            Sale
          </Link>
          
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
  );
};

export default NavBar;