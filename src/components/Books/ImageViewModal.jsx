import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ShoppingCart, Zap, Star, StarHalf, Calendar, BookOpen, User, Building2, Hash, Percent, Package } from 'lucide-react';
import styles from './ImageViewModal.module.css';

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
  bookInfo, 
  imageUrlList = [],
  onAddToCart,
  onBuyNow,
  cartLoading = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Load Bootstrap on component mount
  useEffect(() => {
    loadBootstrap();
  }, []);

  // Reset current index when modal opens or images change
  useEffect(() => {
    if (isOpen && imageUrlList.length > 0) {
      setCurrentIndex(0);
    }
    setIsZoomed(false);
  }, [isOpen, imageUrlList]);

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
      const bookId = bookInfo.bookId || bookInfo.id;
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
      const bookId = bookInfo.bookId || bookInfo.id;
      onBuyNow(bookId, event);
      onClose();
    }
  };

  // Calculate price information
  const getBookPricing = () => {
    if (!bookInfo) return null;
    
    const price = parseFloat(bookInfo.price) || 0;
    const mrp = parseFloat(bookInfo.mrp || bookInfo.originalPrice) || price;
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

  // Don't render if not open or no images
  if (!isOpen || !imageUrlList.length) {
    return null;
  }

  const currentImage = imageUrlList[currentIndex];
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
            {/* Left Side - Image Gallery */}
            <div className={styles.imageSection}>
              {/* Main Image Container */}
              <div className={styles.mainImageContainer}>
                <img
                  src={currentImage}
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
                        <div className={styles.taxInfo}>
                          <span>Inclusive of all taxes</span>
                          {bookInfo.gst && (
                            <div className="d-flex align-items-center">
                              <Percent size={14} className="me-1" />
                              {formatGST(bookInfo.gst)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Description */}
                    {(bookInfo.description || bookInfo.bookDescription) && (
                      <div className="mb-4">
                        <h3 className={styles.sectionHeader}>Description</h3>
                        <p className="text-muted lh-base" style={{ fontSize: '0.95rem' }}>
                          {bookInfo.description || bookInfo.bookDescription}
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
                            <span className={styles.detailLabel}>HSN Code:</span>
                            <span className={styles.detailValue}>{bookInfo.hsn}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Fixed Action Buttons Footer */}
              {(onAddToCart || onBuyNow) && (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewModal;