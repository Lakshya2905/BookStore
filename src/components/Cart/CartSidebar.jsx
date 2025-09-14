import React, { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, MapPin, Phone, User, CreditCard } from 'lucide-react';
import axios from 'axios';
import styles from './CartSidebar.module.css';
import { CART_VIEW_URL, CART_ITEM_QUANTITY_URL, CART_ITEM_DELETE_URL, CHECKOUT_CART_URL } from '../../constants/apiConstants';

// Checkout Modal Component
const CheckoutModal = ({ isOpen, onClose, cartData, onPlaceOrder }) => {
  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    deliveryAddress: '',
    city: '',
    state: '',
    pincode: '',
    mobileNo: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Auto-fill customer name from session storage
  useEffect(() => {
    if (isOpen) {
      try {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (user && user.name) {
          setCustomerInfo(prev => ({
            ...prev,
            customerName: user.name
          }));
        }
      } catch (error) {
        console.error("Error getting user data:", error);
      }
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCustomerInfo({
        customerName: '',
        deliveryAddress: '',
        city: '',
        state: '',
        pincode: '',
        mobileNo: ''
      });
      setErrors({});
      setLoading(false);
    }
  }, [isOpen]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!customerInfo.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    
    if (!customerInfo.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required';
    }
    
    if (!customerInfo.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!customerInfo.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!customerInfo.pincode || customerInfo.pincode.toString().length !== 6) {
      newErrors.pincode = 'Valid 6-digit pincode is required';
    }
    
    if (!customerInfo.mobileNo || customerInfo.mobileNo.length !== 10) {
      newErrors.mobileNo = 'Valid 10-digit mobile number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onPlaceOrder(customerInfo);
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.checkoutModalOverlay}>
      <div className={styles.checkoutModal}>
        {/* Modal Header */}
        <div className={styles.checkoutHeader}>
          <h2 className={styles.checkoutTitle}>
            <CreditCard size={24} />
            Complete Your Order
          </h2>
          <button className={styles.closeButton} onClick={onClose} disabled={loading}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className={styles.checkoutContent}>
          {/* Order Summary */}
          <div className={styles.orderSummary}>
            <h3>Order Summary</h3>
            <div className={styles.summaryItems}>
              {cartData.items.map((item) => (
                <div key={item.bookCartId} className={styles.summaryItem}>
                  <div className={styles.summaryItemDetails}>
                    <span className={styles.summaryItemName}>{item.bookName}</span>
                    <span className={styles.summaryItemQuantity}>Qty: {item.quantity}</span>
                  </div>
                  <span className={styles.summaryItemTotal}>
                    {formatCurrency(item.totalValue)}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.orderTotal}>
              <strong>Total: {formatCurrency(cartData.totalAmount)}</strong>
            </div>
          </div>

          {/* Customer Information Form */}
          <div className={styles.customerForm}>
            <h3>Delivery Information</h3>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <User size={16} />
                  Customer Name *
                </label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.customerName ? styles.inputError : ''}`}
                  value={customerInfo.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
                {errors.customerName && (
                  <span className={styles.errorMessage}>{errors.customerName}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <MapPin size={16} />
                  Delivery Address *
                </label>
                <textarea
                  className={`${styles.textarea} ${errors.deliveryAddress ? styles.inputError : ''}`}
                  value={customerInfo.deliveryAddress}
                  onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                  placeholder="Enter complete delivery address"
                  rows={3}
                  disabled={loading}
                />
                {errors.deliveryAddress && (
                  <span className={styles.errorMessage}>{errors.deliveryAddress}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>City *</label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
                  value={customerInfo.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                  disabled={loading}
                />
                {errors.city && (
                  <span className={styles.errorMessage}>{errors.city}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>State *</label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.state ? styles.inputError : ''}`}
                  value={customerInfo.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter state"
                  disabled={loading}
                />
                {errors.state && (
                  <span className={styles.errorMessage}>{errors.state}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Pincode *</label>
                <input
                  type="number"
                  className={`${styles.input} ${errors.pincode ? styles.inputError : ''}`}
                  value={customerInfo.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="6-digit pincode"
                  disabled={loading}
                />
                {errors.pincode && (
                  <span className={styles.errorMessage}>{errors.pincode}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <Phone size={16} />
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  className={`${styles.input} ${errors.mobileNo ? styles.inputError : ''}`}
                  value={customerInfo.mobileNo}
                  onChange={(e) => handleInputChange('mobileNo', e.target.value)}
                  placeholder="10-digit mobile number"
                  disabled={loading}
                />
                {errors.mobileNo && (
                  <span className={styles.errorMessage}>{errors.mobileNo}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.checkoutFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={styles.placeOrderButton}
            onClick={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className={styles.miniSpinner}></div>
                Placing Order...
              </>
            ) : (
              `Place Order - ${formatCurrency(cartData.totalAmount)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const CartSidebar = ({ isOpen, onClose, onCheckout }) => {
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Get user data from sessionStorage
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

  // Fetch cart data
  const fetchCartData = async () => {
    const { user, token } = getUserData();
    
    if (!user || !token) {
      setError('Please sign in to view your cart');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${CART_VIEW_URL}`, {
        user: user,
        token: token
      });

      if (response.data.status === 'SUCCESS') {
        setCartData(response.data.payload);
      } else {
        setError(response.data.message || 'Failed to load cart');
        setCartData(null);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to load cart data');
      setCartData(null);
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (bookCartId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const { user, token } = getUserData();
    if (!user || !token) return;

    setUpdatingItems(prev => new Set(prev).add(bookCartId));

    try {
      const response = await axios.post(`${CART_ITEM_QUANTITY_URL}`, {
        user: user,
        token: token,
        bookCartId: bookCartId,
        quantity: newQuantity
      });

      if (response.data.status === 'SUCCESS') {
        await fetchCartData();
      } else {
        setError(response.data.message || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update quantity');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookCartId);
        return newSet;
      });
    }
  };

  // Remove item from cart
  const removeItem = async (bookCartId) => {
    const { user, token } = getUserData();
    if (!user || !token) return;

    setUpdatingItems(prev => new Set(prev).add(bookCartId));

    try {
      const response = await axios.post(`${CART_ITEM_DELETE_URL}`, {
        user: user,
        token: token,
        bookCartId: bookCartId
      });

      if (response.data.status === 'SUCCESS') {
        await fetchCartData();
      } else {
        setError(response.data.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookCartId);
        return newSet;
      });
    }
  };

  // Handle checkout button click
  const handleCheckout = () => {
    if (cartData && cartData.items.length > 0) {
      setShowCheckoutModal(true);
    }
  };

  // Handle place order
  const handlePlaceOrder = async (customerInfo) => {
    const { user, token } = getUserData();
    if (!user || !token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await axios.post(`${CHECKOUT_CART_URL}`, {
        user: user,
        token: token,
        customerInfoDto: customerInfo
      });

      if (response.data.status === 'SUCCESS') {
        // Order placed successfully
        setShowCheckoutModal(false);
        onClose();
        
        // Refresh cart data to show empty cart
        await fetchCartData();
        
        // Call parent component's onCheckout if needed
        if (onCheckout) {
          onCheckout(response.data);
        }
        
        // Show success message (you can customize this)
        alert('Order placed successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
      throw error;
    }
  };

  // Fetch cart data when sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchCartData();
    }
  }, [isOpen]);

  // Close checkout modal when cart sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setShowCheckoutModal(false);
    }
  }, [isOpen]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            <ShoppingBag size={24} />
            Shopping Cart
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading cart...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>{error}</p>
              <button className={styles.retryButton} onClick={fetchCartData}>
                Retry
              </button>
            </div>
          ) : !cartData || cartData.items.length === 0 ? (
            <div className={styles.emptyCart}>
              <ShoppingBag size={48} />
              <h3>Your cart is empty</h3>
              <p>Add some books to get started!</p>
            </div>
          ) : (
            <>
              {/* Cart Items Table */}
              <div className={styles.tableContainer}>
                <table className={styles.cartTable}>
                  <thead>
                    <tr>
                      <th className={styles.tableHeader}>Book Details</th>
                      <th className={styles.tableHeader}>Price</th>
                      <th className={styles.tableHeader}>Quantity</th>
                      <th className={styles.tableHeader}>Total</th>
                      <th className={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartData.items.map((item) => (
                      <tr key={item.bookCartId} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          <div className={styles.bookDetails}>
                            <h4 className={styles.bookName}>{item.bookName}</h4>
                            <p className={styles.authorName}>by {item.authorName}</p>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <span className={styles.price}>{formatCurrency(item.price)}</span>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.quantityControls}>
                            <button
                              className={styles.quantityButton}
                              onClick={() => updateQuantity(item.bookCartId, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updatingItems.has(item.bookCartId)}
                              title="Decrease quantity"
                            >
                              -
                            </button>
                            <span className={styles.quantity}>{item.quantity}</span>
                            <button
                              className={styles.quantityButton}
                              onClick={() => updateQuantity(item.bookCartId, item.quantity + 1)}
                              disabled={updatingItems.has(item.bookCartId)}
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <span className={styles.itemTotal}>
                            {formatCurrency(item.totalValue)}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          <button
                            className={styles.deleteButton}
                            onClick={() => removeItem(item.bookCartId)}
                            disabled={updatingItems.has(item.bookCartId)}
                            title="Remove item from cart"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (for responsive) */}
              <div className={styles.mobileItemsContainer}>
                {cartData.items.map((item) => (
                  <div key={item.bookCartId} className={styles.mobileCartItem}>
                    <div className={styles.mobileItemHeader}>
                      <div className={styles.bookDetails}>
                        <h4 className={styles.bookName}>{item.bookName}</h4>
                        <p className={styles.authorName}>by {item.authorName}</p>
                      </div>
                      <button
                        className={styles.deleteButton}
                        onClick={() => removeItem(item.bookCartId)}
                        disabled={updatingItems.has(item.bookCartId)}
                        title="Remove item from cart"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className={styles.mobileItemDetails}>
                      <div className={styles.mobileDetailRow}>
                        <span className={styles.label}>Price:</span>
                        <span className={styles.value}>{formatCurrency(item.price)}</span>
                      </div>
                      
                      <div className={styles.mobileDetailRow}>
                        <span className={styles.label}>Quantity:</span>
                        <div className={styles.quantityControls}>
                          <button
                            className={styles.quantityButton}
                            onClick={() => updateQuantity(item.bookCartId, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updatingItems.has(item.bookCartId)}
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <span className={styles.quantity}>{item.quantity}</span>
                          <button
                            className={styles.quantityButton}
                            onClick={() => updateQuantity(item.bookCartId, item.quantity + 1)}
                            disabled={updatingItems.has(item.bookCartId)}
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <div className={styles.mobileDetailRow}>
                        <span className={styles.label}>Total:</span>
                        <span className={`${styles.value} ${styles.itemTotal}`}>
                          {formatCurrency(item.totalValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span>Total Items:</span>
                  <span>{cartData.totalItem}</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span>Total Amount:</span>
                  <span>{formatCurrency(cartData.totalAmount)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                className={styles.checkoutButton}
                onClick={handleCheckout}
                disabled={cartData.items.length === 0}
              >
                Proceed to Checkout
              </button>
            </>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cartData={cartData}
        onPlaceOrder={handlePlaceOrder}
      />
    </>
  );
};

export default CartSidebar;