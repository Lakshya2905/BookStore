import React, { useState, useRef } from 'react';
import axios from 'axios';
import styles from './AddCategory.module.css';
import { ADD_DISCOVERY_IMAGE } from '../../constants/apiConstants';

const AddDiscoveryImage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [linkOfProduct, setLinkOfProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const fileInputRef = useRef(null);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setMessage('Please select only JPEG, JPG, or PNG files');
        setMessageType('error');
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setMessage('File size should be less than 5MB');
        setMessageType('error');
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }

      setSelectedFile(file);
      setMessage('');
      setMessageType('');

      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputClick = () => {
    if (fileInputRef.current && !loading) {
      fileInputRef.current.click();
    }
  };

  const handleLinkChange = (e) => {
    setLinkOfProduct(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setMessage('Please select an image to upload');
      setMessageType('error');
      return;
    }

    const { user, token } = getUserData();
    if (!user || !token) {
      setMessage('User authentication required. Please login again.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const formData = new FormData();
      const requestBody = { 
        user: user, 
        token: token,
        linkOfProduct: linkOfProduct.trim() || null
      };

      formData.append('requestBody', new Blob([JSON.stringify(requestBody)], {
        type: 'application/json'
      }));

      formData.append('file', selectedFile);

      const response = await axios.post(`${ADD_DISCOVERY_IMAGE}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.status === 'SUCCESS') {
        setMessage('Image uploaded successfully!');
        setMessageType('success');
        setSelectedFile(null);
        setFilePreview(null);
        setLinkOfProduct('');

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setMessage(response.data?.message || 'Failed to upload image');
        setMessageType('error');
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response) {
        setMessage(error.response.data?.message || 'Server error occurred');
      } else if (error.request) {
        setMessage('Network error. Please check your connection.');
      } else {
        setMessage('An unexpected error occurred');
      }
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setLinkOfProduct('');
    setMessage('');
    setMessageType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Add Discovery Image</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Link of Product (Optional)</label>
            <input
              type="url"
              value={linkOfProduct}
              onChange={handleLinkChange}
              placeholder="https://example.com/product"
              className={styles.input}
              disabled={loading}
            />
            <small className={styles.helpText}>
              Enter a product link if you want to associate this image with a specific product
            </small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Select Image</label>
            <div className={styles.fileInputWrapper}>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".jpeg,.jpg,.png,image/jpeg,image/jpg,image/png"
                className={styles.fileInput}
                disabled={loading}
              />
              <div
                className={styles.fileInputLabel}
                onClick={handleFileInputClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFileInputClick();
                  }
                }}
              >
                <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,5 17,10" />
                  <line x1="12" y1="5" x2="12" y2="15" />
                </svg>
                {selectedFile ? selectedFile.name : 'Choose image file (JPEG, JPG, PNG)'}
              </div>
            </div>
          </div>

          {filePreview && (
            <div className={styles.previewContainer}>
              <label className={styles.label}>Preview:</label>
              <img src={filePreview} alt="Preview" className={styles.preview} />
            </div>
          )}

          {message && (
            <div className={`${styles.message} ${styles[messageType]}`}>
              {message}
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={`${styles.button} ${styles.submitButton}`}
              disabled={loading}
            >
              {loading ? <div className={styles.spinner}></div> : 'Upload Image'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className={`${styles.button} ${styles.resetButton}`}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDiscoveryImage;