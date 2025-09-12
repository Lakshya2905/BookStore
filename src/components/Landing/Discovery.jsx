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
  }, [detectImageFormatFromName, images]);

  // Fetch images only once when component mounts
  useEffect(() => {
    fetchImages();
  }, []); // Empty dependency array - fetch only once

  // Auto-slide functionality
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 5000); // 5 seconds per slide
      return () => clearInterval(interval);
    }
  }, [images.length]);

  // Cleanup blob URLs on unmount
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
    fetchImages();
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  const goToSlide = (index) => {
    setCurrentImageIndex(index);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  if (loading) {
    return (
      <section className={styles.discoverySection}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading banner images...</p>
        </div>
      </section>
    );
  }

  if (error && images.length === 0) {
    return (
      <section className={styles.discoverySection}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button className={styles.retryButton} onClick={handleRetry}>
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return null; // Don't render anything if no images
  }

  return (
    <section className={styles.discoverySection}>
      <div className={styles.bannerContainer}>
        <div className={styles.imageSlider}>
          {images.map((image, index) => (
            <div
              key={`${index}-${imageNames[index] || index}`}
              className={`${styles.slide} ${
                index === currentImageIndex ? styles.active : ''
              }`}
            >
              <img
                src={image}
                alt={`Banner ${index + 1}: ${imageNames[index] || `Slide ${index + 1}`}`}
                className={styles.bannerImage}
                onError={handleImageError}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                className={`${styles.navButton} ${styles.prevButton}`}
                onClick={goToPrevious}
                aria-label="Previous image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                className={`${styles.navButton} ${styles.nextButton}`}
                onClick={goToNext}
                aria-label="Next image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Pagination Dots */}
        {images.length > 1 && (
          <div className={styles.pagination}>
            {images.map((_, index) => (
              <button
                key={index}
                className={`${styles.paginationDot} ${
                  index === currentImageIndex ? styles.active : ''
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Discovery;