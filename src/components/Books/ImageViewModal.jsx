import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ShoppingCart, Zap, Star, StarHalf, Calendar, BookOpen, User, Building2, Hash, Percent, Package, Loader } from 'lucide-react';
import axios from 'axios';
import styles from './ImageViewModal.module.css';
import { BOOK_IMAGE_FETCH_URL,FIND_BOOK_URL } from '../../constants/apiConstants';

// Load Bootstrap CSS
const loadBootstrap = () => {
  if (document.getElementById('bootstrap-modal-css')) return;
  const link = document.createElement('link');
  link.id = 'bootstrap-modal-css';
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
  link.integrity = 'sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};

const ImageViewModal = ({ 
  isOpen, 
  onClose, 
  book, // Changed from bookInfo to book object
  onAddToCart,
  onBuyNow,
  cartLoading = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [bookInfo, setBookInfo] = useState(null);
  const [imageUrlList, setImageUrlList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load Bootstrap on component mount
  useEffect(() => {
    loadBootstrap();
  }, []);

  // Fetch book information and images when modal opens
  useEffect(() => {
    if (isOpen && book?.bookId) {
      fetchBookData(book.bookId);
    }
  }, [isOpen, book?.bookId]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsZoomed(false);
      setError(null);
    }
  }, [isOpen]);

  // Fetch single image by ID
  const fetchSingleImageById = async (imageId) => {
    try {
      const imageResponse = await axios.get(`${BOOK_IMAGE_FETCH_URL}?imageId=${imageId}`, {
        responseType: 'blob',
        timeout: 15000 // 15 second timeout
      });

      const blob = imageResponse.data;
      
      // Convert blob to base64 for caching
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          resolve(base64data);
        };
        reader.onerror = () => {
          console.warn(`Failed to convert image to base64 for imageId ${imageId}`);
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });

    } catch (error) {
      console.warn(`Failed to load image for imageId ${imageId}:`, error.message);
      return null;
    }
  };

  // Fetch book data and images
  const fetchBookData = async (bookId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch book information
      const bookResponse = await axios.get(`${FIND_BOOK_URL}?bookId=${bookId}`, {
        timeout: 10000 // 10 second timeout
      });

      if (bookResponse.data && bookResponse.data.status=='SUCCESS') {
        const fetchedBookInfo = bookResponse.data.payload;
        setBookInfo(fetchedBookInfo);

        // Fetch all images if bookImageList exists
        if (fetchedBookInfo.bookImageList && fetchedBookInfo.bookImageList.length > 0) {
          const imagePromises = fetchedBookInfo.bookImageList.map(async (imageDto) => {
            const imageUrl = await fetchSingleImageById(imageDto.imageId);
            return {
              ...imageDto,
              url: imageUrl
            };
          });

          const images = await Promise.all(imagePromises);
          
          // Filter out failed images and sort by type (COVER first, then SECONDARY)
          const validImages = images
            .filter(img => img.url !== null)
            .sort((a, b) => {
              if (a.imageType === 'COVER' && b.imageType !== 'COVER') return -1;
              if (a.imageType !== 'COVER' && b.imageType === 'COVER') return 1;
              return 0;
            });

          setImageUrlList(validImages.map(img => img.url));
        } else {
          setImageUrlList([]);
        }
      } else {
        setError('Failed to fetch book information');
        setImageUrlList([]);
      }
    } catch (error) {
      console.error('Error fetching book data:', error);
      setError('Failed to load book information. Please try again.');
      setImageUrlList([]);
    } finally {
      setLoading(false);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const scrollY = window.scrollY;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (!isZoomed) navigateImage('prev');
          break;
        case 'ArrowRight':
          if (!isZoomed) navigateImage('next');
          break;
        case 'Enter':
        case ' ':
          if (event.target === document.activeElement) {
            event.preventDefault();
            setIsZoomed(!isZoomed);
          }
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, imageUrlList.length, isZoomed, onClose]);

  // Navigate between images
  const navigateImage = (direction) => {
    if (imageUrlList.length <= 1) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % imageUrlList.length;
    } else {
      newIndex = (currentIndex - 1 + imageUrlList.length) % imageUrlList.length;
    }
    
    setCurrentIndex(newIndex);
    setIsZoomed(false);
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle Add to Cart
  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (onAddToCart && bookInfo) {
      const bookId = bookInfo.bookId;
      onClose();
      onAddToCart(bookId, event);
      
      // Show success feedback
      const button = event.currentTarget;
      const originalText = button.innerHTML;
      button.innerHTML = '<span class="me-2">✓</span>Added to Cart!';
      button.style.background = '#28a745';
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
      }, 1500);
    }
  };

  // Handle Buy Now
  const handleBuyNow = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (onBuyNow && bookInfo) {
      const bookId = bookInfo.bookId;
      onBuyNow(bookId, event);
      onClose();
    }
  };

  // Calculate price information
  const getBookPricing = () => {
    if (!bookInfo) return null;
    
    const price = parseFloat(bookInfo.price) || 0;
    const mrp = parseFloat(bookInfo.mrp) || price;
    const discount = parseFloat(bookInfo.discount) || (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
    
    return { price, mrp, discount };
  };

  // Get tag display info
  const getTagInfo = (tag) => {
    const tagMap = {
      'NEW_RELEASE': { label: 'New Release', className: 'bg-primary', icon: '🆕' },
      'BESTSELLER': { label: 'Bestseller', className: 'bg-warning text-dark', icon: '🏆' },
      'TOP_RATED': { label: 'Top Rated', className: 'bg-success', icon: '⭐' },
      'SALE': { label: 'On Sale', className: 'bg-danger', icon: '🔥' }
    };
    return tagMap[tag] || { label: tag.replace('_', ' '), className: 'bg-secondary', icon: '📖' };
  };

  // Format GST display
  const formatGST = (gst) => {
    if (!gst) return null;
    return `${gst}% GST`;
  };

  // Handle image load error
  const handleImageError = (e, index) => {
    console.error(`Image failed to load at index ${index}:`, imageUrlList[index]);
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const hasMultipleImages = imageUrlList.length > 1;
  const pricing = getBookPricing();

  return (
    <div 
      className={`${styles.modalBackdrop} modal fade show d-block`}
      onClick={handleBackdropClick} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-title"
    >
      <div className={`${styles.modalContainer} modal-dialog modal-xl modal-dialog-centered`}>
        <div className={`${styles.modalContent} modal-content`}>
          {/* Close Button */}
          <button
            type="button"
            className={`${styles.closeButton} btn-close`}
            onClick={onClose}
            aria-label="Close modal"
            autoFocus
          >X</button>
          
          <div className={`${styles.modalBody} modal-body p-0`}>
            {loading ? (
              // Loading State
              <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted">Loading book information...</p>
                </div>
              </div>
            ) : error ? (
              // Error State
              <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                  <div className="text-danger mb-3">
                    <X size={48} />
                  </div>
                  <p className="text-danger mb-3">{error}</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => book?.bookId && fetchBookData(book.bookId)}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              // Main Content
              <>
                {/* Left Side - Image Gallery */}
                <div className={styles.imageSection}>
                  {imageUrlList.length > 0 ? (
                    <>
                      {/* Main Image Container */}
                      <div className={styles.mainImageContainer}>
                        <img
                          src={imageUrlList[currentIndex]}
                          alt={`${bookInfo?.bookName || 'Book'} - Image ${currentIndex + 1}`}
                          className={`${styles.mainImage} ${isZoomed ? styles.zoomed : ''}`}
                          onClick={() => setIsZoomed(!isZoomed)}
                          onError={(e) => handleImageError(e, currentIndex)}
                          tabIndex="0"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setIsZoomed(!isZoomed);
                            }
                          }}
                        />
                        
                        {/* Navigation Buttons */}
                        {hasMultipleImages && !isZoomed && (
                          <>
                            <button
                              type="button"
                              className={`${styles.navButton} ${styles.prev} btn`}
                              onClick={() => navigateImage('prev')}
                              aria-label="Previous image"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.navButton} ${styles.next} btn`}
                              onClick={() => navigateImage('next')}
                              aria-label="Next image"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </>
                        )}
                        
                        {/* Image Counter */}
                        {hasMultipleImages && (
                          <div className={styles.imageCounter} aria-live="polite">
                            {currentIndex + 1} / {imageUrlList.length}
                          </div>
                        )}
                      </div>
                      
                      {/* Thumbnail Gallery */}
                      {hasMultipleImages && (
                        <div className={styles.thumbnailGallery}>
                          <div className={styles.thumbnailContainer}>
                            {imageUrlList.map((image, index) => (
                              <button
                                key={index}
                                type="button"
                                className={`${styles.thumbnailButton} ${currentIndex === index ? styles.active : ''} btn border`}
                                onClick={() => setCurrentIndex(index)}
                                aria-label={`View image ${index + 1} of ${imageUrlList.length}`}
                              >
                                <img 
                                  src={image} 
                                  alt={`Thumbnail ${index + 1}`}
                                  className={styles.thumbnailImage}
                                  onError={(e) => handleImageError(e, index)}
                                  loading="lazy"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // No Images Available
                    <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                      <div className="text-center text-muted">
                        <BookOpen size={64} className="mb-3" />
                        <p>No images available for this book</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right Side - Book Information */}
                <div className={styles.bookInfoSection}>
                  {/* Fixed Header - Title and Author */}
                  {bookInfo && (
                    <div className={styles.bookInfoHeader}>
                      <h1 id="modal-title" className={styles.bookTitle}>
                        {bookInfo.bookName}
                      </h1>
                      {bookInfo.authorName && (
                        <div className={styles.bookAuthor}>
                          <User size={16} className="me-2" />
                          <span>by {bookInfo.authorName}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Scrollable Content */}
                  <div className={styles.scrollableContent}>
                    {bookInfo && (
                      <div>
                        {/* Tags */}
                        {bookInfo.bookTags && bookInfo.bookTags.length > 0 && (
                          <div className={styles.tagContainer}>
                            {bookInfo.bookTags.map((tag, index) => {
                              const tagInfo = getTagInfo(tag);
                              return (
                                <span key={index} className={`${styles.tag} badge ${tagInfo.className}`}>
                                  <span className="me-1" role="img" aria-label={tagInfo.label}>{tagInfo.icon}</span>
                                  {tagInfo.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Price Section */}
                        {pricing && (
                          <div className={styles.priceSection}>
                            <div className={styles.priceRow}>
                              <span className={styles.currentPrice} aria-label={`Current price ₹${pricing.price.toFixed(2)}`}>
                                ₹{pricing.price.toFixed(2)}
                              </span>
                              {pricing.mrp > pricing.price && (
                                <>
                                  <span className={styles.originalPrice} aria-label={`Original price ₹${pricing.mrp.toFixed(2)}`}>
                                    ₹{pricing.mrp.toFixed(2)}
                                  </span>
                                  <span className={styles.discountBadge} aria-label={`${pricing.discount}% discount`}>
                                    {pricing.discount}% OFF
                                  </span>
                                </>
                              )}
                            </div>
                            {bookInfo.gst && (
                              <div className="mt-2">
                                <small className="text-muted">
                                  <Percent size={14} className="me-1" />
                                  {formatGST(bookInfo.gst)} included
                                </small>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Description */}
                        {bookInfo.description && (
                          <div className="mb-4">
                            <h3 className={styles.sectionHeader}>Description</h3>
                            <p className="text-muted lh-base" style={{ fontSize: '0.95rem' }}>
                              {bookInfo.description}
                            </p>
                          </div>
                        )}
                        
                        {/* Book Details */}
                        <div className="mb-4">
                          <h3 className={styles.sectionHeader}>Book Details</h3>
                          <div className="d-flex flex-column gap-2">
                            {bookInfo.category && (
                              <div className={styles.detailItem}>
                                <BookOpen size={16} className="me-2 text-primary" />
                                <span className={styles.detailLabel}>Category:</span>
                                <span className={styles.detailValue}>{bookInfo.category}</span>
                              </div>
                            )}
                            
                            {bookInfo.publisher && (
                              <div className={styles.detailItem}>
                                <Building2 size={16} className="me-2 text-primary" />
                                <span className={styles.detailLabel}>Publisher:</span>
                                <span className={styles.detailValue}>{bookInfo.publisher}</span>
                              </div>
                            )}
                            
                            {bookInfo.isbn && (
                              <div className={styles.detailItem}>
                                <Hash size={16} className="me-2 text-primary" />
                                <span className={styles.detailLabel}>ISBN:</span>
                                <span className={styles.detailValue}>{bookInfo.isbn}</span>
                              </div>
                            )}
                            
                            {bookInfo.year && (
                              <div className={styles.detailItem}>
                                <Calendar size={16} className="me-2 text-primary" />
                                <span className={styles.detailLabel}>Year:</span>
                                <span className={styles.detailValue}>{bookInfo.year}</span>
                              </div>
                            )}
                            
                            {bookInfo.edition && (
                              <div className={styles.detailItem}>
                                <Package size={16} className="me-2 text-primary" />
                                <span className={styles.detailLabel}>Edition:</span>
                                <span className={styles.detailValue}>{bookInfo.edition}</span>
                              </div>
                            )}
                            
                            {bookInfo.hsn && (
                              <div className={styles.detailItem}>
                                <Hash size={16} className="me-2 text-primary" />
                                <span className={styles.detailLabel}>HSN:</span>
                                <span className={styles.detailValue}>{bookInfo.hsn}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Fixed Action Buttons Footer */}
                  {(onAddToCart || onBuyNow) && bookInfo && (
                    <div className={styles.actionFooter}>
                      <div className={styles.actionButtons}>
                        {onAddToCart && (
                          <button 
                            type="button"
                            className={`${styles.actionButton} btn btn-outline-primary ${cartLoading ? 'disabled' : ''}`}
                            onClick={handleAddToCart}
                            disabled={cartLoading}
                            aria-label="Add to shopping cart"
                          >
                            {cartLoading ? (
                              <>
                                <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
                                <span className="d-none d-md-inline">Adding to Cart...</span>
                                <span className="d-md-none">Adding...</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart size={18} className="me-2" />
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>
                        )}
                        
                        {onBuyNow && (
                          <button 
                            type="button"
                            className={`${styles.actionButton} btn btn-warning text-white fw-bold`}
                            onClick={handleBuyNow}
                            aria-label="Buy now"
                          >
                            <Zap size={18} className="me-2" />
                            <span>Buy Now</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewModal;