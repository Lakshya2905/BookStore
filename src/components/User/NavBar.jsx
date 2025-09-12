import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Menu, X } from "lucide-react";
import CartSidebar from "../Cart/CartSidebar";
import styles from "./NavBar.module.css";
import  Logo  from "../images/logo.jpg";

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
    if (location.pathname !== "/landing") {
      navigate("/landing");
      setTimeout(() => {
        window.location.hash = "#categovries";
        // Or, use scroll logic if needed:
        // document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
      }, 200); // adjust delay if needed
    } else {
      window.location.hash = "#categories";
      // Or scroll directly
      // document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
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
            <Link to="/landing" className={styles.navLink}>
              Home
            </Link>
            <Link to="/books" className={styles.navLink}>
              All Books
            </Link>
            <Link to="/books?tag=NEW_RELEASE" className={styles.navLink}>
              New Releases
            </Link>
            <Link to="/books?tag=BESTSELLER" className={styles.navLink}>
              Best Sellers
            </Link>
            <Link to="/books?tag=TOP_RATED" className={styles.navLink}>
              Top Rated
            </Link>
            
            
            <button className={styles.categoryBtn} onClick={handleCategoriesClick}>
              Categories
            </button>
            <a href="#authors" className={styles.navLink}>
              Authors
            </a>
            <Link to="/books?tag=SALE" className={styles.navLink}>
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
            <Link to="/books?tag=NEW_RELEASE" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              New Releases
            </Link>
            <Link to="/books?tag=BESTSELLER" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              Best Sellers
            </Link>
            <Link to="/books?tag=TOP_RATED" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              Top Rated
            </Link>
            <a href="#categories" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              Categories
            </a>
            <a href="#authors" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              Authors
            </a>
            <Link to="/books?tag=SALE" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
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