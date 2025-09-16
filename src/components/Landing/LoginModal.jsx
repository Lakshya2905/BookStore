import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LOGIN_URL } from '../../constants/apiConstants';
import styles from './LoginModal.module.css';

const LoginModal = ({ isOpen, onClose, onSwitchToSignup }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    userId: '', // Changed from emailId to userId to match your API
    password: ''
  });

  const [formError, setFormError] = useState({});
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const resetForm = () => {
    setFormData({ userId: '', password: '' });
    setFormError({});
    setSuccessMessage("");
    setLoadingSubmit(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (formError[name]) {
      setFormError(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateEmail = (email) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  };

  const validateMobile = (mobile) => {
    const mobilePattern = /^[6-9]\d{9}$/; // Indian mobile number pattern
    return mobilePattern.test(mobile);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.userId) {
      errors.userId = "Email or mobile number is required.";
    } else {
      // Check if it's email or mobile
      const isEmail = formData.userId.includes('@');
      const isMobile = /^\d+$/.test(formData.userId);
      
      if (isEmail && !validateEmail(formData.userId)) {
        errors.userId = "Please enter a valid email address.";
      } else if (isMobile && !validateMobile(formData.userId)) {
        errors.userId = "Please enter a valid 10-digit mobile number.";
      } else if (!isEmail && !isMobile) {
        errors.userId = "Please enter a valid email or mobile number.";
      }
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }

    setFormError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setSuccessMessage("");
    setFormError({});

    if (!validateForm()) {
      setLoadingSubmit(false);
      return;
    }

    try {
      const response = await axios.get(LOGIN_URL, {
        params: {
          userId: formData.userId,
          password: formData.password
        }
      });

      if (response.data && response.data.status === 'SUCCESS') {
        const { user, token } = response.data.payload;
        
        // Store user data in sessionStorage
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('token', token);
          onClose();
        window.location.reload();
        
      } else {
        // Handle failed login
        const errorMessage = response.data?.message || "Invalid credentials. Please try again.";
        setFormError({ general: errorMessage });
      }
    } catch (err) {
      console.error('Login error:', err);
      
      let errorMessage = "Login failed. Please check your credentials and try again.";
      
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 401) {
          errorMessage = "Invalid email/mobile or password. Please try again.";
        } else if (err.response.status === 404) {
          errorMessage = "User not found. Please check your credentials.";
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        // Network error
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      setFormError({ general: errorMessage });
    } finally {
      setLoadingSubmit(false);
    
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${Object.keys(formError).length > 0 ? styles.modalWithErrors : ''}`}>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close modal">
          ×
        </button>
        
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>📚</span>
            <span className={styles.logoText}>ShahKart</span>
          </div>
        </div>

        {successMessage && (
          <div className={styles.successMessage} role="alert">
            ✅ {successMessage}
          </div>
        )}

        {formError.general && (
          <div className={styles.errorMessage} role="alert">
            ❌ {formError.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>📧</span>
            <input
              type="text"
              name="userId"
              placeholder="Enter email or mobile number"
              value={formData.userId}
              onChange={handleChange}
              className={`${styles.input} ${formError.userId ? styles.inputError : ''}`}
              autoComplete="username"
              aria-label="Email or Mobile Number"
              aria-describedby={formError.userId ? "userid-error" : undefined}
            />
            {formError.userId && (
              <div id="userid-error" className={styles.fieldErrorMessage} role="alert">
                ⚠️ {formError.userId}
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>🔑</span>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${formError.password ? styles.inputError : ''}`}
              autoComplete="current-password"
              aria-label="Password"
              aria-describedBy={formError.password ? "password-error" : undefined}
            />
            {formError.password && (
              <div id="password-error" className={styles.fieldErrorMessage} role="alert">
                ⚠️ {formError.password}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loadingSubmit}
            className={styles.submitButton}
          >
            {loadingSubmit ? "Signing You In..." : "🚀 Login"}
          </button>
        </form>

        <div className={styles.footer}>
          <span className={styles.switchText}>
            New to ShahKart?
            <button 
              type="button"
              className={styles.switchButton}
              onClick={onSwitchToSignup}
            >
              Create Account
            </button>
          </span>
          
          <button type="button" className={styles.forgotPassword}>
            🔐 Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;