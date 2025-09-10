import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiWithAuth } from '../../constants/GetMethod';
import { LOGIN_URL } from '../../constants/apiConstants';
import styles from './LoginModal.module.css';

const LoginModal = ({ isOpen, onClose, onSwitchToSignup }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    emailId: '',
    password: ''
  });
  
  const [formError, setFormError] = useState({});
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Reset form when modal is closed
  const resetForm = () => {
    setFormData({
      emailId: '',
      password: ''
    });
    setFormError({});
    setSuccessMessage("");
    setLoadingSubmit(false);
  };

  // Handle modal close with form reset
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Auto-redirect after successful login
  useEffect(() => {
    if (successMessage && successMessage.includes("Login successful")) {
      console.log('Success message detected, preparing to redirect...');
      const timer = setTimeout(() => {
        console.log('Redirecting to /user-dashboard...');
        resetForm();
        onClose(); // Close the modal first
        navigate('/user-dashboard'); // Use replace to prevent back navigation
      }, 1500); // Shorter delay for login redirect

      return () => {
        console.log('Cleaning up redirect timer');
        clearTimeout(timer);
      };
    }
  }, [successMessage, navigate, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear field-specific error when user starts typing
    if (formError[name]) {
      setFormError(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateEmail = (emailId) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(emailId);
  };

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.emailId) {
      errors.emailId = "Email is required.";
    } else if (!validateEmail(formData.emailId)) {
      errors.emailId = "Please enter a valid email address.";
    }

    // Password validation
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

    // Validate form
    if (!validateForm()) {
      setLoadingSubmit(false);
      return;
    }

    try {
      // Prepare login parameters for GET request
      const loginParams = {
        emailId: formData.emailId,
        password: formData.password
      };

      console.log('Attempting login with:', loginParams);

      // Call the login API using GET request with params
      const response = await getApiWithAuth(LOGIN_URL, loginParams);
      
      if (response.data && response.data.status === 'success') {
        console.log('Login successful:', response.data);
        sessionStorage.setItem('user', JSON.stringify(response.data.payload.user));
        sessionStorage.setItem('token', response.data.payload.token);
        sessionStorage.setItem('role', response.data.payload.user.role);
        setSuccessMessage("Login successful! Redirecting to dashboard...");
        
      } else {
        // Handle unsuccessful login (wrong credentials)
        console.log('Login failed:', response.data);
        const errorMessage = response.data?.message || response.data?.responseMessage || "Invalid email or password. Please try again.";
        setFormError({ general: errorMessage });
      }
      
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle API errors
      let errorMessage = "Login failed. Please check your credentials and try again.";
      
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.error) {
        errorMessage = err.error;
      } else if (err.responseMessage) {
        errorMessage = err.responseMessage;
      } else if (err.data && err.data.message) {
        errorMessage = err.data.message;
      } else if (err.data && err.data.responseMessage) {
        errorMessage = err.data.responseMessage;
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
            <span className={styles.logoIcon}>🎓</span>
            <span className={styles.logoText}>CodeGram</span>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className={styles.successMessage} role="alert">
            <strong>✅ {successMessage}</strong>
          </div>
        )}

        {/* General Error Message */}
        {formError.general && (
          <div className={styles.errorMessage} role="alert">
            <strong>❌ {formError.general}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon} aria-hidden="true">📧</span>
            <input
              type="email"
              name="emailId"
              placeholder="Enter your email address"
              value={formData.emailId}
              onChange={handleChange}
              className={`${styles.input} ${formError.emailId ? styles.inputError : ''}`}
              required
              autoComplete="email"
              aria-label="Email address"
              aria-describedby={formError.emailId ? "email-error" : undefined}
            />
            {formError.emailId && (
              <div 
                id="email-error" 
                className={styles.fieldErrorMessage}
                role="alert"
              >
                ⚠️ {formError.emailId}
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon} aria-hidden="true">🔑</span>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${formError.password ? styles.inputError : ''}`}
              required
              autoComplete="current-password"
              aria-label="Password"
              aria-describedby={formError.password ? "password-error" : undefined}
            />
            {formError.password && (
              <div 
                id="password-error" 
                className={styles.fieldErrorMessage}
                role="alert"
              >
                ⚠️ {formError.password}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loadingSubmit}
            className={styles.submitButton}
            aria-label={loadingSubmit ? "Logging in, please wait" : "Login to your account"}
          >
            {loadingSubmit ? "Signing You In..." : "🚀 Login"}
          </button>
        </form>

        <div className={styles.footer}>
          <span className={styles.switchText}>
            New to CodeGram?
            <button 
              type="button"
              className={styles.switchButton}
              onClick={onSwitchToSignup}
              aria-label="Switch to registration form"
            >
              Create Account
            </button>
          </span>
          
          <button 
            type="button"
            className={styles.forgotPassword}
            aria-label="Reset your password"
          >
            🔐 Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;