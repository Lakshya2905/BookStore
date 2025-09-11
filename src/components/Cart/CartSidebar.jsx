import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import styles from './CartSidebar.module.css';
import { CART_VIEW_URL,CART_ITEM_QUANTITY_URL } from '../../constants/apiConstants';

const CartSidebar = ({ isOpen, onClose, onCheckout }) => {
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingItems, setUpdatingItems] = useState(new Set());

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
    if (newQuantity <= 1) return;
    
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
        // Refresh cart data
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
      const response = await axios.post('/api/cart/remove', {
        user: user,
        token: token,
        bookCartId: bookCartId
      });

      if (response.data.statusResponse === 'SUCCESS') {
        // Refresh cart data
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

  // Handle checkout
  const handleCheckout = () => {
    if (cartData && cartData.items.length > 0) {
      onCheckout(cartData);
      onClose();
    }
  };

  // Fetch cart data when sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchCartData();
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
              {/* Cart Items */}
              <div className={styles.itemsContainer}>
                {cartData.items.map((item) => (
                  <div key={item.bookCartId} className={styles.cartItem}>
                    {/* Book Information */}
                    <div className={styles.itemInfo}>
                      <h4 className={styles.bookName}>{item.bookName}</h4>
                      <p className={styles.authorName}>by {item.authorName}</p>
                      <p className={styles.price}>{formatCurrency(item.price)} each</p>
                    </div>

                    {/* Controls Row - Tabular Layout */}
                    <div className={styles.controlsRow}>
                      {/* Quantity Section */}
                      <div className={styles.quantitySection}>
                        <span className={styles.quantityLabel}>Quantity:</span>
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

                      {/* Delete Button with Text and Icon */}
                      <button
                        className={styles.deleteButton}
                        onClick={() => removeItem(item.bookCartId)}
                        disabled={updatingItems.has(item.bookCartId)}
                        title="Remove item from cart"
                      >
                        🗑️
                        <span className={styles.deleteButtonText}>Remove</span>
                      </button>

                      {/* Item Total */}
                      <div className={styles.itemTotal}>
                        {formatCurrency(item.totalValue)}
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
    </>
  );
};

export default CartSidebar;