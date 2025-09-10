import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGIN_URL } from '../../constants/apiConstants';
import styles from './LoginModal.module.css';
// import { getApiWithAuth } from '../../utils/apiUtils'; // Make sure this utility exists

const LoginModal = ({ isOpen, onClose, onSwitchToSignup }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    emailId: '',
    password: ''
  });

  const [formError, setFormError] = useState({});
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const resetForm = () => {
    setFormData({ emailId: '', password: '' });
    setFormError({});
    setSuccessMessage("");
    setLoadingSubmit(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (successMessage && successMessage.includes("Login successful")) {
      const timer = setTimeout(() => {
        resetForm();
        onClose();
        navigate('/user-dashboard');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [successMessage, navigate, onClose]);

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

  const validateEmail = (emailId) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(emailId);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.emailId) {
      errors.emailId = "Email is required.";
    } else if (!validateEmail(formData.emailId)) {
      errors.emailId = "Please enter a valid email address.";
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
      const loginParams = {
        emailId: formData.emailId,
        password: formData.password
      };

      console.log('Attempting login with:', loginParams);

      // Replace with your actual login API call
      // Example: const response = await getApiWithAuth(LOGIN_URL, loginParams);

      // Mocked response for now
      const response = {
        data: {
          status: 'success',
          payload: {
            user: { role: 'USER', name: 'Test User' },
            token: 'mockedToken123'
          }
        }
      };

      if (response.data && response.data.status === 'success') {
        sessionStorage.setItem('user', JSON.stringify(response.data.payload.user));
        sessionStorage.setItem('token', response.data.payload.token);
        sessionStorage.setItem('role', response.data.payload.user.role);
        setSuccessMessage("Login successful! Redirecting to dashboard...");
      } else {
        const errorMessage = response.data?.message || "Invalid email or password. Please try again.";
        setFormError({ general: errorMessage });
      }
    } catch (err) {
      let errorMessage = "Login failed. Please check your credentials and try again.";
      if (err.message) errorMessage = err.message;
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
              type="email"
              name="emailId"
              placeholder="Enter your email address"
              value={formData.emailId}
              onChange={handleChange}
              className={`${styles.input} ${formError.emailId ? styles.inputError : ''}`}
              autoComplete="email"
              aria-label="Email address"
              aria-describedby={formError.emailId ? "email-error" : undefined}
            />
            {formError.emailId && (
              <div id="email-error" className={styles.fieldErrorMessage} role="alert">
                ⚠️ {formError.emailId}
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
              aria-describedby={formError.password ? "password-error" : undefined}
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
            New to CodeGram?
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
