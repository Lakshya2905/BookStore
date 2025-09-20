import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { REGISTER_URL } from '../../constants/apiConstants';
import styles from './SignupModal.module.css';

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
    const pattern = /^[6-9]\d{9}$/;
    return pattern.test(phone);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formError[name]) {
      setFormError(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name) {
      errors.name = "Full name is required.";
    } else if (!validateName(formData.name)) {
      errors.name = "Name must start with a capital letter.";
    }

    if (!formData.emailId) {
      errors.emailId = "Email is required.";
    } else if (!validateEmail(formData.emailId)) {
      errors.emailId = "Please enter a valid email address.";
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (!validatePassword(formData.password)) {
      errors.password = "Password must be at least 8 characters with uppercase, lowercase, number, and special character.";
    }

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

      if (response.data.status === 'SUCCESS') {
        setSuccessMessage("User registered successfully!");
        resetForm();
      } else {
        setFormError({ general: "Registration failed. Please try again." });
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = "User already exists with this email or mobile number.";
        } else if (error.response.status === 400) {
          errorMessage = "Please check your information and try again.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      setFormError({ general: errorMessage });
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalContent}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <button 
              type="button" 
              className={styles.closeBtn}
              onClick={handleClose}
              aria-label="Close"
            >
              <i className="bi bi-x"></i>
            </button>
            
            <div className={styles.logoSection}>
              <div className={styles.logoIcon}>
                <i className="bi bi-book-fill"></i>
              </div>
              <h2 className={styles.logoTitle}>ShahKart</h2>
              <p className={styles.logoSubtitle}>Create your account</p>
            </div>
          </div>

          {/* Body */}
          <div className={styles.modalBody}>
            {/* Success Message */}
            {successMessage && (
              <div className={`${styles.alert} ${styles.alertSuccess}`}>
                <i className="bi bi-check-circle-fill"></i>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {formError.general && (
              <div className={`${styles.alert} ${styles.alertError}`}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{formError.general}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Full Name */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <i className="bi bi-person-fill"></i>
                  Full Name
                </label>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    className={`${styles.input} ${formError.name ? styles.inputError : ''}`}
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                  <div className={styles.inputIcon}>
                    <i className="bi bi-person-circle"></i>
                  </div>
                </div>
                {formError.name && (
                  <div className={styles.errorMessage}>
                    <i className="bi bi-exclamation-circle-fill"></i>
                    {formError.name}
                  </div>
                )}
              </div>

              {/* Email and Mobile Row */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <i className="bi bi-envelope-fill"></i>
                    Email
                  </label>
                  <div className={styles.inputGroup}>
                    <input
                      type="email"
                      className={`${styles.input} ${formError.emailId ? styles.inputError : ''}`}
                      name="emailId"
                      placeholder="Enter email"
                      value={formData.emailId}
                      onChange={handleChange}
                      autoComplete="email"
                    />
                    <div className={styles.inputIcon}>
                      <i className="bi bi-at"></i>
                    </div>
                  </div>
                  {formError.emailId && (
                    <div className={styles.errorMessage}>
                      <i className="bi bi-exclamation-circle-fill"></i>
                      {formError.emailId}
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <i className="bi bi-phone-fill"></i>
                    Mobile
                  </label>
                  <div className={styles.inputGroup}>
                    <input
                      type="tel"
                      className={`${styles.input} ${formError.mobileNo ? styles.inputError : ''}`}
                      name="mobileNo"
                      placeholder="10-digit number"
                      value={formData.mobileNo}
                      onChange={handleChange}
                      autoComplete="tel"
                      maxLength="10"
                    />
                    <div className={styles.inputIcon}>
                      <i className="bi bi-telephone-fill"></i>
                    </div>
                  </div>
                  {formError.mobileNo && (
                    <div className={styles.errorMessage}>
                      <i className="bi bi-exclamation-circle-fill"></i>
                      {formError.mobileNo}
                    </div>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <i className="bi bi-lock-fill"></i>
                  Password
                </label>
                <div className={styles.inputGroup}>
                  <input
                    type="password"
                    className={`${styles.input} ${formError.password ? styles.inputError : ''}`}
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <div className={styles.inputIcon}>
                    <i className="bi bi-key-fill"></i>
                  </div>
                </div>
                {formError.password && (
                  <div className={styles.errorMessage}>
                    <i className="bi bi-exclamation-circle-fill"></i>
                    {formError.password}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className={`${styles.submitBtn} ${loadingSubmit ? styles.loading : ''}`}
                disabled={loadingSubmit}
              >
                {loadingSubmit ? (
                  <>
                    <div className={styles.spinner}></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus"></i>
                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className={styles.footer}>
              <p className={styles.footerText}>
                Already have an account? 
                <button 
                  type="button"
                  className={styles.linkBtn}
                  onClick={onSwitchToLogin}
                >
                  Sign In
                </button>
              </p>
              
              <div className={styles.termsText}>
                <i className="bi bi-shield-check"></i>
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