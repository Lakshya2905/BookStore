import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './DiscoveryImageEditPanel.module.css';
import { VIEW_IMAGE, VIEW_DISCOVERY_IMAGE_LIST, DELETE_DISCOVERY_IMAGE_LIST , EDIT_PRODUCT_LINK_URL} from '../../constants/apiConstants';

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

const Toast = ({ message, type, onClose }) => (
  <div className={`${styles.toast} ${styles[`toast${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}>
    <div className={styles.toastContent}>
      <span className={styles.toastIcon}>
        {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ⓘ'}
      </span>
      <span className={styles.toastMessage}>{message}</span>
      <button className={styles.toastClose} onClick={onClose}>×</button>
    </div>
  </div>
);

const EditLinkModal = ({ isOpen, onClose, currentLink, onSave, isLoading }) => {
  const [linkValue, setLinkValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLinkValue(currentLink || '');
    }
  }, [isOpen, currentLink]);

  const handleSave = () => {
    onSave(linkValue);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Edit Product Link</h3>
          <button className={styles.modalCloseButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalBody}>
          <label className={styles.inputLabel}>Product Link URL:</label>
          <input
            type="text"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter product link URL"
            className={styles.modalInput}
            disabled={isLoading}
            autoFocus
          />
          <p className={styles.inputHint}>
            Enter the full URL (e.g., https://example.com) or domain (e.g., example.com)
          </p>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.modalCancelButton}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={styles.modalSaveButton}
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DiscoveryImageEditPanel = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [toasts, setToasts] = useState([]);
  const [modalState, setModalState] = useState({
    isOpen: false,
    imageId: null,
    currentLink: '',
    isLoading: false
  });

  useEffect(() => {
    fetchImages();
  }, []);

  // Toast management functions
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message) => addToast(message, 'success');
  const showError = (message) => addToast(message, 'error');
  const showInfo = (message) => addToast(message, 'info');

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${VIEW_DISCOVERY_IMAGE_LIST}`);

      if (response.data && response.data.status === 'SUCCESS') {
        setImages(response.data.payload);
        setError(null);
      } else {
        setImages([]);
        setError('No images found.');
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to fetch images');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    const { user, token } = getUserData();

    if (!user || !token) {
      showError('User authentication data not found. Please login again.');
      return;
    }

    try {
      setDeletingIds(prev => new Set(prev).add(imageId));

      const formData = new FormData();
      const requestBody = { imageId, user, token };

      formData.append('requestBody', new Blob([JSON.stringify(requestBody)], {
        type: 'application/json',
      }));

      const response = await axios.post(`${DELETE_DISCOVERY_IMAGE_LIST}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.status === 'SUCCESS') {
        showSuccess(response.data.message);
        fetchImages();
      } else {
        showError(response.data?.message || 'Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      if (err.response?.status === 401) {
        showError('Unauthorized access. Please check your credentials.');
      } else {
        showError('Failed to delete image');
      }
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  const openEditModal = (imageId, currentLink) => {
    setModalState({
      isOpen: true,
      imageId,
      currentLink: currentLink || '',
      isLoading: false
    });
  };

  const closeEditModal = () => {
    setModalState({
      isOpen: false,
      imageId: null,
      currentLink: '',
      isLoading: false
    });
  };

  const handleSaveProductLink = async (newLink) => {
    const { user, token } = getUserData();

    if (!user || !token) {
      showError('User authentication data not found. Please login again.');
      return;
    }

    if (!newLink.trim()) {
      showError('Please enter a product link');
      return;
    }

    try {
      setModalState(prev => ({ ...prev, isLoading: true }));

      const requestBody = {
        imageId: modalState.imageId,
        linkOfProduct: newLink.trim(),
        user: user,
        token: token
      };

      const response = await axios.post(`${EDIT_PRODUCT_LINK_URL}`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.status === 'SUCCESS') {
        showSuccess(response.data.message || 'Product link updated successfully');
        
        // Update the local state immediately
        setImages(prev => prev.map(img => 
          img.discoveryId === modalState.imageId 
            ? { ...img, linkOfProduct: newLink.trim() }
            : img
        ));
        
        closeEditModal();
      } else {
        showError(response.data?.message || 'Failed to update product link');
      }
    } catch (err) {
      console.error('Error updating product link:', err);
      if (err.response?.status === 401) {
        showError('Unauthorized access. Please check your credentials.');
      } else {
        showError(err.response?.data?.message || 'Failed to update product link');
      }
    } finally {
      setModalState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getImageUrl = (discoveryId) => {
    return `${VIEW_IMAGE}?discoveryImageId=${discoveryId}`;
  };

  const formatUrl = (url) => {
    if (!url) return null;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading images...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error}
          <button className={styles.retryButton} onClick={fetchImages}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Toast Container */}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Edit Link Modal */}
      <EditLinkModal
        isOpen={modalState.isOpen}
        onClose={closeEditModal}
        currentLink={modalState.currentLink}
        onSave={handleSaveProductLink}
        isLoading={modalState.isLoading}
      />

      <div className={styles.header}>
        <h2>Header Images</h2>
        <button className={styles.refreshButton} onClick={fetchImages}>
          Refresh
        </button>
      </div>

      {images.length === 0 ? (
        <div className={styles.noImages}>
          No Header images found.
        </div>
      ) : (
        <div className={styles.imageGrid}>
          {images.map((image) => (
            <div key={image.discoveryId} className={styles.imageCard}>
              <div className={styles.imagePreview}>
                <img
                  src={getImageUrl(image.discoveryId)}
                  alt={image.fileName}
                  className={styles.image}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
                  }}
                />
              </div>

              <div className={styles.imageInfo} title={image.fileName}>
                {image.fileName}
              </div>

              <div className={styles.productLinkSection}>
                {image.linkOfProduct ? (
                  <a 
                    href={formatUrl(image.linkOfProduct)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.productLink}
                    title={image.linkOfProduct}
                  >
                    {image.linkOfProduct.length > 40 
                      ? `${image.linkOfProduct.substring(0, 40)}...` 
                      : image.linkOfProduct}
                  </a>
                ) : (
                  <span className={styles.noLink}>No product link</span>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.editButton}
                  onClick={() => openEditModal(image.discoveryId, image.linkOfProduct)}
                >
                  Edit Link
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteImage(image.discoveryId)}
                  disabled={deletingIds.has(image.discoveryId)}
                >
                  {deletingIds.has(image.discoveryId) ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoveryImageEditPanel;