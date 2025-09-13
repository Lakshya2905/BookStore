import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Menu, X } from "lucide-react";
import CartSidebar from "../Cart/CartSidebar";
import styles from "./NavBar.module.css";
import Logo from "../images/logo.jpg";

const NavBar = ({ onSignIn, onSignUp, onSearch }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();
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

  const handleCategoriesClick = () => {
 
      navigate("/landing");
      window.location.hash = "#categories";
    
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  const handleCartClick = () => {
    if (!user) {
      // If user is not logged in, show sign in modal
      onSignIn();
      return;
    }
    setCartOpen(true);
  };

  const handleCartClose = () => {
    setCartOpen(false);
  };

  const handleCheckout = (cartData) => {
    // Navigate to checkout page with cart data
    console.log('Proceeding to checkout with:', cartData);
    navigate('/checkout', { state: { cartData } });
  };

  // Navigation handlers
  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleAuthorsClick = () => {
    if (location.pathname === "/landing") {
      window.location.hash = "#authors";
    } else {
      navigate("/landing");
      // Removed the setTimeout - hash will be set immediately
      window.location.hash = "#authors";
    }
  };

  return (
    <>
      <header className={styles.header}>
        {/* Main Header */}
        <div className={styles.mainHeader}>
          <div className={styles.headerContent}>
           <div
            className={styles.logo}
            onClick={() => navigate("/landing")}
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
            <button 
              className={styles.navButton} 
              onClick={() => handleNavigation("/landing")}
            >
              Home
            </button>
            <button 
              className={styles.navButton} 
              onClick={() => handleNavigation("/books")}
            >
              All Books
            </button>
            <button 
              className={styles.navButton} 
              onClick={() => handleNavigation("/books?tag=NEW_RELEASE")}
            >
              New Releases
            </button>
            <button 
              className={styles.navButton} 
              onClick={() => handleNavigation("/books?tag=BESTSELLER")}
            >
              Best Sellers
            </button>
            <button 
              className={styles.navButton} 
              onClick={() => handleNavigation("/books?tag=TOP_RATED")}
            >
              Top Rated
            </button>
            
            <button className={styles.categoryBtn} onClick={handleCategoriesClick}>
              Categories
            </button>
            <button className={styles.navButton} onClick={handleAuthorsClick}>
              Authors
            </button>
            <button 
              className={styles.navButton} 
              onClick={() => handleNavigation("/books?tag=SALE")}
            >
              Sale
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <button 
              className={styles.mobileNavButton} 
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavigation("/landing");
              }}
            >
              Home
            </button>

            <button 
              className={styles.mobileNavButton} 
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavigation("/books");
              }}
            >
              All Books
            </button>
            <button 
              className={styles.mobileNavButton} 
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavigation("/books?tag=NEW_RELEASE");
              }}
            >
              New Releases
            </button>
            <button 
              className={styles.mobileNavButton} 
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavigation("/books?tag=BESTSELLER");
              }}
            >
              Best Sellers
            </button>
            <button 
              className={styles.mobileNavButton} 
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavigation("/books?tag=TOP_RATED");
              }}
            >
              Top Rated
            </button>
            
            <button
              className={styles.categoryBtn}
              onClick={() => {
                setMobileMenuOpen(false);
                handleCategoriesClick();
              }}
            >
              Categories
            </button>

            <button 
              className={styles.mobileNavButton} 
              onClick={() => {
                setMobileMenuOpen(false);
                handleAuthorsClick();
              }}
            >
              Authors
            </button>
            <button 
              className={styles.mobileNavButton} 
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavigation("/books?tag=SALE");
              }}
            >
              Sale
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
};

export default NavBar;