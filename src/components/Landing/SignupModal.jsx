import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { REGISTER_URL } from '../../constants/apiConstants';
import styles from './SignupModal.module.css'; // New separate CSS file

const SignupModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [formError, setFormError] = useState({});
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    name: '',
    emailId: '',
    password: '',
    mobileNo: ''
  });

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

  // Reset form on close
  const resetForm = () => {
    setFormData({
      name: '',
      emailId: '',
      password: '',
      mobileNo: ''
    });
    setFormError({});
    setSuccessMessage("");
    setLoadingSubmit(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Auto close modal 3 seconds after success
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const validateEmail = (email) => {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email);
  };

  const validatePassword = (password) => {
    const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/;
    return pattern.test(password);
  };

  const validateName = (name) => {
    return name && name.trim().length > 0 && name[0] === name[0].toUpperCase();
  };

  const validatePhoneNumber = (phone) => {
    const pattern = /^[6-9]\d{9}$/; // Indian mobile number pattern
    return pattern.test(phone);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formError[name]) {
      setFormError(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name) {
      errors.name = "Full name is required.";
    } else if (!validateName(formData.name)) {
      errors.name = "Name must start with a capital letter.";
    }

    // Email validation
    if (!formData.emailId) {
      errors.emailId = "Email is required.";
    } else if (!validateEmail(formData.emailId)) {
      errors.emailId = "Please enter a valid email address.";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (!validatePassword(formData.password)) {
      errors.password = "Password must be at least 8 characters with uppercase, lowercase, number, and special character.";
    }

    // Mobile number validation
    if (!formData.mobileNo) {
      errors.mobileNo = "Mobile number is required.";
    } else if (!validatePhoneNumber(formData.mobileNo)) {
      errors.mobileNo = "Please enter a valid 10-digit mobile number.";
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
      const response = await axios.post(REGISTER_URL, formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Check if response indicates success
      if (response.data.status=='SUCCESSS') {
        setSuccessMessage("User registered successfully!S");
        resetForm();
      } else {
        setFormError({ general: "Registration failed. Please try again." });
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 409) {
          errorMessage = "User already exists with this email or mobile number.";
        } else if (error.response.status === 400) {
          errorMessage = "Please check your information and try again.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
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
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="bi bi-book-fill text-primary me-2"></i>
                <h3 className="mb-0 fw-bold text-primary">ShahKart</h3>
              </div>
              <p className="text-muted mb-0">Create your ShahKart account</p>
            </div>
            <button 
              type="button" 
              className={`${styles.closeBtn} btn-close position-absolute`}
              onClick={handleClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            {/* Success Message */}
            {successMessage && (
              <div className="alert alert-success d-flex align-items-center mb-3" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i>
                <div>{successMessage}</div>
              </div>
            )}

            {/* Error Message */}
            {formError.general && (
              <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{formError.general}</div>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Full Name Input */}
              <div className={`${styles.formGroup} form-group`}>
                <label htmlFor="name" className="form-label">
                  <i className="bi bi-person-fill me-2 text-primary"></i>
                  Full Name
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-person-circle text-primary"></i>
                  </span>
                  <input
                    type="text"
                    className={`form-control border-start-0 ${formError.name ? 'is-invalid' : ''}`}
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                  {formError.name && (
                    <div className="invalid-feedback d-flex align-items-center">
                      <i className="bi bi-exclamation-circle-fill me-1"></i>
                      {formError.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Email and Phone Row */}
              <div className={`${styles.formRow} form-row`}>
                {/* Email Input */}
                <div className={`${styles.formGroup} form-group`}>
                  <label htmlFor="emailId" className="form-label">
                    <i className="bi bi-envelope-fill me-2 text-primary"></i>
                    Email
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-at text-primary"></i>
                    </span>
                    <input
                      type="email"
                      className={`form-control border-start-0 ${formError.emailId ? 'is-invalid' : ''}`}
                      id="emailId"
                      name="emailId"
                      placeholder="Enter email"
                      value={formData.emailId}
                      onChange={handleChange}
                      autoComplete="email"
                    />
                    {formError.emailId && (
                      <div className="invalid-feedback d-flex align-items-center">
                        <i className="bi bi-exclamation-circle-fill me-1"></i>
                        {formError.emailId}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Number Input */}
                <div className={`${styles.formGroup} form-group`}>
                  <label htmlFor="mobileNo" className="form-label">
                    <i className="bi bi-phone-fill me-2 text-primary"></i>
                    Mobile
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-telephone-fill text-primary"></i>
                    </span>
                    <input
                      type="tel"
                      className={`form-control border-start-0 ${formError.mobileNo ? 'is-invalid' : ''}`}
                      id="mobileNo"
                      name="mobileNo"
                      placeholder="10-digit number"
                      value={formData.mobileNo}
                      onChange={handleChange}
                      autoComplete="tel"
                      maxLength="10"
                    />
                    {formError.mobileNo && (
                      <div className="invalid-feedback d-flex align-items-center">
                        <i className="bi bi-exclamation-circle-fill me-1"></i>
                        {formError.mobileNo}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className={`${styles.formGroup} form-group`}>
                <label htmlFor="password" className="form-label">
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
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
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
                  className={`${styles.loginBtn} btn btn-primary btn-lg`}
                  disabled={loadingSubmit}
                >
                  {loadingSubmit ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Footer Links */}
            <div className={`${styles.footerLinks} text-center`}>
              <div className="mb-2">
                <span className="text-muted">Already have an account? </span>
                <button 
                  type="button"
                  className="btn btn-link p-0 fw-semibold text-decoration-none"
                  onClick={onSwitchToLogin}
                >
                  Sign In
                  <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </div>
              
              <div className={`${styles.footerText} text-muted small`}>
                <i className="bi bi-shield-check me-1"></i>
                By creating an account, you agree to our Terms of Service
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;