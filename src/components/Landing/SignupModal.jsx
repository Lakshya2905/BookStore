import React, { useState, useEffect } from 'react';
import { REGISTER_URL } from '../../constants/apiConstants';
import styles from './SignupModal.module.css';

const SignupModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [formError, setFormError] = useState({});
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    fullName: '',
    emailId: '',
    password: '',
    mobileNo: ''
  });

  // Reset form on close
  const resetForm = () => {
    setFormData({
      fullName: '',
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
    return name && name[0] === name[0].toUpperCase();
  };

  const validatePhoneNumber = (phone) => {
    const pattern = /^\d{10}$/;
    return pattern.test(phone);
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "fullName":
        if (!validateName(value)) error = "Name must start with a capital letter.";
        break;
      case "emailId":
        if (!validateEmail(value)) error = "Email must be in the format: example@gmail.com";
        break;
      case "password":
        if (!validatePassword(value)) error = "Password must be at least 8 characters with uppercase, lowercase, number, and special char.";
        break;
      case "mobileNo":
        if (!validatePhoneNumber(value)) error = "Phone Number must be exactly 10 digits.";
        break;
      default:
        break;
    }
    setFormError(prev => ({ ...prev, [name]: error }));
    return error === "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Validate on change
    if (formError[name]) validateField(name, value);
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    for (const [key, value] of Object.entries(formData)) {
      if (!value) {
        errors[key] = "This field is required.";
        isValid = false;
      } else if (!validateField(key, value)) {
        isValid = false;
      }
    }
    setFormError(errors);
    return isValid;
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
      const response = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        // Try to parse error message from server response
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.message || errorData?.error || "Registration failed. Please try again.";
        setFormError({ general: errMsg });
      } else {
        setSuccessMessage("User registered successfully! Please contact admin for account activation.");
        resetForm();
      }
    } catch (error) {
      setFormError({ general: "Network error. Please try again later." });
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

        {successMessage && <div className={styles.successMessage} role="alert">{successMessage}</div>}
        {formError.general && <div className={styles.errorMessage} role="alert">{formError.general}</div>}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
              aria-invalid={!!formError.fullName}
              aria-describedby={formError.fullName ? "fullname-error" : undefined}
            />
            {formError.fullName && <div id="fullname-error" className={styles.fieldErrorMessage} role="alert">{formError.fullName}</div>}
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
              aria-invalid={!!formError.emailId}
              aria-describedby={formError.emailId ? "email-error" : undefined}
            />
            {formError.emailId && <div id="email-error" className={styles.fieldErrorMessage} role="alert">{formError.emailId}</div>}
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
              required
              aria-invalid={!!formError.password}
              aria-describedby={formError.password ? "password-error" : undefined}
            />
            {formError.password && <div id="password-error" className={styles.fieldErrorMessage} role="alert">{formError.password}</div>}
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
              aria-invalid={!!formError.mobileNo}
              aria-describedby={formError.mobileNo ? "phone-error" : undefined}
            />
            {formError.mobileNo && <div id="phone-error" className={styles.fieldErrorMessage} role="alert">{formError.mobileNo}</div>}
          </div>

          <button
            type="submit"
            disabled={loadingSubmit}
            className={styles.submitButton}
            aria-busy={loadingSubmit}
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
              type="button"
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
