import React, { useState, useEffect } from 'react';
import { postApiWithAuth } from '../../constants/PostMethod';
import { REGISTER_URL } from '../../constants/apiConstants';
import styles from './SignupModal.module.css';

const SignupModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  
  const [formError, setFormError] = useState({});
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    emailId: '',
    password: '',
    mobileNo: ''
  });

  // Reset form when modal is closed
  const resetForm = () => {
    setFormData({
      fullName: '',
      emailId: '',
      password: '',
      mobileNo: ''
    });
    setFormError({});
    setSuccessMessage("");
    setShowSuccessModal(false);
    setLoadingSubmit(false);
  };

  // Handle modal close with form reset
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Auto-close modal after 3 seconds when success message is shown
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    validateField(name, value);
  };

  const validateField = (name, value) => {
    let errorMessage = "";

    if (name === "emailId") {
      if (!validateEmail(value)) {
        errorMessage = "Email must be in the format: example@gmail.com";
      }
    } else if (name === "password") {
      if (!validatePassword(value)) {
        errorMessage = "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.";
      }
    } else if (name === "fullName") {
      if (!validateName(value)) {
        errorMessage = "Name must start with a capital letter.";
      }
    } else if (name === "mobileNo") {
      if (!validatePhoneNumber(value)) {
        errorMessage = "Phone Number must be exactly 10 digits.";
      }
    }

    setFormError((prevErrors) => ({
      ...prevErrors,
      [name]: errorMessage,
    }));
  };

  const validateEmail = (emailId) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; 
    return emailPattern.test(emailId);
  };

  const validatePassword = (password) => {
    const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/;
    return passwordPattern.test(password);
  };

  const validateName = (name) => {
    return name.charAt(0) === name.charAt(0).toUpperCase();
  };

  const validatePhoneNumber = (mobileNo) => {
    const phonePattern = /^\d{10}$/; // 10 digits
    return phonePattern.test(mobileNo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setSuccessMessage("");

    const errors = {};
    
    // Validate all fields
    Object.keys(formData).forEach((key) => {
      if (!formData[key]) {
        errors[key] = "This field is required.";
      } else {
        validateField(key, formData[key]);
      }
    });

    // Check if there are any current validation errors
    const currentErrors = { ...formError };
    delete currentErrors.general; // Remove general errors
    
    // Check if form has errors (either from existing formError or new errors)
    if (Object.values(currentErrors).some(error => error !== "") || Object.keys(errors).length > 0) {
      setFormError(prev => ({ ...prev, ...errors }));
      setLoadingSubmit(false);
      return;
    }

    try {
      // Prepare user data matching backend User model
      const userData = {
        fullName: formData.fullName,
        emailId: formData.emailId, // Map emailId to email for backend
        password: formData.password,
        mobileNo: formData.mobileNo
      };

      console.log(REGISTER_URL)

      // Call the register API
      const response = await postApiWithAuth(REGISTER_URL, userData);
      
      // Handle successful registration
      if (response.data) {
        setSuccessMessage("User registered successfully! Please contact admin for account activation.");
        setShowSuccessModal(true);
        setFormData({
          fullName: "",
          emailId: "",
          password: "",
          mobileNo: "", 
        });
        // Clear errors after successful submission
        setFormError({});
      }
    } catch (err) {
      // Handle API errors
      let errorMessage = "Registration failed. Please try again.";
      
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.error) {
        errorMessage = err.error;
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
        <button className={styles.closeButton} onClick={handleClose}>
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
          <div className={styles.successMessage}>{successMessage}</div>
        )}

        {/* General Error Message */}
        {formError.general && (
          <div className={styles.errorMessage}>{formError.general}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>👤</span>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className={`${styles.input} ${formError.fullName ? styles.inputError : ''}`}
              required
            />
            {formError.fullName && (
              <div className={styles.fieldErrorMessage}>{formError.fullName}</div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>📧</span>
            <input
              type="email"
              name="emailId"
              placeholder="Email"
              value={formData.emailId}
              onChange={handleChange}
              className={`${styles.input} ${formError.emailId ? styles.inputError : ''}`}
              required
            />
            {formError.emailId && (
              <div className={styles.fieldErrorMessage}>{formError.emailId}</div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>🔑</span>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${formError.password ? styles.inputError : ''}`}
              minLength="6"
              required
            />
            {formError.password && (
              <div className={styles.fieldErrorMessage}>{formError.password}</div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>📱</span>
            <input
              type="tel"
              name="mobileNo"
              placeholder="Phone Number"
              value={formData.mobileNo}
              onChange={handleChange}
              className={`${styles.input} ${formError.mobileNo ? styles.inputError : ''}`}
              required
            />
            {formError.mobileNo && (
              <div className={styles.fieldErrorMessage}>{formError.mobileNo}</div>
            )}
          </div>

          <button
            type="submit"
            disabled={loadingSubmit}
            className={styles.submitButton} 
          >
            {loadingSubmit ? "Loading..." : "Register"}
          </button>
        </form>

        <div className={styles.footer}>
          <span className={styles.switchText}>
            Already have an Account?
            <button 
              className={styles.switchButton}
              onClick={onSwitchToLogin}
            >
              Login
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;