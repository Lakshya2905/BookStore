import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ShoppingCart, Zap, Star, StarHalf, Calendar, BookOpen, User, Building2, Hash, Percent, Package } from 'lucide-react';
import styles from './ImageViewModal.module.css';

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

  // Reset current index when modal opens or images change
  useEffect(() => {
    if (isOpen && imageUrlList.length > 0) {
      setCurrentIndex(0);
    }
    setIsZoomed(false);
  }, [isOpen, imageUrlList]);

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
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, imageUrlList.length, isZoomed]);

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
      onAddToCart(bookId, event);
      onClose();
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
      'NEW_RELEASE': { label: 'New Release', className: styles.tagNewRelease, icon: '🆕' },
      'BESTSELLER': { label: 'Bestseller', className: styles.tagBestseller, icon: '🏆' },
      'TOP_RATED': { label: 'Top Rated', className: styles.tagTopRated, icon: '⭐' },
      'SALE': { label: 'On Sale', className: styles.tagSale, icon: '🔥' }
    };
    return tagMap[tag] || { label: tag.replace('_', ' '), className: styles.tagDefault, icon: '📖' };
  };

  // Format GST display
  const formatGST = (gst) => {
    if (!gst) return null;
    return `${gst}% GST`;
  };

  // Don't render if not open or no images
  if (!isOpen || !imageUrlList.length) {
    return null;
  }

  const currentImage = imageUrlList[currentIndex];
  const hasMultipleImages = imageUrlList.length > 1;
  const pricing = getBookPricing();

  return (
    <div className={styles.modal} onClick={handleBackdropClick}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        
        <div className={styles.modalBody}>
          {/* Left Side - Image Gallery */}
          <div className={styles.modalImageSection}>
            {/* Thumbnail Gallery */}
            {hasMultipleImages && (
              <div className={styles.thumbnailGallery}>
                {imageUrlList.map((image, index) => (
                  <button
                    key={index}
                    className={`${styles.thumbnail} ${currentIndex === index ? styles.thumbnailActive : ''}`}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
            
            {/* Main Image Container */}
            <div className={styles.mainImageContainer}>
              <img
                src={currentImage}
                alt={`${bookInfo?.bookName || 'Book'} - Image ${currentIndex + 1}`}
                className={`${styles.mainImage} ${isZoomed ? styles.zoomed : ''}`}
                onClick={() => setIsZoomed(!isZoomed)}
                onError={(e) => {
                  console.error('Image failed to load:', currentImage);
                }}
              />
              
              {/* Navigation Buttons for main image */}
              {hasMultipleImages && !isZoomed && (
                <>
                  <button
                    className={`${styles.navButton} ${styles.navPrev}`}
                    onClick={() => navigateImage('prev')}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    className={`${styles.navButton} ${styles.navNext}`}
                    onClick={() => navigateImage('next')}
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              {hasMultipleImages && (
                <div className={styles.imageCounter}>
                  {currentIndex + 1} / {imageUrlList.length}
                </div>
              )}
              
              {/* Zoom Indicator */}
              <div className={styles.zoomIndicator}>
                {isZoomed ? 'Click to zoom out' : 'Click to zoom in'}
              </div>
            </div>
          </div>
          
          {/* Right Side - Book Information */}
          <div className={styles.modalInfoSection}>
            {bookInfo && (
              <div className={styles.bookDetails}>
                {/* Book Title and Author */}
                <div className={styles.titleSection}>
                  <h1 className={styles.bookTitle}>{bookInfo.bookName}</h1>
                  {bookInfo.authorName && (
                    <div className={styles.authorInfo}>
                      <User size={16} />
                      <span>by {bookInfo.authorName}</span>
                    </div>
                  )}
                </div>
                
                {/* Tags */}
                {bookInfo.bookTags && bookInfo.bookTags.length > 0 && (
                  <div className={styles.tagsSection}>
                    {bookInfo.bookTags.map((tag, index) => {
                      const tagInfo = getTagInfo(tag);
                      return (
                        <span key={index} className={`${styles.tag} ${tagInfo.className}`}>
                          <span className={styles.tagIcon}>{tagInfo.icon}</span>
                          {tagInfo.label}
                        </span>
                      );
                    })}
                  </div>
                )}
                
                {/* Price Section */}
                {pricing && (
                  <div className={styles.pricingSection}>
                    <div className={styles.priceRow}>
                      <span className={styles.currentPrice}>₹{pricing.price.toFixed(2)}</span>
                      {pricing.mrp > pricing.price && (
                        <>
                          <span className={styles.originalPrice}>₹{pricing.mrp.toFixed(2)}</span>
                          <span className={styles.discount}>({pricing.discount}% OFF)</span>
                        </>
                      )}
                    </div>
                    <div className={styles.priceDetails}>
                      <span>Inclusive of all taxes</span>
                      {bookInfo.gst && (
                        <span className={styles.gstInfo}>
                          <Percent size={14} />
                          {formatGST(bookInfo.gst)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                {(onAddToCart || onBuyNow) && (
                  <div className={styles.actionButtons}>
                    {onAddToCart && (
                      <button 
                        className={`${styles.cartButton} ${cartLoading ? styles.loading : ''}`}
                        onClick={handleAddToCart}
                        disabled={cartLoading}
                      >
                        {cartLoading ? (
                          <>
                            <div className={styles.spinner}></div>
                            Adding to Cart...
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={18} />
                            Add to Cart
                          </>
                        )}
                      </button>
                    )}
                    
                    {onBuyNow && (
                      <button 
                        className={styles.buyButton}
                        onClick={handleBuyNow}
                      >
                        <Zap size={18} />
                        Buy Now
                      </button>
                    )}
                  </div>
                )}
                
                {/* Description */}
                {(bookInfo.description || bookInfo.bookDescription) && (
                  <div className={styles.descriptionSection}>
                    <h3>Description</h3>
                    <p className={styles.description}>
                      {bookInfo.description || bookInfo.bookDescription}
                    </p>
                  </div>
                )}
                
                {/* Book Details */}
                <div className={styles.detailsSection}>
                  <h3>Book Details</h3>
                  <div className={styles.detailsGrid}>
                    {bookInfo.category && (
                      <div className={styles.detailItem}>
                        <BookOpen size={16} />
                        <span className={styles.detailLabel}>Category:</span>
                        <span className={styles.detailValue}>{bookInfo.category}</span>
                      </div>
                    )}
                    
                    {bookInfo.publisher && (
                      <div className={styles.detailItem}>
                        <Building2 size={16} />
                        <span className={styles.detailLabel}>Publisher:</span>
                        <span className={styles.detailValue}>{bookInfo.publisher}</span>
                      </div>
                    )}
                    
                    {bookInfo.isbn && (
                      <div className={styles.detailItem}>
                        <Hash size={16} />
                        <span className={styles.detailLabel}>ISBN:</span>
                        <span className={styles.detailValue}>{bookInfo.isbn}</span>
                      </div>
                    )}
                    
                    {bookInfo.year && (
                      <div className={styles.detailItem}>
                        <Calendar size={16} />
                        <span className={styles.detailLabel}>Year:</span>
                        <span className={styles.detailValue}>{bookInfo.year}</span>
                      </div>
                    )}
                    
                    {bookInfo.edition && (
                      <div className={styles.detailItem}>
                        <Package size={16} />
                        <span className={styles.detailLabel}>Edition:</span>
                        <span className={styles.detailValue}>{bookInfo.edition}</span>
                      </div>
                    )}
                    
                    {bookInfo.hsn && (
                      <div className={styles.detailItem}>
                        <Hash size={16} />
                        <span className={styles.detailLabel}>HSN Code:</span>
                        <span className={styles.detailValue}>{bookInfo.hsn}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewModal;