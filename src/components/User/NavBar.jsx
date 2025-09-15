import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Menu, X, Settings, Plus, FileText, Edit, TrendingUp } from "lucide-react";
import CartSidebar from "../Cart/CartSidebar";
import styles from "./NavBar.module.css";
import Logo from "../images/logo.jpg";
import axios from 'axios';
import { CART_ITEM_URL } from '../../constants/apiConstants';



const NavBar = React.memo(({ onSignIn, onSignUp }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const getUserData = useCallback(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      const token = sessionStorage.getItem("token");
      return { user, token, role: user?.userRole || null };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  }, []);

  const { user, role } = useMemo(() => getUserData(), [getUserData]);

  // Check if user is owner
  const isOwner = useMemo(() => role === 'OWNER', [role]);

  // Function to fetch cart item count
  const fetchCartItemCount = useCallback(async () => {
    if (!user || isOwner) {
      setCartItemCount(0);
      return;
    }

    try {
      const { user: userData, token } = getUserData();
      if (!userData || !token) {
        setCartItemCount(0);
        return;
      }

      const requestData = {
        user: userData,
        token: token
      };

      // Replace with your actual API endpoint for getting cart total
      const response = await axios.post(`${CART_ITEM_URL}`, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'SUCCESS') {
        // Assuming the response contains count in response.data.data
        setCartItemCount(response.data.payload || 0);
      } else {
        setCartItemCount(0);
      }
    } catch (error) {
      console.error('Error fetching cart item count:', error);
      setCartItemCount(0);
    }
  }, [user, isOwner, getUserData]);

  // Fetch cart count on component mount and when user changes
  useEffect(() => {
    fetchCartItemCount();
  }, [fetchCartItemCount]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartItemCount();
    };

    // Listen for custom cart update events
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Also listen for focus events to refresh when user comes back to the page
    window.addEventListener('focus', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('focus', handleCartUpdate);
    };
  }, [fetchCartItemCount]);

  // Handle default navigation for owners after login
  useEffect(() => {
    if (isOwner && location.pathname === '/landing') {
      navigate('/admin/invoice');
    }
  }, [isOwner, location.pathname, navigate]);

  const handleSignOut = useCallback(() => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    setCartItemCount(0); // Reset cart count on sign out
    navigate("/landing");
    window.location.reload();
  }, [navigate]);

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
        window.location.reload();
      }
    },
    [searchQuery, navigate]
  );

