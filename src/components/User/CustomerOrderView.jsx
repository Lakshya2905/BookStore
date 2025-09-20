import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./CustomerOrderView.module.css";
import { CUSTOMER_ORDER_VIEW_URL } from "../../constants/apiConstants";

const CustomerOrderView = () => {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedInvoices, setExpandedInvoices] = useState(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // EXACT same function as addItemToCart
  const getUserData = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      const token = sessionStorage.getItem("token");
      return { user, token };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null };
    }
  };

  // Check if user is logged in
  const checkLoginStatus = () => {
    const { user, token } = getUserData();
    const loggedIn = !!(user && token);
    setIsLoggedIn(loggedIn);
    return loggedIn;
  };

  // Format date to dd-mm-yyyy
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Toggle invoice expansion
  const toggleInvoiceExpansion = (invoiceId) => {
    setExpandedInvoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  // EXACT same pattern as addItemToCart - all logic inside the function
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      
      const { user, token } = getUserData();
      
      if (!user || !token) {
        setIsLoggedIn(false);
        setLoading(false);
        return null;
      }
      
      const requestData = {
        user: user,
        token: token
      };
      
      const response = await axios.post(`${CUSTOMER_ORDER_VIEW_URL}`, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.status === 'SUCCESS') {
        setInvoices(response.data.payload);
        setIsLoggedIn(true);
      } else {
        setError(response.data.message || "Failed to fetch invoices");
      }
      
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError("Network error, please try again later.");
      setLoading(false);
      throw error;
    }
  };

  // Handle login button click
  const handleLoginClick = () => {
    window.dispatchEvent(new Event("openLoginModal"));
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (checkLoginStatus()) {
      fetchOrders();
    }
  };

  // Initial check on component mount
  useEffect(() => {
    if (checkLoginStatus()) {
      fetchOrders();
    }
  }, []);

  // Listen for login success events (optional)
  useEffect(() => {
    const handleLoginSuccess = () => {
      if (checkLoginStatus()) {
        fetchOrders();
      }
    };

    window.addEventListener('loginSuccess', handleLoginSuccess);
    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess);
    };
  }, []);

  // SCREEN 1: Not logged in
  if (!isLoggedIn) {
    return (
      <div className={styles.orderViewContainer}>
        <div className={styles.header}>
          <h1 className={styles.heading}>My Orders</h1>
          <p className={styles.subHeading}>Track and manage your book orders</p>
        </div>

        <div className={styles.loginRequiredScreen}>
          <div className={styles.loginCard}>
            <div className={styles.loginIcon}>🔐</div>
            <h2 className={styles.loginTitle}>Login Required</h2>
            <p className={styles.loginMessage}>
              You need to log in to view your orders. Please sign in to your account to continue.
            </p>
            
            <div className={styles.loginButtons}>
              <button 
                onClick={handleLoginClick}
                className={styles.loginButton}
              >
                Login Now
              </button>
              
              <button 
                onClick={handleRefresh}
                className={styles.refreshButton}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className={styles.miniSpinner}></div>
                    Checking...
                  </>
                ) : (
                  <>
                    🔄 Refresh
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                <span className={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: Logged in - show orders
  return (
    <div className={styles.orderViewContainer}>
      <div className={styles.header}>
        <h1 className={styles.heading}>My Orders</h1>
        <p className={styles.subHeading}>Track and manage your book orders</p>
        
        <button 
          onClick={handleRefresh}
          className={styles.headerRefreshButton}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className={styles.miniSpinner}></div>
              Loading...
            </>
          ) : (
            <>
              🔄 Refresh
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>Loading your orders...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button 
              onClick={handleRefresh} 
              className={styles.retryButton}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {invoices.length === 0 && !loading && !error && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
        </div>
      )}

      <div className={styles.invoicesGrid}>
        {invoices.map((invoice) => {
          const isExpanded = expandedInvoices.has(invoice.invoiceId);
          
          return (
            <div className={styles.invoiceCard} key={invoice.invoiceId}>
              <div 
                className={styles.cardHeader} 
                onClick={() => toggleInvoiceExpansion(invoice.invoiceId)}
              >
                <div className={styles.headerContent}>
                  <div className={styles.headerLeft}>
                    <div className={styles.invoiceBasicInfo}>
                      <span className={styles.invoiceId}>Invoice #{invoice.invoiceId}</span>
                      <span className={styles.invoiceDate}>{formatDate(invoice.creationDate)}</span>
                      <span className={styles.customerName}>{invoice.customerName}</span>
                      {invoice.userId && (
                        <span className={styles.userId}>User: {invoice.userId}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.headerRight}>
                    <div className={styles.statusInfo}>
                      <div className={styles.statusRow}>
                        <span className={styles.statusLabel}>Order Status:</span>
                        <span className={`${styles.statusValue} ${styles[`order_${invoice.orderStatus.toLowerCase()}`]}`}>
                          {invoice.orderStatus}
                        </span>
                      </div>
                      <div className={styles.statusRow}>
                        <span className={styles.statusLabel}>Payment Status:</span>
                        <span className={`${styles.statusValue} ${styles[`payment_${invoice.paymentStatus.toLowerCase()}`]}`}>
                          {invoice.paymentStatus}
                        </span>
                      </div>
                    </div>
                    
                    <div className={`${styles.expandArrow} ${isExpanded ? styles.expanded : ''}`}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className={styles.expandedContent}>
                  <div className={styles.customerSection}>
                    <div className={styles.sectionTitle}>Delivery Information</div>
                    <div className={styles.customerGrid}>
                      <div className={styles.customerItem}>
                        <span className={styles.customerLabel}>Mobile</span>
                        <span className={styles.customerValue}>{invoice.mobileNo || invoice.customerRegisteredMobileNo}</span>
                      </div>
                      <div className={styles.customerItem}>
                        <span className={styles.customerLabel}>Address</span>
                        <span className={styles.customerValue}>
                          {invoice.deliveryAddress}, {invoice.city}, {invoice.state} - {invoice.pincode}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.ordersSection}>
                    <div className={styles.sectionTitle}>Order Items</div>
                    <div className={styles.tableWrapper}>
                      <table className={styles.ordersTable}>
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Book Details</th>
                            <th>Qty</th>
                            <th>MRP</th>
                            <th>Base Price</th>
                            <th>Discount</th>
                            <th>GST</th>
                            <th>Final Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.orderList.map(order => (
                            <tr key={order.orderId}>
                              <td>
                                <span className={styles.orderId}>#{order.orderId}</span>
                              </td>
                              <td>
                                <div className={styles.bookInfo}>
                                  <div className={styles.bookName}>{order.bookName}</div>
                                  <div className={styles.authorName}>by {order.authorName}</div>
                                </div>
                              </td>
                              <td>
                                <span className={styles.quantity}>{order.quantity}</span>
                              </td>
                              <td>
                                <div className={styles.priceColumn}>
                                  <span className={styles.mrpPrice}>₹{order.mrp?.toFixed(2) || '0.00'}</span>
                                </div>
                              </td>
                              <td>
                                <div className={styles.priceColumn}>
                                  <span className={styles.basePrice}>₹{order.basePrice?.toFixed(2) || '0.00'}</span>
                                </div>
                              </td>
                              <td>
                                <div className={styles.priceColumn}>
                                  {order.discount > 0 ? (
                                    <span className={styles.discountAmount}>-₹{order.discount.toFixed(2)}</span>
                                  ) : (
                                    <span className={styles.noDiscount}>-</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className={styles.gstColumn}>
                                  <div className={styles.gstAmount}>₹{order.gstPaid?.toFixed(2) || '0.00'}</div>
                                  <div className={styles.gstPercentage}>({order.gstPercentage || 0}%)</div>
                                </div>
                              </td>
                              <td>
                                <div className={styles.priceColumn}>
                                  <span className={styles.finalPrice}>₹{order.price?.toFixed(2) || '0.00'}</span>
                                </div>
                              </td>
                              <td>
                                <div className={styles.priceColumn}>
                                  <span className={styles.totalAmount}>₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.invoiceSummary}>
                      <div className={styles.summarySection}>
                        <h4 className={styles.summaryTitle}>Price Breakdown</h4>
                        <div className={styles.summaryGrid}>
                          <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Base Amount:</span>
                            <span className={styles.summaryValue}>₹{invoice.baseAmount?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Total GST:</span>
                            <span className={styles.summaryValue}>₹{invoice.totalGstPaid?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Final Amount:</span>
                            <span className={styles.summaryValueFinal}>₹{invoice.totalAmount?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {invoice.remark && (
                      <div className={styles.remark}>
                        <span className={styles.remarkLabel}>Note:</span>
                        <span className={styles.remarkText}>{invoice.remark}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerOrderView;