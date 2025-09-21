// Discovery.jsx - Fixed Container Version
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { FIND_DISCOVERY_IMAGES, FIND_DISCOVERY_IMAGES_LIST } from '../../constants/apiConstants';
import styles from './Discovery.module.css';

const Discovery = () => {
  const [images, setImages] = useState([]);
  const [imageNames, setImageNames] = useState([]);
  const [productLinks, setProductLinks] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef(null);
  const hasInitialized = useRef(false);

  // Load Bootstrap CSS via CDN
  const loadBootstrap = () => {
    if (document.getElementById('discovery-bootstrap')) return;
    const link = document.createElement('link');
    link.id = 'discovery-bootstrap';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
    document.head.appendChild(link);
  };

  useEffect(() => {
    loadBootstrap();
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
      jfif: 'image/jpeg',
    };
    return formatMap[extension] || 'image/jpeg';
  }, []);

  // Cache management functions
  const getCacheKey = () => 'headerImages';
  
  const getCachedImages = useCallback(() => {
    try {
      const cached = sessionStorage.getItem(getCacheKey());
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error reading cached images:', error);
      return null;
    }
  }, []);

  const setCachedImages = useCallback((imageData) => {
    try {
      sessionStorage.setItem(getCacheKey(), JSON.stringify(imageData));
    } catch (error) {
      console.error('Error caching images:', error);
      if (error.name === 'QuotaExceededError') {
        sessionStorage.removeItem(getCacheKey());
        console.warn('Session storage full, cleared image cache');
      }
    }
  }, []);

  const fetchImageById = useCallback(async (imageId, fileName) => {
    try {
      const response = await axios.get(`${FIND_DISCOVERY_IMAGES}`, {
        params: { imageId },
        responseType: 'blob',
        timeout: 10000,
      });

      const blob = response.data;
      const mimeType = detectImageFormatFromName(fileName);
      
      const correctedBlob = new Blob([blob], { type: mimeType });
      const imageUrl = URL.createObjectURL(correctedBlob);
      
      return imageUrl;
    } catch (error) {
      console.error(`Error fetching image ${imageId}:`, error);
      return null;
    }
  }, [detectImageFormatFromName]);

  // Handle image click to open product link
  const handleImageClick = useCallback((index) => {
    const productLink = productLinks[index];
    if (productLink && productLink.trim()) {
      // Ensure URL has protocol
      const url = productLink.startsWith('http') 
        ? productLink 
        : `https://${productLink}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [productLinks]);

  const processImageList = useCallback(async (imageList) => {
    console.log(`Processing ${imageList.length} images from list`);
    
    // Don't revoke URLs if we're using cached data
    if (images.length > 0) {
      images.forEach((imageUrl) => {
        if (imageUrl && imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(imageUrl);
        }
      });
    }

    const imageUrls = [];
    const names = [];
    const links = [];
    const cacheData = {};

    for (const imageItem of imageList) {
      const { discoveryId, fileName, linkOfProduct } = imageItem;
      
      try {
        console.log(`Processing image: ${fileName} (ID: ${discoveryId})`);
        
        const imageUrl = await fetchImageById(discoveryId, fileName);
        if (imageUrl) {
          imageUrls.push(imageUrl);
          names.push(fileName);
          links.push(linkOfProduct || '');
          
          cacheData[fileName] = {
            discoveryId: discoveryId,
            fileName: fileName,
            linkOfProduct: linkOfProduct || ''
          };
          
          console.log(`Successfully processed: ${fileName}`);
        }
      } catch (err) {
        console.error(`Error processing image ${fileName}:`, err);
      }
    }

    console.log(`Successfully processed ${imageUrls.length} images`);

    if (imageUrls.length > 0) {
      setImages(imageUrls);
      setImageNames(names);
      setProductLinks(links);
      setCurrentImageIndex(0);
      
      setCachedImages({
        imageList: cacheData
      });
      
      return true;
    }
    return false;
  }, [fetchImageById, setCachedImages]);

  // Fixed fetchImages to prevent infinite calls
  const fetchImages = useCallback(async () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    setLoading(true);
    setError(null);

    try {
      const cachedData = getCachedImages();
      if (cachedData && cachedData.imageList && Object.keys(cachedData.imageList).length > 0) {
        console.log(`Loading ${Object.keys(cachedData.imageList).length} images from cache`);
        
        const cachedImageList = Object.values(cachedData.imageList);
        const success = await processImageList(cachedImageList);
        if (success) {
          setLoading(false);
          return;
        }
      }

      console.log('Fetching image list from API');
      const response = await axios.get(`${FIND_DISCOVERY_IMAGES_LIST}`, {
        headers: { Accept: 'application/json' },
        timeout: 10000,
      });

      console.log('API Response:', response.data);

      if (response.data && response.data.status === 'SUCCESS' && response.data.payload) {
        const imageList = response.data.payload;
        console.log(`API Response - image count: ${imageList.length}`);

        const success = await processImageList(imageList);
        if (!success) {
          throw new Error('No valid images could be processed');
        }
      } else {
        throw new Error('No images received from server');
      }
    } catch (err) {
      console.error('Error in fetchImages:', err);
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
  }, [getCachedImages, processImageList]);

  // Auto-slide functionality
  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (images.length > 1 && isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 4000);
    }
  }, [images.length, isPlaying]);

  const stopAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Navigation functions
  const goToSlide = useCallback((index) => {
    setCurrentImageIndex(index);
    stopAutoSlide();
    setTimeout(startAutoSlide, 5000); // Restart after 5 seconds
  }, [stopAutoSlide, startAutoSlide]);

  const goToPrevious = useCallback(() => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
    stopAutoSlide();
    setTimeout(startAutoSlide, 5000);
  }, [images.length, stopAutoSlide, startAutoSlide]);

  const goToNext = useCallback(() => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    stopAutoSlide();
    setTimeout(startAutoSlide, 5000);
  }, [images.length, stopAutoSlide, startAutoSlide]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Effects
  useEffect(() => {
    if (!hasInitialized.current) {
      console.log('Discovery component mounted, fetching images...');
      fetchImages();
    }
  }, []); // Empty dependency array

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, [startAutoSlide, stopAutoSlide]);

  useEffect(() => {
    return () => {
      images.forEach((imageUrl) => {
        if (imageUrl && imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(imageUrl);
        }
      });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [images]);

  const handleRetry = () => {
    hasInitialized.current = false;
    sessionStorage.removeItem(getCacheKey());
    setError(null);
    setImages([]);
    setImageNames([]);
    setProductLinks([]);
    fetchImages();
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  const handleMouseEnter = () => {
    stopAutoSlide();
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      startAutoSlide();
    }
  };

  if (loading) {
    return (
      <section className={styles.discoverySection}>
        <div className="container-fluid px-0">
          <div className="row g-0 justify-content-center">
            <div className="col-12">
              <div className={`card border-0 shadow-lg ${styles.loadingCard}`}>
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
      <section className={styles.discoverySection}>
        <div className="container-fluid px-0">
          <div className="row g-0 justify-content-center">
            <div className="col-12">
              <div className={`card border-0 shadow-lg ${styles.errorCard}`}>
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
                      className={`btn btn-outline-danger btn-lg px-4 ${styles.retryButton}`}
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
    return null;
  }

  return (
    <section className={styles.discoverySection}>
      <div className="container-fluid px-0">
        <div className="row g-0 justify-content-center">
          <div className="col-12">
            <div 
              className={`card border-0 shadow-lg overflow-hidden ${styles.carouselCard}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className={`${styles.carouselContainer} position-relative`}>
                <div className={styles.carouselInner}>
                  {images.map((image, index) => {
                    const hasProductLink = productLinks[index] && productLinks[index].trim();
                    
                    return (
                      <div
                        key={`${index}-${imageNames[index] || index}`}
                        className={`${styles.carouselItem} ${index === currentImageIndex ? styles.active : ''}`}
                        style={{
                          display: index === currentImageIndex ? 'block' : 'none',
                        }}
                      >
                        <div className={styles.imageContainer}>
                          <img
                            src={image}
                            className={`${styles.carouselImage} ${hasProductLink ? styles.clickableImage : ''}`}
                            alt={`Banner ${index + 1}: ${imageNames[index] || `Slide ${index + 1}`}`}
                            onError={handleImageError}
                            loading={index === 0 ? "eager" : "lazy"}
                            onClick={() => handleImageClick(index)}
                            style={{
                              cursor: hasProductLink ? 'pointer' : 'default'
                            }}
                            title={hasProductLink ? 'Click to view product' : ''}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Controls */}
                {images.length > 1 && (
                  <>
                    <button
                      className={`${styles.carouselControl} ${styles.carouselControlPrev}`}
                      type="button"
                      onClick={goToPrevious}
                      aria-label="Previous slide"
                    >
                      <div className={styles.navButtonWrapper}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      </div>
                    </button>

                    <button
                      className={`${styles.carouselControl} ${styles.carouselControlNext}`}
                      type="button"
                      onClick={goToNext}
                      aria-label="Next slide"
                    >
                      <div className={styles.navButtonWrapper}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                      </div>
                    </button>
                  </>
                )}

                {/* Pagination Indicators */}
                {images.length > 1 && (
                  <div className={styles.customIndicators}>
                    {images.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`${styles.indicatorDot} ${index === currentImageIndex ? styles.active : ''}`}
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