const handleCategoriesClick = useCallback(() => {
  navigate("/landing#categories");
  // Delay is often needed to let navigation finish before scrolling
  setTimeout(() => {
    const el = document.getElementById("categories");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, 100);
}, [navigate]);


const handleNavigation = useCallback(
  (path) => {
    navigate(path);

    // Only reload if path does NOT start with /admin
    if (!path.startsWith("/admin")) {
      window.location.reload();
    }
  },
  [navigate]
);

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
    // Refresh cart count when cart is closed
    fetchCartItemCount();
  }, [fetchCartItemCount]);

  const handleCheckout = useCallback(
    (cartData) => {
      console.log("Proceeding to checkout with:", cartData);
      navigate("/checkout", { state: { cartData } });
    },
    [navigate]
  );

  const closeMobileMenuAndNavigate = useCallback(
    (path) => {
      setMobileMenuOpen(false);
      navigate(path);
      window.location.reload();
    },
    [navigate]
  );

  const closeMobileMenuAndRunAction = useCallback((action) => {
    setMobileMenuOpen(false);
    action();
    window.location.reload();
  }, []);

  // Navigation buttons based on user role
  const navigationButtons = useMemo(() => {
    if (isOwner) {
      return [
        { label: "Add Book", path: "/admin/book/add", icon: <Plus size={16} /> },
        { label: "Add Category", path: "/admin/category/add", icon: <Plus size={16} /> },
        { label: "Update Book", path: "/admin/book/update", icon: <Edit size={16} /> },
        { label: "Priority Update", path: "/admin/book/priority/update", icon: <TrendingUp size={16} /> },
        { label: "Add Discovery Image", path: "/admin/add/discoveryImage", icon: <TrendingUp size={16} /> },
        { label: "Edit Discovery Image", path: "/admin/edit/discoveryImage", icon: <TrendingUp size={16} /> },
        
        { label: "Invoice Export", path: "/admin/invoice", icon: <FileText size={16} /> },
      ];
    } else {
      return [
        { label: "Home", path: "/landing" },
        { label: "All Books", path: "/books" },
        { label: "New Releases", path: "/books?tag=NEW_RELEASE" },
        { label: "Best Sellers", path: "/books?tag=BESTSELLER" },
        { label: "Top Rated", path: "/books?tag=TOP_RATED" },
        { label: "Sale", path: "/books?tag=SALE" },
      ];
    }
  }, [isOwner]);

  return (
    <>
      <header className={styles.header}>
        {/* Main Header */}
        <div className={styles.mainHeader}>
          <div className={styles.headerContent}>
            <div
              className={styles.logo}
              onClick={() => handleNavigation(isOwner ? "/admin/dashboard" : "/landing")}
              style={{ cursor: "pointer" }}
            >
              <img src={Logo} alt="Shah Cart Logo" className={styles.logoImg} />
              {isOwner && <span className={styles.adminBadge}>Admin</span>}
            </div>

            {/* Search Bar - Only show for non-owner users */}
            {!isOwner && (
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
            )}

            {/* Owner Panel Title */}
            {isOwner && (
              <div className={styles.adminTitle}>
                <Settings size={24} />
                <h2>Admin Panel</h2>
              </div>
            )}

            <div className={styles.headerActions}>
              {/* Heart and Cart - Only show for non-owner users */}
              {!isOwner && (
                <>
                  <button 
                    className={`${styles.actionButton} ${styles.cartButton}`} 
                    onClick={handleCartClick}
                  >
                    <div className={styles.cartIconWrapper}>
                      <ShoppingCart size={20} />
                      {cartItemCount > 0 && (
                        <span className={styles.cartBadge}>
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </span>
                      )}
                    </div>
                  </button>
                </>
              )}

              {user ? (
                <div className={styles.userInfo}>
                  <User size={20} />
                  <span>
                    {user.fullName || user.name || user.email || "User"}
                    {isOwner && <span className={styles.roleTag}>(Owner)</span>}
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
                className={`${styles.navButton} ${isOwner ? styles.adminNavButton : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                {item.icon && <span className={styles.navIcon}>{item.icon}</span>}
                {item.label}
              </button>
            ))}

            {/* Categories and Authors - Only show for non-owner users */}
            {!isOwner && (
              <>
                <button
                  className={styles.categoryBtn}
                  onClick={handleCategoriesClick}
                >
                  Categories
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            {navigationButtons.map((item) => (
              <button
                key={`mobile-${item.label}`}
                className={`${styles.mobileNavButton} ${isOwner ? styles.adminMobileNavButton : ''}`}
                onClick={() => closeMobileMenuAndNavigate(item.path)}
              >
                {item.icon && <span className={styles.navIcon}>{item.icon}</span>}
                {item.label}
              </button>
            ))}

            {/* Categories and Authors for mobile - Only show for non-owner users */}
            {!isOwner && (
              <>
                <button
                  className={styles.categoryBtn}
                  onClick={() =>
                    closeMobileMenuAndRunAction(handleCategoriesClick)
                  }
                >
                  Categories
                </button>

          
              </>
            )}

            {/* Mobile Search - Only show for non-owner users */}
            {!isOwner && (
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
            )}
          </div>
        )}
      </header>

      {/* Cart Sidebar - Only show for non-owner users */}
      {!isOwner && (
        <CartSidebar
          isOpen={cartOpen}
          onClose={handleCartClose}
          onCheckout={handleCheckout}
        />
      )}
    </>
  );
});

NavBar.displayName = "NavBar";

export default NavBar;