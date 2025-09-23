import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './BookImageEditModal.module.css';
import { 
  BOOK_IMAGE_FETCH_URL,
  BOOK_IMAGE_LIST_FETCH_URL,
  BOOK_COVER_IMAGE_ADD_URL,
  BOOK_SECONDARY_IMAGE_ADD_URL,
  BOOK_IMAGE_DELETE_URL 
} from '../../constants/apiConstants';

const BookImageEditModal = ({ bookId, bookName, onClose }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imageLoadErrors, setImageLoadErrors] = useState(new Set());

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

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Fetch all images for the book
  const fetchImages = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await axios.get(BOOK_IMAGE_LIST_FETCH_URL, {
        params: { bookId }
      });
      
      if (response.data && response.data.status === 'SUCCESS') {
        setImages(response.data.payload || []);
        setImageLoadErrors(new Set()); // Reset image load errors
        if (response.data.message && response.data.message.length === 0) {
          showMessage('info', 'No images found for this book');
        }
      } else {
        showMessage('error', response.data.message || 'Failed to fetch images');
        setImages([]);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      showMessage('error', 'Failed to fetch images. Please try again.');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete an image
  const deleteImage = async (imageId, fileName) => {
    const { user, token } = getUserData();
    if (!user || !token) {
      showMessage('error', 'User not authenticated');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      const formData = new FormData();
      const requestBody = {
        user,
        token,
        imageId
      };
      formData.append('requestBody', new Blob([JSON.stringify(requestBody)], {
        type: 'application/json'
      }));
      
      // Adding an empty file to match the expected backend structure
      formData.append('file', new File([''], 'dummy.txt', { type: 'text/plain' }));

      const response = await axios.post(BOOK_IMAGE_DELETE_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status === 'SUCCESS') {
        showMessage('success', 'Image deleted successfully');
        fetchImages(); // Refresh the list
      } else {
        showMessage('error', response.data.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showMessage('error', 'Failed to delete image. Please try again.');
    }
  };

  // Upload image (cover or secondary)
  const uploadImage = async () => {
    const { user, token } = getUserData();
    if (!user || !token) {
      showMessage('error', 'User not authenticated');
      return;
    }

    if (!selectedFile) {
      showMessage('error', 'Please select a file to upload');
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      const requestBody = {
        user,
        token,
        bookId
      };
      formData.append('requestBody', new Blob([JSON.stringify(requestBody)], {
        type: 'application/json'
      }));
      formData.append('file', selectedFile);

      const endpoint = uploadType === 'cover' ? BOOK_COVER_IMAGE_ADD_URL : BOOK_SECONDARY_IMAGE_ADD_URL;
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status === 'SUCCESS') {
        showMessage('success', `${uploadType === 'cover' ? 'Cover' : 'Secondary'} image uploaded successfully`);
        setSelectedFile(null);
        setUploadType('');
        fetchImages(); // Refresh the list
      } else {
        showMessage('error', response.data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showMessage('error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Get image URL for preview
  const getImageUrl = (imageId) => {
    return `${BOOK_IMAGE_FETCH_URL}?imageId=${imageId}`;
  };

  // Handle image load error
  const handleImageError = (imageId) => {
    setImageLoadErrors(prev => new Set([...prev, imageId]));
  };

  // Check if cover image exists
  const hasCoverImage = images.some(img => img.imageType === 'COVER');

  useEffect(() => {
    if (bookId) {
      fetchImages();
    }
  }, [bookId]);

  const handleFileSelect = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file size (e.g., max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showMessage('error', 'File size should not exceed 5MB');
          return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          showMessage('error', 'Please select a valid image file');
          return;
        }

        setSelectedFile(file);
        setUploadType(type);
        setMessage({ type: '', text: '' }); // Clear any existing messages
      }
    };
    input.click();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Manage Images - {bookName}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              Loading images...
            </div>
          ) : (
            <div className={styles.imageTableContainer}>
              {images.length === 0 && !loading ? (
                <div className={styles.noImages}>
                  <div className={styles.noImagesIcon}>📸</div>
                  <p>No images found for this book</p>
                  <p className={styles.noImagesSubtext}>Start by adding a cover or secondary image below</p>
                </div>
              ) : (
                <table className={styles.imageTable}>
                  <thead>
                    <tr>
                      <th>Preview</th>
                      <th>Type</th>
                      <th>File Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {images.map((image) => (
                      <tr key={image.imageId}>
                        <td>
                          <div className={styles.imagePreview}>
                            {!imageLoadErrors.has(image.imageId) ? (
                              <img 
                                src={getImageUrl(image.imageId)} 
                                alt={image.fileName}
                                loading="lazy"
                                onError={() => handleImageError(image.imageId)}
                              />
                            ) : (
                              <div className={styles.imageError}>
                                <span>📷</span>
                                <small>Failed to load</small>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.imageType} ${styles[image.imageType.toLowerCase()]}`}>
                            {image.imageType === 'COVER' ? '📖 Cover' : '🖼️ Secondary'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.fileName}>
                            {image.fileName}
                          </div>
                        </td>
                        <td>
                          <button 
                            className={styles.deleteButton}
                            onClick={() => deleteImage(image.imageId, image.fileName)}
                            title={`Delete ${image.fileName}`}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          {selectedFile && (
            <div className={styles.uploadSection}>
              <div className={styles.selectedFile}>
                <span className={styles.fileIcon}>📄</span>
                <span className={styles.fileName}>Selected: {selectedFile.name}</span>
                <span className={styles.fileSize}>({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <div className={styles.uploadActions}>
                <button 
                  className={styles.uploadButton} 
                  onClick={uploadImage}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className={styles.uploadSpinner}></div>
                      Uploading...
                    </>
                  ) : (
                    `📤 Upload ${uploadType === 'cover' ? 'Cover' : 'Secondary'} Image`
                  )}
                </button>
                <button 
                  className={styles.cancelButton}
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadType('');
                    setMessage({ type: '', text: '' });
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {!selectedFile && (
            <div className={styles.actionButtons}>
              <button 
                className={`${styles.addButton} ${styles.coverButton}`}
                onClick={() => handleFileSelect('cover')}
                disabled={hasCoverImage || uploading}
                title={hasCoverImage ? 'Cover image already exists. Delete it first to add a new one.' : 'Add a cover image for this book'}
              >
                📖 Add Cover Image
                {hasCoverImage && <small>(Already exists)</small>}
              </button>
              <button 
                className={`${styles.addButton} ${styles.secondaryButton}`}
                onClick={() => handleFileSelect('secondary')}
                disabled={uploading}
                title="Add a secondary image for this book"
              >
                🖼️ Add Secondary Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookImageEditModal;