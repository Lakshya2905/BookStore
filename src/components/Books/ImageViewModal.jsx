import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from './ImageViewModal.module.css';

const ImageViewModal = ({ 
  isOpen, 
  onClose, 
  bookInfo, 
  imageUrlList = [] 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset current index when modal opens or images change
  useEffect(() => {
    if (isOpen && imageUrlList.length > 0) {
      setCurrentIndex(0);
    }
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
          navigateImage('prev');
          break;
        case 'ArrowRight':
          navigateImage('next');
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, imageUrlList.length]);

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

  // Don't render if not open or no images
  if (!isOpen || !imageUrlList.length) {
    return null;
  }

  const currentImage = imageUrlList[currentIndex];
  const hasMultipleImages = imageUrlList.length > 1;

  return (
    <div className={styles.modal} onClick={handleBackdropClick}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        
        <div className={styles.modalBody}>
          {/* Image Container */}
          <div className={styles.modalImageContainer}>
            <img
              src={currentImage}
              alt={`${bookInfo?.bookName || 'Book'} - Image ${currentIndex + 1}`}
              className={styles.modalImage}
              onError={(e) => {
                console.error('Image failed to load:', currentImage);
                // You can add fallback image logic here if needed
              }}
            />
            
            {/* Navigation Buttons */}
            {hasMultipleImages && (
              <>
                <button
                  className={`${styles.modalNavButton} ${styles.modalNavPrev}`}
                  onClick={() => navigateImage('prev')}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  className={`${styles.modalNavButton} ${styles.modalNavNext}`}
                  onClick={() => navigateImage('next')}
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
          
          {/* Book Information */}
          {bookInfo && (
            <div className={styles.modalInfo}>
              <h3>{bookInfo.bookName}</h3>
              {bookInfo.authorName && (
                <p>by {bookInfo.authorName}</p>
              )}
              
              {/* Image Counter */}
              {hasMultipleImages && (
                <div className={styles.modalImageCounter}>
                  Image {currentIndex + 1} of {imageUrlList.length}
                </div>
              )}
              
              {/* Image Indicators */}
              {hasMultipleImages && (
                <div className={styles.modalIndicators}>
                  {imageUrlList.map((_, index) => (
                    <button
                      key={index}
                      className={`${styles.modalIndicator} ${
                        currentIndex === index ? styles.active : ''
                      }`}
                      onClick={() => setCurrentIndex(index)}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageViewModal;