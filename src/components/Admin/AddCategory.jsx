import React, { useState, useRef } from 'react';
import axios from 'axios';
import styles from './AddCategory.module.css';
import { BOOK_CATEGORIES_ADD_URL } from '../../constants/apiConstants';

const AddCategory = () => {
  const [categoryName, setCategoryName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  // Create a ref for the file input
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
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setMessage('Please select only JPEG, JPG, or PNG files');
        setMessageType('error');
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }

      // Validate file size (optional - 5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
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

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to handle file input label click
  const handleFileInputClick = () => {
    if (fileInputRef.current && !loading) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!categoryName.trim()) {
    setMessage('Please enter a category name');
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
    
    // Create the request body object
    const requestBody = {
      user: user,
      token: token,
      category: categoryName.trim()
    };
    
    // Add the request body as a Blob with correct content type
    formData.append('requestBody', new Blob([JSON.stringify(requestBody)], {
      type: 'application/json'
    }));
    
    // Add file if selected
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    const response = await axios.post(`${BOOK_CATEGORIES_ADD_URL}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data && response.data.status === 'SUCCESS') {
      setMessage('Category added successfully!');
      setMessageType('success');
      
      // Reset form
      setCategoryName('');
      setSelectedFile(null);
      setFilePreview(null);
      
      // Reset file input using ref
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } else {
      setMessage(response.data?.message || 'Failed to add category');
      setMessageType('error');
    }

  } catch (error) {
    console.error('Error adding category:', error);
    
    if (error.response) {
      // Server responded with error status
      setMessage(error.response.data?.message || 'Server error occurred');
    } else if (error.request) {
      // Request was made but no response received
      setMessage('Network error. Please check your connection.');
    } else {
      // Something else happened
      setMessage('An unexpected error occurred');
    }
    setMessageType('error');
  } finally {
    setLoading(false);
  }
};

  const handleReset = () => {
    setCategoryName('');
    setSelectedFile(null);
    setFilePreview(null);
    setMessage('');
    setMessageType('');
    
    // Reset file input using ref
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Add New Category</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="category-name" className={styles.label}>
              Category Name <span className={styles.required}>*</span>
            </label>
            <input
              id="category-name"
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter category name"
              className={styles.input}
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Category Image
            </label>
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
              <img 
                src={filePreview} 
                alt="Category preview" 
                className={styles.preview}
              />
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
              {loading ? (
                <div className={styles.spinner}></div>
              ) : (
                'Add Category'
              )}
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

export default AddCategory;