// Discovery.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DISCOVERY_IMAGES } from '../../constants/apiConstants';
import styles from './Discovery.module.css';

const Discovery = () => {
  const [images, setImages] = useState([]);
  const [imageNames, setImageNames] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load Bootstrap CSS via CDN
  useEffect(() => {
    if (!document.querySelector('link[href*="bootstrap"]')) {
      const link = document.createElement('link');
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css';
      link.rel = 'stylesheet';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }, []);

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
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="card border-0 shadow-lg" style={{ height: '400px' }}>
                <div className="card-body d-flex flex-column align-items-center justify-content-center">
                  <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted fs-5 mb-0">Loading banner images...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error && images.length === 0) {
    return (
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="card border-0 shadow-lg" style={{ height: '400px' }}>
                <div className="card-body d-flex flex-column align-items-center justify-content-center text-center">
                  <div className="mb-4">
                    <svg width="64" height="64" className="text-danger mb-3" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                  </div>
                  <div className="alert alert-danger border-0 shadow-sm" role="alert">
                    <h5 className="alert-heading mb-2">Oops! Something went wrong</h5>
                    <p className="mb-3">{error}</p>
                    <button 
                      className="btn btn-outline-danger btn-lg px-4"
                      onClick={handleRetry}
                    >
                      <svg width="16" height="16" className="me-2" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                      </svg>
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return null; // Don't render anything if no images
  }

  return (
    <section className={`py-5 ${styles.discoverySection}`}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className={`card border-0 shadow-lg overflow-hidden ${styles.carouselCard}`}>
              <div id="discoveryCarousel" className="carousel slide position-relative" data-bs-ride="false">
                <div className={`carousel-inner ${styles.carouselInner}`}>
                  {images.map((image, index) => (
                    <div
                      key={`${index}-${imageNames[index] || index}`}
                      className={`carousel-item ${index === currentImageIndex ? 'active' : ''}`}
                      style={{ height: '100%' }}
                    >
                      <img
                        src={image}
                        className={`d-block w-100 h-100 ${styles.carouselImage}`}
                        alt={`Banner ${index + 1}: ${imageNames[index] || `Slide ${index + 1}`}`}
                        onError={handleImageError}
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Navigation Controls */}
                {images.length > 1 && (
                  <>
                    <button
                      className={`carousel-control-prev ${styles.carouselControlPrev}`}
                      type="button"
                      onClick={goToPrevious}
                      aria-label="Previous"
                    >
                      <div className={styles.navButtonWrapper}>
                        <svg width="20" height="20" fill="currentColor" className="text-dark" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      </div>
                      <span className="visually-hidden">Previous</span>
                    </button>
                    
                    <button
                      className={`carousel-control-next ${styles.carouselControlNext}`}
                      type="button"
                      onClick={goToNext}
                      aria-label="Next"
                    >
                      <div className={styles.navButtonWrapper}>
                        <svg width="20" height="20" fill="currentColor" className="text-dark" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                      </div>
                      <span className="visually-hidden">Next</span>
                    </button>
                  </>
                )}

                {/* Pagination Indicators */}
                {images.length > 1 && (
                  <div className={`carousel-indicators ${styles.customIndicators}`}>
                    {images.map((_, index) => (
                      <button
                        key={index}
                  
                        type="button"
  className={`${styles.indicatorDot} ${index === currentImageIndex ? styles.active : ''}`}
  style={{ width: '6px', height: '6px', borderRadius: '50%', padding: 0 }}

                        onClick={() => goToSlide(index)}
                        aria-current={index === currentImageIndex ? 'true' : 'false'}
                        aria-label={`Slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Discovery;