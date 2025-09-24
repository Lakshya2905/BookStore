import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, ShoppingCart, User, Menu, X, Settings, Plus, FileText, Edit, TrendingUp, Phone, Mail } from "lucide-react";
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

  // Load Bootstrap CSS
  const loadBootstrap = useCallback(() => {
    if (document.getElementById('navbar-bootstrap')) return;
    const link = document.createElement('link');
    link.id = 'navbar-bootstrap';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

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
      navigate('/admin/orders');
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
    // Only reload if path does NOT start with /admin or /order/customer/view
    if (!path.startsWith("/admin") && !path.startsWith("/order/customer/view")) {
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

  // Top bar social media icons component
  const TopBarSocialIcons = () => (
    <div className={styles.topBarSocialIcons}>
      <a
        href="https://www.facebook.com/share/1B952Jg8uE/"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.topBarSocialIcon}
        title="Follow us on Facebook"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </a>
      
      <a
        href="https://www.instagram.com/shaahkart?igsh=NTRleWtpcXBmOTJ2"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.topBarSocialIcon}
        title="Follow us on Instagram"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      </a>
      
      <a
        href="https://x.com/ShaahKart?t=VhJw-WVEfA2k-dYMdHBdog&s=08"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.topBarSocialIcon}
        title="Follow us on X (Twitter)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>
      
      <a
        href="https://wa.link/wac1at"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.topBarSocialIcon}
        title="Contact us on WhatsApp"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      </a>
    </div>
  );
  
  // Navigation buttons based on user role
  const navigationButtons = useMemo(() => {
    if (isOwner) {
      return [
        { label: "Add Book", path: "/admin/book/add", icon: <Plus size={16} /> },
        { label: "Add Category", path: "/admin/category/add", icon: <Plus size={16} /> },
        { label: "Update Category", path: "/admin/category/update", icon: <Plus size={16} /> },
        
        { label: "Update Book", path: "/admin/book/update", icon: <Edit size={16} /> },
        { label: "Priority Update", path: "/admin/book/priority/update", icon: <TrendingUp size={16} /> },
        { label: "Add Header Image", path: "/admin/add/discoveryImage", icon: <TrendingUp size={16} /> },
        { label: "Edit Header Image", path: "/admin/edit/discoveryImage", icon: <TrendingUp size={16} /> },
        { label: "Order Management", path: "/admin/orders", icon: <FileText size={16} /> },
         { label: "Blog Management", path: "/admin/blog/update", icon: <FileText size={16} /> }
      ];
    } else {
      return [
        { label: "Home", path: "/landing" },
        { label: "All Books", path: "/books" },
        { label: "New Releases", path: "/books?tag=NEW_RELEASE" },
        { label: "Best Sellers", path: "/books?tag=BESTSELLER" },
        { label: "Top Rated", path: "/books?tag=TOP_RATED" },
        { label: "My Orders", path: "/order/customer/view" },
         { label: "Blogs", path: "/blogs" }
      ];
    }
  }, [isOwner]);

  return (
    <>
     

      <header className={styles.header}>

 {/* Top Contact Bar - Only show for non-owner users */}
      {!isOwner && (
        <div className={styles.topBar}>
          <div className="container-fluid">
            <div className={styles.topBarContent}>
              <div className={styles.contactInfo}>
                <a href="tel:+919669661335" className={styles.contactItem}>
                  <Phone size={14} />
                  <span>+91 96696 61335</span>
                </a>
                <a href="mailto:info@shaahkart.com" className={styles.contactItem}>
                  <Mail size={14} />
                  <span>info@shaahkart.com</span>
                </a>
              </div>
              <TopBarSocialIcons />
            </div>
          </div>
        </div>
      )}

        {/* Main Header */}
        <div className={styles.mainHeader}>
          <div className="container-fluid">
            <div className="row align-items-center g-2">
              {/* Logo */}
              <div className="col-auto">
                <div
                  className={`${styles.logo} d-flex align-items-center`}
                  onClick={() => handleNavigation(isOwner ? "/admin/dashboard" : "/landing")}
                  style={{ cursor: "pointer" }}
                >
                  <img src={Logo} alt="Shah Cart Logo" className={`${styles.logoImg} img-fluid`} />
                  {isOwner && <span className={styles.adminBadge}>Admin</span>}
                </div>
              </div>

              {/* Search Bar - Only show for non-owner users */}
              {!isOwner && (
                <div className="col d-none d-md-block">
                  <div className="input-group mx-3" style={{ maxWidth: "500px" }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search books, authors, genres..."
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      onKeyPress={handleKeyPress}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleSearchSubmit}
                      type="submit"
                    >
                      <Search size={20} className="me-1" />
                      <span className="d-none d-lg-inline">Search</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Owner Panel Title */}
              {isOwner && (
                <div className="col d-none d-md-flex justify-content-center">
                  <div className={`${styles.adminTitle} d-flex align-items-center`}>
                    <Settings size={24} className="me-2" />
                    <h2 className="mb-0">Admin Panel</h2>
                  </div>
                </div>
              )}

              {/* Header Actions */}
              <div className="col-auto">
                <div className="d-flex align-items-center gap-2">
                  {/* Cart - Only show for non-owner users */}
                  {!isOwner && (
                    <button 
                      className={`btn btn-outline-secondary position-relative ${styles.cartButton}`} 
                      onClick={handleCartClick}
                    >
                      <ShoppingCart size={20} />
                      {cartItemCount > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </span>
                      )}
                    </button>
                  )}

                  {user ? (
                    <div className="d-flex align-items-center">
                      <div className="d-none d-sm-flex align-items-center me-2 px-2 py-1 bg-light rounded">
                        <User size={16} className="me-1" />
                        <small>
                          {user.fullName || user.name || user.email || "User"}
                          {isOwner && <span className="text-danger fw-bold ms-1">(Owner)</span>}
                        </small>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={handleSignOut}>
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-primary btn-sm" onClick={onSignIn}>
                        Sign In
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={onSignUp}>
                        Sign Up
                      </button>
                    </div>
                  )}

                  <button
                    className="btn btn-outline-secondary d-md-none"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation - Hidden on mobile, shown on larger screens */}
        <nav className={`${styles.navigation} d-none d-md-block`}>
          <div className="container-fluid">
            <div className="row">
              <div className="col">
                <div className="d-flex gap-3 py-2 flex-wrap">
                  {navigationButtons.map((item) => (
                    <button
                      key={item.label}
                      className={`btn ${isOwner ? 'btn-primary btn-sm' : 'btn-link text-decoration-none'} d-flex align-items-center`}
                      onClick={() => handleNavigation(item.path)}
                    >
                      {item.icon && <span className="me-1">{item.icon}</span>}
                      {item.label}
                    </button>
                  ))}

                  {/* Categories - Only show for non-owner users */}
                  {!isOwner && (
                    <button
                      className="btn btn-link text-decoration-none"
                      onClick={handleCategoriesClick}
                    >
                      Categories
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Menu - Only shown when mobileMenuOpen is true */}
        {mobileMenuOpen && (
          <div className={`${styles.mobileMenu} d-md-none`}>
            <div className="container-fluid">
              {/* User Info for Mobile */}
              {user && (
                <div className="d-flex d-sm-none align-items-center mb-3 p-2 bg-light rounded">
                  <User size={16} className="me-2" />
                  <small>
                    {user.fullName || user.name || user.email || "User"}
                    {isOwner && <span className="text-danger fw-bold ms-1">(Owner)</span>}
                  </small>
                </div>
              )}

              {/* Contact Info for Mobile - Only show for non-owner users */}
              {!isOwner && (
                <div className="mb-3">
                  <div className="d-flex flex-column align-items-center gap-2 mb-3">
                    <a href="tel:+919669661335" className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center">
                      <Phone size={16} className="me-2" />
                      +91 96696 61335
                    </a>
                    <a href="mailto:info@shaahkart.com" className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center">
                      <Mail size={16} className="me-2" />
                      info@shaahkart.com
                    </a>
                  </div>
                  <div className="text-center">
                    <small className="text-muted mb-2 d-block">Follow Us</small>
                    <TopBarSocialIcons />
                  </div>
                </div>
              )}

              {/* Mobile Navigation Buttons */}
              <div className="d-grid gap-2 mb-3">
                {navigationButtons.map((item) => (
                  <button
                    key={`mobile-${item.label}`}
                    className={`btn ${isOwner ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center justify-content-start`}
                    onClick={() => closeMobileMenuAndNavigate(item.path)}
                  >
                    {item.icon && <span className="me-2">{item.icon}</span>}
                    {item.label}
                  </button>
                ))}

                {/* Categories for mobile - Only show for non-owner users */}
                {!isOwner && (
                  <button
                    className="btn btn-outline-secondary d-flex align-items-center justify-content-start"
                    onClick={() => closeMobileMenuAndRunAction(handleCategoriesClick)}
                  >
                    Categories
                  </button>
                )}
              </div>

              {/* Mobile Search - Only show for non-owner users */}
              {!isOwner && (
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleSearchSubmit}
                  >
                    <Search size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Cart Sidebar - Only show for non-owner users */}
      {!isOwner && (
        <CartSidebar
          isOpen={cartOpen}
          onClose={handleCartClose}
        />
      )}
    </>
  );
});

NavBar.displayName = "NavBar";

export default NavBar;