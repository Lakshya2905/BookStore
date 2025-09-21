import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ShoppingCart, Zap, Star, StarHalf, Calendar, BookOpen, User, Building2, Hash, Percent, Package } from 'lucide-react';

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

  // Prevent body scroll when modal is open and fix modal positioning
  useEffect(() => {
    if (isOpen) {
      // Store original values
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const originalPosition = document.documentElement.style.position;
      const originalTop = document.documentElement.style.top;
      const originalWidth = document.documentElement.style.width;
      
      // Get scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to prevent scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.top = `-${scrollY}px`;
      document.documentElement.style.width = '100%';
      
      return () => {
        // Restore original values
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        document.documentElement.style.position = originalPosition;
        document.documentElement.style.top = originalTop;
        document.documentElement.style.width = originalWidth;
        
        // Restore scroll position
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
      'NEW_RELEASE': { label: 'New Release', className: 'badge bg-primary', icon: '🆕' },
      'BESTSELLER': { label: 'Bestseller', className: 'badge bg-warning', icon: '🏆' },
      'TOP_RATED': { label: 'Top Rated', className: 'badge bg-success', icon: '⭐' },
      'SALE': { label: 'On Sale', className: 'badge bg-danger', icon: '🔥' }
    };
    return tagMap[tag] || { label: tag.replace('_', ' '), className: 'badge bg-secondary', icon: '📖' };
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
      className="modal fade show d-block position-fixed w-100 h-100" 
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1055,
        top: 0,
        left: 0,
        overflow: 'hidden'
      }} 
      onClick={handleBackdropClick} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-title"
    >
      <div className="modal-dialog modal-xl modal-dialog-centered position-relative w-100 h-100 m-0 d-flex align-items-center justify-content-center p-3">
        <div className="modal-content position-relative" style={{ 
          maxHeight: '100%', 
          maxWidth: '100%',
          width: '100%',
          height: 'auto',
          minHeight: '60vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Close Button */}
          <button
            type="button"
            className="btn-close position-absolute top-0 end-0 m-3"
            style={{ zIndex: 1060 }}
            onClick={onClose}
            aria-label="Close modal"
            autoFocus
          ></button>
          
          <div className="modal-body p-0 d-flex flex-column flex-lg-row flex-grow-1" style={{ minHeight: '60vh' }}>
            {/* Left Side - Image Gallery */}
            <div className="flex-fill d-flex flex-column order-0 order-lg-0 mb-3 mb-lg-0" style={{ minHeight: '300px', backgroundColor: '#f8f9fa' }}>
              {/* Thumbnail Gallery - Responsive positioning */}
              {hasMultipleImages && (
                <div className="d-flex d-lg-block bg-white border-end border-bottom border-lg-bottom-0 p-2 overflow-auto" 
                     style={{ 
                       flexShrink: 0,
                       height: 'auto',
                       maxHeight: '80px'
                     }}
                >
                  <div className="d-flex d-lg-block gap-2">
                    {imageUrlList.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`btn p-1 flex-shrink-0 ${currentIndex === index ? 'border-primary border-3' : 'border-secondary border-2'}`}
                        style={{ 
                          width: '60px', 
                          height: '60px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          marginBottom: '8px'
                        }}
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`View image ${index + 1} of ${imageUrlList.length}`}
                      >
                        <img 
                          src={image} 
                          alt={`Thumbnail ${index + 1}`}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                          onError={(e) => handleImageError(e, index)}
                          loading="lazy"
                        />
                        {currentIndex === index && (
                          <div 
                            className="position-absolute top-50 start-50 translate-middle bg-primary rounded-circle border border-2 border-white"
                            style={{ width: '20px', height: '20px' }}
                          ></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Main Image Container */}
              <div className="flex-fill position-relative d-flex align-items-center justify-content-center p-3 p-lg-4"
                   style={{ 
                     background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                     minHeight: '250px'
                   }}
              >
                <img
                  src={currentImage}
                  alt={`${bookInfo?.bookName || 'Book'} - Image ${currentIndex + 1}`}
                  className={`img-fluid ${isZoomed ? '' : 'shadow'}`}
                  style={{ 
                    maxHeight: '100%',
                    objectFit: 'contain',
                    cursor: isZoomed ? 'zoom-out' : 'zoom-in',
                    transform: isZoomed ? 'scale(1.8)' : 'scale(1)',
                    transition: 'transform 0.3s ease',
                    borderRadius: '8px'
                  }}
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
                
                {/* Navigation Buttons for main image */}
                {hasMultipleImages && !isZoomed && (
                  <>
                    <button
                      type="button"
                      className="btn btn-light position-absolute start-0 top-50 translate-middle-y ms-2 shadow-sm"
                      style={{ 
                        width: '45px', 
                        height: '45px',
                        borderRadius: '50%',
                        zIndex: 10
                      }}
                      onClick={() => navigateImage('prev')}
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-light position-absolute end-0 top-50 translate-middle-y me-2 shadow-sm"
                      style={{ 
                        width: '45px', 
                        height: '45px',
                        borderRadius: '50%',
                        zIndex: 10
                      }}
                      onClick={() => navigateImage('next')}
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                {hasMultipleImages && (
                  <div 
                    className="position-absolute bottom-0 start-50 translate-middle-x mb-3 px-3 py-1 text-white rounded-pill small"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
                    aria-live="polite"
                  >
                    {currentIndex + 1} / {imageUrlList.length}
                  </div>
                )}
                
                {/* Zoom Indicator */}
                <div 
                  className="position-absolute bottom-0 end-0 mb-3 me-3 px-2 py-1 text-white rounded small opacity-0 opacity-100-hover"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    transition: 'opacity 0.3s ease',
                    fontSize: '12px'
                  }}
                >
                  {isZoomed ? 'Click to zoom out' : 'Click to zoom in'}
                </div>
              </div>
            </div>
            
            {/* Right Side - Book Information */}
            <div className="col-12 col-lg-5 bg-white order-1 order-lg-1 d-flex flex-column" 
                 style={{ minHeight: 0, maxHeight: '100%' }}>
              {/* Fixed Header - Title and Author */}
              {bookInfo && (
                <div className="flex-shrink-0 border-bottom p-4 pb-3">
                  <h1 id="modal-title" className="h4 h3-lg fw-bold text-dark mb-2">{bookInfo.bookName}</h1>
                  {bookInfo.authorName && (
                    <div className="d-flex align-items-center text-primary mb-0">
                      <User size={16} className="me-2" />
                      <span>by {bookInfo.authorName}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Scrollable Content */}
              <div className="flex-grow-1 overflow-auto p-4 pt-3" style={{ minHeight: 0, paddingBottom: '100px' }}>
              {bookInfo && (
                <div>
                  {/* Tags */}
                  {bookInfo.bookTags && bookInfo.bookTags.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {bookInfo.bookTags.map((tag, index) => {
                        const tagInfo = getTagInfo(tag);
                        return (
                          <span key={index} className={`${tagInfo.className} d-flex align-items-center`}>
                            <span className="me-1" role="img" aria-label={tagInfo.label}>{tagInfo.icon}</span>
                            {tagInfo.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Price Section */}
                  {pricing && (
                    <div className="bg-light p-3 rounded border mb-3">
                      <div className="d-flex align-items-baseline flex-wrap gap-2 mb-2">
                        <span className="h4 text-danger fw-bold mb-0" aria-label={`Current price ₹${pricing.price.toFixed(2)}`}>
                          ₹{pricing.price.toFixed(2)}
                        </span>
                        {pricing.mrp > pricing.price && (
                          <>
                            <span className="text-muted text-decoration-line-through" aria-label={`Original price ₹${pricing.mrp.toFixed(2)}`}>
                              ₹{pricing.mrp.toFixed(2)}
                            </span>
                            <span className="badge bg-warning text-dark" aria-label={`${pricing.discount}% discount`}>
                              {pricing.discount}% OFF
                            </span>
                          </>
                        )}
                      </div>
                      <div className="d-flex justify-content-between align-items-center small text-muted">
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
                      <h3 className="h6 fw-bold text-dark border-bottom pb-2 mb-3">Description</h3>
                      <p className="text-muted lh-base small">
                        {bookInfo.description || bookInfo.bookDescription}
                      </p>
                    </div>
                  )}
                  
                  {/* Book Details */}
                  <div className="mb-4">
                    <h3 className="h6 fw-bold text-dark border-bottom pb-2 mb-3">Book Details</h3>
                    <div className="d-flex flex-column gap-2">
                      {bookInfo.category && (
                        <div className="d-flex align-items-center bg-light p-2 rounded border-start border-primary border-3">
                          <BookOpen size={16} className="me-2 text-primary" />
                          <span className="fw-semibold me-2" style={{ minWidth: '100px' }}>Category:</span>
                          <span className="text-dark">{bookInfo.category}</span>
                        </div>
                      )}
                      
                      {bookInfo.publisher && (
                        <div className="d-flex align-items-center bg-light p-2 rounded border-start border-primary border-3">
                          <Building2 size={16} className="me-2 text-primary" />
                          <span className="fw-semibold me-2" style={{ minWidth: '100px' }}>Publisher:</span>
                          <span className="text-dark">{bookInfo.publisher}</span>
                        </div>
                      )}
                      
                      {bookInfo.isbn && (
                        <div className="d-flex align-items-center bg-light p-2 rounded border-start border-primary border-3">
                          <Hash size={16} className="me-2 text-primary" />
                          <span className="fw-semibold me-2" style={{ minWidth: '100px' }}>ISBN:</span>
                          <span className="text-dark">{bookInfo.isbn}</span>
                        </div>
                      )}
                      
                      {bookInfo.year && (
                        <div className="d-flex align-items-center bg-light p-2 rounded border-start border-primary border-3">
                          <Calendar size={16} className="me-2 text-primary" />
                          <span className="fw-semibold me-2" style={{ minWidth: '100px' }}>Year:</span>
                          <span className="text-dark">{bookInfo.year}</span>
                        </div>
                      )}
                      
                      {bookInfo.edition && (
                        <div className="d-flex align-items-center bg-light p-2 rounded border-start border-primary border-3">
                          <Package size={16} className="me-2 text-primary" />
                          <span className="fw-semibold me-2" style={{ minWidth: '100px' }}>Edition:</span>
                          <span className="text-dark">{bookInfo.edition}</span>
                        </div>
                      )}
                      
                      {bookInfo.hsn && (
                        <div className="d-flex align-items-center bg-light p-2 rounded border-start border-primary border-3">
                          <Hash size={16} className="me-2 text-primary" />
                          <span className="fw-semibold me-2" style={{ minWidth: '100px' }}>HSN Code:</span>
                          <span className="text-dark">{bookInfo.hsn}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              </div>
              
              {/* Fixed Action Buttons Footer - Always visible for both mobile and desktop */}
              {(onAddToCart || onBuyNow) && (
                <div className="border-top bg-white p-3 mt-auto flex-shrink-0" 
                     style={{ 
                       position: 'absolute',
                       bottom: 0,
                       left: 0,
                       right: 0,
                       zIndex: 10,
                       boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
                     }}>
                  <div className="d-flex gap-3">
                    {onAddToCart && (
                      <button 
                        type="button"
                        className={`btn btn-outline-primary flex-fill py-3 px-4 fw-semibold ${cartLoading ? 'disabled' : ''}`}
                        onClick={handleAddToCart}
                        disabled={cartLoading}
                        aria-label="Add to shopping cart"
                        style={{ minHeight: '50px' }}
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
                            <span className="d-none d-md-inline">Add to Cart</span>
                            <span className="d-md-none">Add to Cart</span>
                          </>
                        )}
                      </button>
                    )}
                    
                    {onBuyNow && (
                      <button 
                        type="button"
                        className="btn btn-warning flex-fill text-white fw-bold py-3 px-4"
                        onClick={handleBuyNow}
                        aria-label="Buy now"
                        style={{ minHeight: '50px' }}
                      >
                        <Zap size={18} className="me-2" />
                        <span className="d-none d-md-inline">Buy Now</span>
                        <span className="d-md-none">Buy Now</span>
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