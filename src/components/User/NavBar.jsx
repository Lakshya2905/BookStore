import React, { useState } from "react";
import { Search, Heart, ShoppingCart, User, Menu, X } from "lucide-react";
import styles from "./NavBar.module.css";

const NavBar = ({ onSignIn, onSignUp, onCartClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    window.location.reload();
  };

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.topBarContent}>
          <span>📦 Free shipping on orders over $35</span>
          <span>📞 Customer Service: 1-800-BOOKS</span>
          <div className={styles.authLinks}>
            {user ? (
              <div className={styles.signedIn}>
                <span>Welcome, {user.name || user.email}!</span>
                <button className={styles.signOutBtn} onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className={styles.authLinks}>
                <span className={styles.authLink} onClick={onSignIn}>
                  Sign In
                </span>
                <span className={styles.authLink} onClick={onSignUp}>
                  Create Account
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.mainHeader}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>📚</span>
            <h1>BookHaven</h1>
          </div>

          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search books, authors, genres..."
              className={styles.searchInput}
            />
            <button className={styles.searchButton}>
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
                <span>{user.name || user.email || "User"}</span>
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

      <nav className={styles.navigation}>
        <div className={styles.navContent}>
          <a href="#" className={styles.navLink}>
            Home
          </a>
          <a href="#" className={styles.navLink}>
            New Releases
          </a>
          <a href="#" className={styles.navLink}>
            Best Sellers
          </a>
          <a href="#" className={styles.navLink}>
            Categories
          </a>
          <a href="#" className={styles.navLink}>
            Authors
          </a>
          <a href="#" className={styles.navLink}>
            Sale
          </a>
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
