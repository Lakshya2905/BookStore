import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './DiscoveryImageEditPanel.module.css';
import { VIEW_IMAGE, VIEW_DISCOVERY_IMAGE_LIST, DELETE_DISCOVERY_IMAGE_LIST } from '../../constants/apiConstants';


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

const DiscoveryImageEditPanel = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingIds, setDeletingIds] = useState(new Set());

  useEffect(() => {
    fetchImages();
  }, []);

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
      alert('User authentication data not found. Please login again.');
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
        alert(response.data.message);
        // Refetch the entire image list after deletion
        fetchImages();
      } else {
        alert(response.data?.message || 'Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      if (err.response?.status === 401) {
        alert('Unauthorized access. Please check your credentials.');
      } else {
        alert('Failed to delete image');
      }
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  const getImageUrl = (discoveryId) => {
    return `${VIEW_IMAGE}?discoveryImageId=${discoveryId}`;
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
      <div className={styles.header}>
        <h2>Discovery Images</h2>
        <button className={styles.refreshButton} onClick={fetchImages}>
          Refresh
        </button>
      </div>

      {images.length === 0 ? (
        <div className={styles.noImages}>
          No discovery images found.
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

              <div className={styles.actions}>
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
