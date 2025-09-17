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

  // Load Bootstrap CSS and Icons
  useEffect(() => {
    const loadBootstrap = () => {
      if (document.getElementById('bootstrap-css')) return;
      const link = document.createElement('link');
      link.id = 'bootstrap-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
      document.head.appendChild(link);
    };

    const loadBootstrapIcons = () => {
      if (document.getElementById('bootstrap-icons')) return;
      const link = document.createElement('link');
      link.id = 'bootstrap-icons';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css';
      document.head.appendChild(link);
    };

    loadBootstrap();
    loadBootstrapIcons();
  }, []);

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
    <div className={`${styles.modalOverlay} modal-backdrop`}>
      <div className={`${styles.modalContainer} modal-dialog modal-dialog-centered`}>
        <div className={`${styles.modalContent} modal-content`}>
          {/* Modal Header */}
          <div className={`${styles.modalHeader} modal-header border-0`}>
            <div className={`${styles.logoContainer} w-100 text-center`}>
              <div className="d-flex align-items-center justify-content-center mb-3">
                <i className="bi bi-book-fill fs-1 text-primary me-3"></i>
                <h3 className="mb-0 fw-bold text-primary">ShahKart</h3>
              </div>
              <p className="text-muted mb-0">Welcome back! Please sign in to your account</p>
            </div>
            <button 
              type="button" 
              className={`${styles.closeBtn} btn-close position-absolute`}
              onClick={handleClose}
              aria-label="Close"
            >
              X
            </button>
          </div>

          {/* Modal Body */}
          <div className="modal-body px-4 pb-4">
            {/* Success Message */}
            {successMessage && (
              <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i>
                <div>{successMessage}</div>
              </div>
            )}

            {/* Error Message */}
            {formError.general && (
              <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{formError.general}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* User ID Input */}
              <div className="mb-4">
                <label htmlFor="userId" className="form-label fw-semibold">
                  <i className="bi bi-person-fill me-2 text-primary"></i>
                  Email or Mobile Number
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-envelope-fill text-primary"></i>
                  </span>
                  <input
                    type="text"
                    className={`form-control border-start-0 ${formError.userId ? 'is-invalid' : ''}`}
                    id="userId"
                    name="userId"
                    placeholder="Enter email or mobile number"
                    value={formData.userId}
                    onChange={handleChange}
                    autoComplete="username"
                  />
                  {formError.userId && (
                    <div className="invalid-feedback d-flex align-items-center">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>
                      {formError.userId}
                    </div>
                  )}
                </div>
              </div>

              {/* Password Input */}
              <div className="mb-4">
                <label htmlFor="password" className="form-label fw-semibold">
                  <i className="bi bi-lock-fill me-2 text-primary"></i>
                  Password
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-key-fill text-primary"></i>
                  </span>
                  <input
                    type="password"
                    className={`form-control border-start-0 ${formError.password ? 'is-invalid' : ''}`}
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  {formError.password && (
                    <div className="invalid-feedback d-flex align-items-center">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>
                      {formError.password}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="d-grid">
                <button 
                  type="submit" 
                  className={`${styles.loginBtn} btn btn-primary btn-lg py-3`}
                  disabled={loadingSubmit}
                >
                  {loadingSubmit ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Signing You In...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Login
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Footer Links */}
            <div className="text-center mt-4">
              <div className="mb-3">
                <span className="text-muted">New to ShahKart? </span>
                <button 
                  type="button"
                  className="btn btn-link p-0 fw-semibold text-decoration-none"
                  onClick={onSwitchToSignup}
                >
                  Create Account
                  <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </div>
              
              <button 
                type="button" 
                className="btn btn-link text-muted text-decoration-none fw-semibold"
              >
                <i className="bi bi-shield-lock me-1"></i>
                Forgot Password?
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;