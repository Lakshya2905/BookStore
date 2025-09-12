// Discovery.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './Discovery.module.css';
import { DISCOVERY_IMAGES } from '../../constants/apiConstants';

const Discovery = () => {
  const [images, setImages] = useState([]);
  const [imageNames, setImageNames] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const STORAGE_KEY = 'discovery_images_cache';
  const STORAGE_EXPIRY_KEY = 'discovery_images_expiry';
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  const detectImageFormatFromName = useCallback((filename) => {
    if (!filename) return 'image/jpeg';
    const extension = filename.toLowerCase().split('.').pop();
    const formatMap = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
    };
    return formatMap[extension] || 'image/jpeg';
  }, []);

  const loadFromCache = useCallback(() => {
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      const expiry = sessionStorage.getItem(STORAGE_EXPIRY_KEY);

      if (cached && expiry && new Date().getTime() < parseInt(expiry)) {
        const { imageUrls, names } = JSON.parse(cached);
        setImages(imageUrls);
        setImageNames(names);
        return true;
      }
    } catch (e) {
      console.error('Error loading from cache:', e);
    }
    return false;
  }, []);

  const saveToCache = useCallback((imageUrls, names) => {
    try {
      const cacheData = { imageUrls, names };
      const expiry = new Date().getTime() + CACHE_DURATION;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
      sessionStorage.setItem(STORAGE_EXPIRY_KEY, expiry.toString());
    } catch (e) {
      console.error('Error saving to cache:', e);
    }
  }, [CACHE_DURATION]);

  const base64ToBlobUrl = (base64String, fileName) => {
    const mimeType = detectImageFormatFromName(fileName);
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length)
      .fill(0)
      .map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  };

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
  
    if (loadFromCache()) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(DISCOVERY_IMAGES, {
        headers: { Accept: 'application/json' },
        timeout: 10000,
      });

      const imageData = response.data;

      if (imageData && Object.keys(imageData).length > 0) {
        // Revoke old blob URLs
        images.forEach((imageUrl) => {
          if (imageUrl && imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imageUrl);
          }
        });

        const imageUrls = [];
        const names = [];

        Object.entries(imageData).forEach(([imageName, base64Str]) => {
          if (typeof base64Str === 'string' && base64Str.trim()) {
            try {
              const imageUrl = base64ToBlobUrl(base64Str, imageName);
              imageUrls.push(imageUrl);
              names.push(imageName);
            } catch (err) {
              console.error('Error processing image:', err);
            }
          }
        });

        if (imageUrls.length > 0) {
          setImages(imageUrls);
          setImageNames(names);
          setCurrentImageIndex(0);
          saveToCache(imageUrls, names);
        } else {
          throw new Error('No valid images could be processed');
        }
      } else {
        throw new Error('No images received from server');
      }
    } catch (err) {
      let errorMessage = 'Failed to load discovery images';
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.response) {
        switch (err.response.status) {
          case 404:
            errorMessage = 'No discovery images found';
            break;
          case 500:
            errorMessage = 'Server error while loading images';
            break;
          default:
            errorMessage = `Error ${err.response.status}: ${err.response.statusText}`;
        }
      } else if (err.request) {
        errorMessage = 'Network error: Could not reach server';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache, detectImageFormatFromName, images]);



  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [images.length]);

  useEffect(() => {
    return () => {
      images.forEach((imageUrl) => {
        if (imageUrl && imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(imageUrl);
        }
      });
    };
  }, [images]);

  const handleRetry = () => {
    setError(null);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_EXPIRY_KEY);
    fetchImages();
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  if (loading && images.length === 0) {
    return (
      <section className={styles.discoverySection}>
        <div className={styles.discoveryContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading amazing discoveries...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && images.length === 0) {
    return (
      <section className={styles.discoverySection}>
        <div className={styles.discoveryContainer}>
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryButton} onClick={handleRetry}>
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.discoverySection}>
      <div className={styles.discoveryContainer}>
        <div className={styles.discoveryPanel}>
          {/* Content Section */}
          <div className={styles.contentSection}>
            <div className={styles.badge}>Top Rated</div>
            <h2 className={styles.mainTitle}>Discover Amazing Content</h2>
            <div className={styles.offerBadge}>
              <span className={styles.offerText}>Special Offer</span>
            </div>
            <p className={styles.description}>
              Explore our curated collection and get exclusive access to premium content
            </p>
            <p className={styles.validText}>Offer Valid on all premium subscriptions</p>
            {error && (
              <p className={styles.warningMessage}>
                Note: Some content failed to load. Showing available items.
              </p>
            )}
          </div>

          {/* Image Carousel Section */}
          {images.length > 0 && (
            <div className={styles.imageSection}>
              <div className={styles.imageContainer}>
                {images.map((image, index) => (
                  <img
                    key={`${index}-${imageNames[index] || index}`}
                    src={image}
                    alt={`Discovery: ${imageNames[index] || `Content ${index + 1}`}`}
                    className={`${styles.discoveryImage} ${
                      index === currentImageIndex ? styles.active : ''
                    }`}
                    onError={handleImageError}
                    loading="lazy"
                    style={{
                      display: index === currentImageIndex ? 'block' : 'none',
                      opacity: index === currentImageIndex ? 1 : 0,
                    }}
                  />
                ))}
              </div>
              {images.length > 1 && (
                <div className={styles.indicators}>
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`${styles.indicator} ${
                        index === currentImageIndex ? styles.indicatorActive : ''
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`View ${imageNames[index] || `content ${index + 1}`}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Decorative Elements */}
          <div className={styles.decorativeElements}>
            <div className={styles.triangle}></div>
            <div className={styles.dots}></div>
            <div className={styles.cube}></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Discovery;
