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
        { label: "My Orders", path: "/order/customer/view" },
      ];
    }
  }, [isOwner]);

  return (
    <>
      <header className={styles.header}>
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
                  {/* Heart and Cart - Only show for non-owner users */}
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
          onCheckout={handleCheckout}
        />
      )}
    </>
  );
});

NavBar.displayName = "NavBar";

export default NavBar;