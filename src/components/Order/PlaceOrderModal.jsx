import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './PlaceOrderModal.module.css';
import { BOOK_CHECKOUT_URL, BOOK_INFORMATION_URL } from '../../constants/apiConstants';


const PlaceOrderModal = ({ isOpen, onClose, bookId}) => {
  const [bookInfo, setBookInfo] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    deliveryAddress: '',
    city: '',
    state: '',
    pincode: '',
    mobileNo: ''
  });
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


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
  
  
  
  useEffect(() => {
   
    if (isOpen && bookId) {

const {user,token}=getUserData();
    if (!user || !token) {
      window.dispatchEvent(new Event("openLoginModal"));
      onClose();
      return; // ✅ Fixed: Don't return anything, or return undefined
    }

      fetchBookInfo();
    }
  }, [isOpen, bookId]);




  const fetchBookInfo = async () => {
    
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${BOOK_INFORMATION_URL}?bookId=${bookId}`);
      if (response.data && response.data.status=='SUCCESS') {
        setBookInfo(response.data.payload);
      } else {
        setError('Failed to fetch book information');
      }
    } catch (err) {
      setError('Error fetching book information: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!customerInfo.deliveryAddress.trim()) {
      setError('Delivery address is required');
      return false;
    }
    if (!customerInfo.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!customerInfo.state.trim()) {
      setError('State is required');
      return false;
    }
    if (!customerInfo.pincode || customerInfo.pincode.toString().length !== 6) {
      setError('Pincode must be 6 digits');
      return false;
    }
    if (!customerInfo.mobileNo || customerInfo.mobileNo.length !== 10) {
      setError('Mobile number must be 10 digits');
      return false;
    }
    if (quantity < 1) {
      setError('Quantity must be at least 1');
      return false;
    }
    return true;
  };


  const handlePlaceOrder = async () => {
    setError('');
    setSuccess('');

    // Get user data from sessionStorage
    const { user, token } = getUserData();
    
    if (!user || !token) {
      setError('Please login to place an order');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setOrderLoading(true);
    try {
      const orderData = {
        user: user,
        token: token,
        customerInfoDto: {
          ...customerInfo,
          pincode: parseInt(customerInfo.pincode)
        },
        bookId: bookId,
        quantity: quantity
      };

      const response = await axios.post(`${BOOK_CHECKOUT_URL}`, orderData);
      
      if (response.data && response.data.status == 'SUCCESS') {
        setSuccess('Order placed successfully!');
        setTimeout(() => {
          onClose();
          // Reset form
          setQuantity(1);
          setCustomerInfo({
            deliveryAddress: '',
            city: '',
            state: '',
            pincode: '',
            mobileNo: ''
          });
          setSuccess('');
        }, 2000);
      } else {
        setError(response.data?.message || 'Failed to place order');
      }
    } catch (err) {
      setError('Error placing order: ' + (err.response?.data?.message || err.message));
    } finally {
      setOrderLoading(false);
    }
  };

  const calculateTotal = () => {
    return bookInfo && bookInfo.price ? (bookInfo.price * quantity).toFixed(2) : '0.00';
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <span className={styles.icon}>📦</span>
            Place Order
          </h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              Loading book information...
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.success}>
              <span className={styles.successIcon}>✅</span>
              {success}
            </div>
          )}

          {bookInfo && !loading && (
            <>
              {/* Order Summary Table */}
              <div className={styles.orderSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>📚</span>
                  Order Summary
                </h3>
                <div className={styles.orderTable}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Item Details</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={styles.itemDetails}>
                          <div className={styles.bookTitle}>{bookInfo.bookName}</div>
                          <div className={styles.bookMeta}>
                            <span className={styles.author}>by {bookInfo.authorName}</span>
                            <span className={styles.category}>{bookInfo.category}</span>
                          </div>
                          {bookInfo.description && (
                            <div className={styles.description}>{bookInfo.description}</div>
                          )}
                        </td>
                        <td className={styles.price}>₹{bookInfo.price}</td>
                        <td className={styles.quantityCell}>
                          <div className={styles.quantityControl}>
                            <button 
                              type="button"
                              className={styles.quantityBtn}
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                              className={styles.quantityInput}
                            />
                            <button 
                              type="button"
                              className={styles.quantityBtn}
                              onClick={() => setQuantity(quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className={styles.total}>₹{calculateTotal()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Information */}
              <div className={styles.customerSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>🚚</span>
                  Delivery Information
                </h3>
                <div className={styles.customerForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.labelText}>Delivery Address</span>
                      <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      value={customerInfo.deliveryAddress}
                      onChange={(e) => handleCustomerInfoChange('deliveryAddress', e.target.value)}
                      className={styles.textarea}
                      rows="3"
                      placeholder="Enter your complete delivery address"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        <span className={styles.labelText}>City</span>
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        value={customerInfo.city}
                        onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                        className={styles.input}
                        placeholder="Enter city"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        <span className={styles.labelText}>State</span>
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        value={customerInfo.state}
                        onChange={(e) => handleCustomerInfoChange('state', e.target.value)}
                        className={styles.input}
                        placeholder="Enter state"
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        <span className={styles.labelText}>Pincode</span>
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        maxLength="6"
                        value={customerInfo.pincode}
                        onChange={(e) => handleCustomerInfoChange('pincode', e.target.value.replace(/\D/g, ''))}
                        className={styles.input}
                        placeholder="6 digit pincode"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        <span className={styles.labelText}>Mobile Number</span>
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        maxLength="10"
                        value={customerInfo.mobileNo}
                        onChange={(e) => handleCustomerInfoChange('mobileNo', e.target.value.replace(/\D/g, ''))}
                        className={styles.input}
                        placeholder="10 digit mobile number"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Total */}
              <div className={styles.finalTotal}>
                <div className={styles.totalAmount}>
                  <span className={styles.totalLabel}>Total Amount:</span>
                  <span className={styles.totalValue}>₹{calculateTotal()}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          {!orderLoading && !success && !error && (
            <>
              <button
                className={styles.cancelButton}
                onClick={onClose}
                disabled={orderLoading}
              >
                Cancel
              </button>
              <button
                className={styles.placeOrderButton}
                onClick={handlePlaceOrder}
                disabled={orderLoading || loading || !bookInfo}
              >
                <span className={styles.buttonIcon}>🛒</span>
                Place Order
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceOrderModal;