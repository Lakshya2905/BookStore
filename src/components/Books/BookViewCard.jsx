import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { addItemToCart } from "../../api/addItemToCart";
import PlaceOrderModal from "../Order/PlaceOrderModal";
import styles from "./BookViewCard.module.css";

const BookViewCard = ({ books = [], loading, error, showPagination = true }) => {
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 12;
  const scrollContainerRef = useRef(null);

  
  // State for cart operations
  const [cartLoading, setCartLoading] = useState({});
  const [cartMessage, setCartMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  
  // State for slideshow - Changed to 5 seconds
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [slideshowIntervals, setSlideshowIntervals] = useState({});

  // State for Place Order Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(null);

  // State for Image Popup
  const [imagePopupOpen, setImagePopupOpen] = useState(false);
  const [popupImages, setPopupImages] = useState([]);
  const [popupCurrentIndex, setPopupCurrentIndex] = useState(0);
  const [popupBookName, setPopupBookName] = useState("");

  // Extract search parameters - this will trigger re-renders when URL changes
  const searchQuery = searchParams.get("search");
  const categoryFilter = searchParams.get("category");
  const tagFilter = searchParams.get("tag");

  // Force re-render trigger
  const [forceUpdateKey, setForceUpdateKey] = useState(0);

  // Load stored books from sessionStorage if no props given
  const storedBooks = useMemo(() => {
    try {
      const saved = sessionStorage.getItem("allBooks");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading books from sessionStorage:", e);
      return [];
    }
  }, []);

  // Decide which set of books to use - MOVED UP before any useEffect that uses it
  const sourceBooks = books.length > 0 ? books : storedBooks;

  // Listen for navigation changes from NavBar
  useEffect(() => {
    const handleNavigationChange = (event) => {
      console.log('Navigation change detected:', event.detail);
      setForceUpdateKey(prev => prev + 1);
    };

    window.addEventListener('navigationChange', handleNavigationChange);
    return () => {
      window.removeEventListener('navigationChange', handleNavigationChange);
    };
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    console.log('Filters changed:', { searchQuery, categoryFilter, tagFilter });
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, tagFilter, forceUpdateKey]);

  
  // Initialize current image indices for all books
  useEffect(() => {
    const initialIndices = {};
    sourceBooks.forEach(book => {
      const bookId = book.bookId || book.id;
      if (book.allImages && book.allImages.length > 0) {
        initialIndices[bookId] = 0;
      }
    });
    setCurrentImageIndex(prev => ({ ...prev, ...initialIndices }));
  }, [sourceBooks]);

  // Auto-slideshow for all books with multiple images - 5 second intervals
  useEffect(() => {
    const intervals = {};
    
    sourceBooks.forEach(book => {
      const bookId = book.bookId || book.id;
      const allImages = book.allImages || [];
      
      if (allImages.length > 1) {
        intervals[bookId] = setInterval(() => {
          setCurrentImageIndex(prev => ({
            ...prev,
            [bookId]: ((prev[bookId] || 0) + 1) % allImages.length
          }));
        }, 5000); // 5 seconds
      }
    });
    
    setSlideshowIntervals(intervals);
    
    // Cleanup on unmount
    return () => {
      Object.values(intervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [sourceBooks]);

  // Cleanup slideshow intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(slideshowIntervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [slideshowIntervals]);

  // Handle escape key for image popup
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!imagePopupOpen) return;
      
      if (event.key === 'Escape') {
        closeImagePopup();
      } else if (event.key === 'ArrowLeft') {
        navigatePopupImage(-1);
      } else if (event.key === 'ArrowRight') {
        navigatePopupImage(1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [imagePopupOpen, popupCurrentIndex, popupImages.length]);

  // Apply search + filters + sorting - Now properly reactive to URL changes
  const filteredBooks = useMemo(() => {
    console.log('Filtering books with:', { searchQuery, categoryFilter, tagFilter });
    
    let filtered = sourceBooks || [];

    const searchTerm = (searchQuery || "").toLowerCase().trim();
    const categoryTerm = (categoryFilter || "").toLowerCase().trim();
    const tagTerm = (tagFilter || "").toLowerCase().trim();

    if (searchTerm) {
      filtered = filtered.filter(
        (book) =>
          book.bookName?.toLowerCase().includes(searchTerm) ||
          book.authorName?.toLowerCase().includes(searchTerm) ||
          book.category?.toLowerCase().includes(searchTerm) ||
          (book.bookTags?.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    if (categoryTerm) {
      filtered = filtered.filter(
        (book) => book.category?.toLowerCase().includes(categoryTerm)
      );
    }

    if (tagTerm) {
      filtered = filtered.filter((book) =>
        book.bookTags?.some(tag => 
          tag.toLowerCase().replace(/\s+/g, '').includes(tagTerm.replace(/\s+/g, '')) ||
          tag.toLowerCase().includes(tagTerm)
        )
      );
    }

    // Sort by priority in ascending order
    filtered.sort((a, b) => {
      const priorityA = a.priority || Number.MAX_SAFE_INTEGER;
      const priorityB = b.priority || Number.MAX_SAFE_INTEGER;
      return priorityA - priorityB;
    });

    console.log(`Filtered and sorted ${filtered.length} books from ${sourceBooks.length} total`);
    return filtered;
  }, [sourceBooks, searchQuery, categoryFilter, tagFilter]);

  // Pagination logic
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = showPagination
    ? filteredBooks.slice(indexOfFirstBook, indexOfLastBook)
    : filteredBooks;
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  // Function to get current image for a book
  const getCurrentImage = (book) => {
    const bookId = book.bookId || book.id;
    const allImages = book.allImages || [];
    
    if (allImages.length === 0) {
      return book.coverImageUrl || null;
    }
    
    const currentIndex = currentImageIndex[bookId] || 0;
    return allImages[currentIndex]?.imageUrl || book.coverImageUrl || null;
  };

  // Function to handle image click - open popup
  const handleImageClick = (book) => {
    const allImages = book.allImages || [];
    const bookId = book.bookId || book.id;
    
    // If no additional images, use cover image
    const imagesToShow = allImages.length > 0 
      ? allImages.map(img => img.imageUrl) 
      : book.coverImageUrl 
        ? [book.coverImageUrl] 
        : [];
    
    if (imagesToShow.length === 0) return;
    
    setPopupImages(imagesToShow);
    setPopupCurrentIndex(currentImageIndex[bookId] || 0);
    setPopupBookName(book.bookName);
    setImagePopupOpen(true);
  };

  // Function to close image popup
  const closeImagePopup = () => {
    setImagePopupOpen(false);
    setPopupImages([]);
    setPopupCurrentIndex(0);
    setPopupBookName("");
  };

  // Function to navigate in popup
  const navigatePopupImage = (direction) => {
    if (popupImages.length <= 1) return;
    
    setPopupCurrentIndex(prev => {
      const newIndex = prev + direction;
      if (newIndex < 0) return popupImages.length - 1;
      if (newIndex >= popupImages.length) return 0;
      return newIndex;
    });
  };

  // Function to handle image load error
  const handleImageError = (bookId) => {
    console.warn(`Failed to load image for book ${bookId}`);
  };

  // Function to calculate discount percentage
  const calculateDiscountPercentage = (book) => {
    if (!book.mrp || !book.discount || book.discount <= 0) return 0;
    return Math.round((book.discount / book.mrp) * 100);
  };

  // Function to get display price
  const getDisplayPrice = (book) => {
    return book.price || book.mrp || 0;
  };

  // Handle Add to Cart
  const handleAddToCart = async (bookId) => {
    setCartLoading(prev => ({ ...prev, [bookId]: true }));
    setCartMessage("");
    
    try {
      const response = await addItemToCart(bookId);
      
      setMessageType(response.status);
      setCartMessage(response.message || "Operation completed");
      
      setTimeout(() => {
        setCartMessage("");
        setMessageType("");
      }, 3000);
      
    } catch (error) {
      setMessageType("FAILED");
      setCartMessage(error.response?.data?.message || error.message || "Failed to add item to cart");
      
      setTimeout(() => {
        setCartMessage("");
        setMessageType("");
      }, 3000);
    } finally {
      setCartLoading(prev => ({ ...prev, [bookId]: false }));
    }
  };

  // Handle Buy Now - Open Place Order Modal
  const handleBuyNow = (bookId) => {
    setSelectedBookId(bookId);
    setOrderModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setOrderModalOpen(false);
    setSelectedBookId(null);
  };

  // Get message styling based on status
  const getMessageClass = (status) => {
    switch (status) {
      case "SUCCESS":
      case "AUTHORIZED":
        return styles.messageSuccess;
      case "FAILED":
      case "UNAUTHORIZED":
        return styles.messageError;
      case "NOT_FOUND":
        return styles.messageWarning;
      default:
        return styles.messageInfo;
    }
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: 'smooth'
      });
    }
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner}></div><p>Loading books...</p></div>;
  if (error) return <div className={styles.error}><p>Error loading books.</p></div>;

  return (
    <div className={styles.container}>
     
      {/* Cart Message Display */}
      {cartMessage && (
        <div className={`${styles.message} ${getMessageClass(messageType)}`}>
          <div className={styles.messageContent}>
            <span>{cartMessage}</span>
            <button 
              className={styles.messageClose}
              onClick={() => {
                setCartMessage("");
                setMessageType("");
              }}
              type="button"
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading books...</p>
        </div>
      )}
      
      {error && (
        <div className={styles.error}>
          <p>Error loading books. Please try again.</p>
        </div>
      )}
      
      {!loading && !error && filteredBooks.length === 0 && (
        <div className={styles.noBooks}>
          <h2>No books found</h2>
          <p>
            {searchQuery && `No results for "${searchQuery}"`}
            {categoryFilter && ` in category "${categoryFilter}"`}
            {tagFilter && ` with tag "${tagFilter}"`}
          </p>
          <p>Try adjusting your search or filters to find more books</p>
        </div>
      )}
      
      {!loading && !error && filteredBooks.length > 0 && (
        <>
          <div className={styles.scrollContainer}>
            <button 
              className={`${styles.scrollButton} ${styles.scrollLeft}`}
              onClick={scrollLeft}
              type="button"
              aria-label="Scroll left"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"></polyline>
              </svg>
            </button>
            
            <div className={styles.booksGrid} ref={scrollContainerRef}>
              {currentBooks.map((book) => {
                const bookId = book.bookId || book.id;
                const allImages = book.allImages || [];
                const currentImage = getCurrentImage(book);
                const hasMultipleImages = allImages.length > 1;
                const currentIndex = currentImageIndex[bookId] || 0;
                const discountPercentage = book.discount;
                const displayPrice = getDisplayPrice(book);
                
                return (
                  <article key={bookId} className={styles.bookCard}>
                    <div className={styles.bookImageContainer}>
                      <div 
                        className={styles.bookImage}
                        onClick={() => handleImageClick(book)}
                      >
                        {currentImage ? (
                          <img 
                            key={`${bookId}-${currentIndex}`}
                            src={currentImage} 
                            alt={`${book.bookName} - Image ${currentIndex + 1}`}
                            className={`${styles.bookCover} ${styles.fadeIn}`}
                            loading="lazy"
                            onError={() => handleImageError(bookId)}
                            style={{
                              transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
                              opacity: 1,
                              transform: 'scale(1)'
                            }}
                          />
                        ) : (
                          <div className={styles.bookPlaceholder}>
                            <div className={styles.placeholderIcon}>📚</div>
                            <div className={styles.placeholderText}>No Image</div>
                          </div>
                        )}
                      </div>

                      {/* Discount Badge */}
                      {discountPercentage > 0 && (
                        <div className={styles.discountBadge}>
                          {discountPercentage}% OFF
                        </div>
                      )}
                      
                      <button className={styles.infoButton} type="button" aria-label="Book details">
                        ℹ
                      </button>

                      <div className={styles.tooltip}>
                        <div className={styles.tooltipContent}>
                          <div>
                            <h4>{book.bookName}</h4>
                            <p className={styles.tooltipAuthor}>by {book.authorName}</p>
                            <div className={styles.tooltipDescription}>
                              {book.description || book.bookDescription || "No description available for this book."}
                            </div>
                            
                            {/* Additional Book Details */}
                            <div className={styles.tooltipDetails}>
                              {book.publisher && (
                                <div className={styles.tooltipDetailItem}>
                                  <span className={styles.tooltipDetailLabel}>Publisher:</span>
                                  <span className={styles.tooltipDetailValue}>{book.publisher}</span>
                                </div>
                              )}
                              {book.isbn && (
                                <div className={styles.tooltipDetailItem}>
                                  <span className={styles.tooltipDetailLabel}>ISBN:</span>
                                  <span className={styles.tooltipDetailValue}>{book.isbn}</span>
                                </div>
                              )}
                              {book.year && (
                                <div className={styles.tooltipDetailItem}>
                                  <span className={styles.tooltipDetailLabel}>Year:</span>
                                  <span className={styles.tooltipDetailValue}>{book.year}</span>
                                </div>
                              )}
                              {book.edition && (
                                <div className={styles.tooltipDetailItem}>
                                  <span className={styles.tooltipDetailLabel}>Edition:</span>
                                  <span className={styles.tooltipDetailValue}>{book.edition}</span>
                                </div>
                              )}
                            </div>
                            
                            {hasMultipleImages && (
                              <div className={styles.tooltipImageInfo}>
                                {allImages.length} images available
                              </div>
                            )}
                          </div>
                          <div className={styles.tooltipFooter}>
                            <div className={styles.tooltipPriceContainer}>
                              {book.discount > 0 ? (
                                <div className={styles.tooltipPriceWithDiscount}>
                                  <span className={styles.tooltipPrice}>₹{displayPrice}</span>
                                  <span className={styles.tooltipMrp}>₹{book.mrp}</span>
                                  {book.gst > 0 && (
                                    <div className={styles.tooltipGst}>Inclusive of GST</div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <span className={styles.tooltipPrice}>₹{displayPrice}</span>
                                  {book.gst > 0 && (
                                    <div className={styles.tooltipGst}>Inclusive of GST</div>
                                  )}
                                </div>
                              )}
                            </div>
                            {book.category && (
                              <span className={styles.tooltipCategory}>{book.category}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {book.bookTags && book.bookTags.length > 0 && (
                        <div className={`${styles.bookTag} ${styles[book.bookTags[0].toLowerCase().replace(/\s+/g, '')] || styles.defaultTag}`}>
                          {book.bookTags[0]}
                        </div>
                      )}
                    </div>

                    <div className={styles.bookInfo}>
                      <h3 className={styles.bookTitle}>{book.bookName}</h3>
                      <h3 className={styles.bookAuthor}>by {book.authorName}</h3>
                      
                      <div className={styles.bookFooter}>
                        <div className={styles.priceContainer}>
                          {book.discount > 0 ? (
                            <div className={styles.priceWithDiscount}>
                              <span className={styles.bookPrice}>₹{displayPrice}</span>
                              <span className={styles.bookMrp}>₹{book.mrp}</span>
                              {book.gst > 0 && (
                                <div className={styles.gstText}>Inclusive of GST</div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className={styles.bookPrice}>₹{displayPrice}</span>
                              {book.gst > 0 && (
                                <div className={styles.gstText}>Inclusive of GST</div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={styles.bookMeta}>
                          {book.category && (
                            <span className={styles.bookCategory}>{book.category}</span>
                          )}
                          {hasMultipleImages && (
                            <span className={styles.imageCount}>📷 {allImages.length}</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.bookActions}>
                        <div className={styles.actionButtons}>
                          <button 
                            className={`${styles.addToCartButton} ${cartLoading[bookId] ? styles.loading : ''}`}
                            onClick={() => handleAddToCart(bookId)}
                            disabled={cartLoading[bookId]}
                            type="button"
                          >
                            {cartLoading[bookId] ? (
                              <>
                                <div className={styles.buttonSpinner}></div>
                                Adding...
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="9" cy="21" r="1"/>
                                  <circle cx="20" cy="21" r="1"/>
                                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                </svg>
                                Add to Cart
                              </>
                            )}
                          </button>
                          <button 
                            className={styles.checkoutButton} 
                            type="button"
                            onClick={() => handleBuyNow(bookId)}
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <button 
              className={`${styles.scrollButton} ${styles.scrollRight}`}
              onClick={scrollRight}
              type="button"
              aria-label="Scroll right"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
          </div>

          {showPagination && totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Book pagination">
              <button 
                className={styles.pageButton}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                type="button"
                aria-label="Go to previous page"
              >
                ← Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`${styles.pageButton} ${styles.pageNumber} ${
                      currentPage === pageNum ? styles.active : ""
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                    type="button"
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={currentPage === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                className={styles.pageButton}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                type="button"
                aria-label="Go to next page"
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}

      {/* Image Popup Modal */}
      {imagePopupOpen && (
        <div className={styles.imagePopupOverlay} onClick={closeImagePopup}>
          <div className={styles.imagePopupBlur}></div>
          <div className={styles.imagePopupContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.popupCloseButton}
              onClick={closeImagePopup}
              type="button"
              aria-label="Close image popup"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div className={styles.popupImageContainer}>
              {popupImages.length > 1 && (
                <button
                  className={`${styles.popupNavButton} ${styles.popupNavLeft}`}
                  onClick={() => navigatePopupImage(-1)}
                  type="button"
                  aria-label="Previous image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,18 9,12 15,6"></polyline>
                  </svg>
                </button>
              )}
              
              <img
                src={popupImages[popupCurrentIndex]}
                alt={`${popupBookName} - Image ${popupCurrentIndex + 1}`}
                className={styles.popupImage}
              />
              
              {popupImages.length > 1 && (
                <button
                  className={`${styles.popupNavButton} ${styles.popupNavRight}`}
                  onClick={() => navigatePopupImage(1)}
                  type="button"
                  aria-label="Next image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"></polyline>
                  </svg>
                </button>
              )}
            </div>
            
            <div className={styles.popupImageInfo}>
              <h3>{popupBookName}</h3>
              {popupImages.length > 1 && (
                <p>Image {popupCurrentIndex + 1} of {popupImages.length}</p>
              )}
            </div>
            
            {popupImages.length > 1 && (
              <div className={styles.popupImageIndicators}>
                {popupImages.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.popupIndicator} ${
                      index === popupCurrentIndex ? styles.active : ''
                    }`}
                    onClick={() => setPopupCurrentIndex(index)}
                    type="button"
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Place Order Modal */}
      <PlaceOrderModal
        isOpen={orderModalOpen}
        onClose={handleModalClose}
        bookId={selectedBookId}
      />
    </div>
  );
};

export default BookViewCard;