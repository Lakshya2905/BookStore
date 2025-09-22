import React, { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { addItemToCart } from "../../api/addItemToCart";
import PlaceOrderModal from "../Order/PlaceOrderModal";
import ImageViewModal from "./ImageViewModal";
import styles from "./BookViewCard.module.css";

// Load Bootstrap CSS dynamically
const loadBootstrap = () => {
  if (document.getElementById('bookview-bootstrap')) return;
  const link = document.createElement('link');
  link.id = 'bookview-bootstrap';
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
  document.head.appendChild(link);
};

const BookViewCard = ({ books = [], loading, error, showPagination = true }) => {
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 12;
  const scrollContainerRef = useRef(null);

  // Load Bootstrap when component mounts
  useEffect(() => {
    loadBootstrap();
  }, []);

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

  // State for Image View Modal
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedBookForImage, setSelectedBookForImage] = useState(null);
  const [selectedImageList, setSelectedImageList] = useState([]);

  // State for image errors
  const [imageErrors, setImageErrors] = useState({});

  // Extract search parameters
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

  // Decide which set of books to use
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

  // Function to get all available images for a book
  const getBookImages = (book) => {
    const images = [];
    const bookId = book.bookId || book.id;
    
    // Add coverImageUrl if available
    if (book.coverImageUrl && book.coverImageUrl.trim() && !imageErrors[`${bookId}-cover`]) {
      images.push({ url: book.coverImageUrl, type: 'cover', key: `${bookId}-cover` });
    }
    
    // Add imageUrl if different from coverImageUrl
    if (book.imageUrl && book.imageUrl.trim() && 
        book.imageUrl !== book.coverImageUrl && 
        !imageErrors[`${bookId}-main`]) {
      images.push({ url: book.imageUrl, type: 'main', key: `${bookId}-main` });
    }
    
    // Add allImages if available
    if (book.allImages && Array.isArray(book.allImages)) {
      book.allImages.forEach((imgObj, index) => {
        const imgUrl = imgObj.imageUrl || imgObj.url || imgObj;
        if (imgUrl && imgUrl.trim() && 
            imgUrl !== book.coverImageUrl && 
            imgUrl !== book.imageUrl &&
            !imageErrors[`${bookId}-all-${index}`]) {
          images.push({ 
            url: imgUrl, 
            type: 'additional', 
            key: `${bookId}-all-${index}` 
          });
        }
      });
    }
    
    return images;
  };

  // Function to get current display image
  const getCurrentImage = (book) => {
    const allImages = getBookImages(book);
    if (allImages.length === 0) return null;
    
    const bookId = book.bookId || book.id;
    const currentIndex = currentImageIndex[bookId] || 0;
    return allImages[Math.min(currentIndex, allImages.length - 1)] || allImages[0];
  };

  // Initialize current image indices for all books
  useEffect(() => {
    const initialIndices = {};
    sourceBooks.forEach(book => {
      const bookId = book.bookId || book.id;
      const allImages = getBookImages(book);
      if (allImages.length > 0) {
        initialIndices[bookId] = 0;
      }
    });
    setCurrentImageIndex(prev => ({ ...prev, ...initialIndices }));
  }, [sourceBooks, imageErrors]);

  // Auto-slideshow for all books with multiple images - 5 second intervals
  useEffect(() => {
    const intervals = {};
    
    sourceBooks.forEach(book => {
      const bookId = book.bookId || book.id;
      const allImages = getBookImages(book);
      
      if (allImages.length > 1) {
        intervals[bookId] = setInterval(() => {
          setCurrentImageIndex(prev => ({
            ...prev,
            [bookId]: ((prev[bookId] || 0) + 1) % allImages.length
          }));
        }, 500000000); // 5 seconds
      }
    });
    
    setSlideshowIntervals(intervals);
    
    // Cleanup on unmount
    return () => {
      Object.values(intervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [sourceBooks, imageErrors]);

  // Cleanup slideshow intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(slideshowIntervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [slideshowIntervals]);

  // Function to handle image error
  const handleImageError = (imageKey) => {
    setImageErrors(prev => ({ ...prev, [imageKey]: true }));
  };

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

  // Updated function to handle image click - open new modal
  const handleImageClick = (book) => {
    const allImages = getBookImages(book);
    
    // Build image URL list from all available sources
    const imageUrls = allImages.map(img => img.url);
    
    // If no images available, don't open modal
    if (imageUrls.length === 0) return;
    
    setSelectedBookForImage(book);
    setSelectedImageList(imageUrls);
    setImageModalOpen(true);
  };

  // Function to close image modal
  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedBookForImage(null);
    setSelectedImageList([]);
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
                const allImages = getBookImages(book);
                const currentImage = getCurrentImage(book);
                const hasMultipleImages = allImages.length > 1;
                const currentIndex = currentImageIndex[bookId] || 0;
                const discountPercentage = book.discount;
                const displayPrice = getDisplayPrice(book);
                
                return (
                  <article key={bookId} className={styles.bookCard}>
                    <div className={styles.imageContainer}>
                      <div className={styles.imageWrapper}>
                        {currentImage ? (
                          <img 
                            key={`${bookId}-${currentIndex}`}
                            src={currentImage.url} 
                            alt={`${book.bookName} - Image ${currentIndex + 1}`}
                            className={styles.bookImage}
                            loading="lazy"
                            onError={() => handleImageError(currentImage.key)}
                            onClick={() => handleImageClick(book)}
                            style={{ cursor: 'pointer' }}
                          />
                        ) : (
                          <div 
                            className={styles.noImage}
                            onClick={() => handleImageClick(book)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className={styles.noImageIcon}>📚</div>
                            <div className={styles.noImageText}>No Image</div>
                          </div>
                        )}
                        
                        {/* Image Indicators */}
                        {hasMultipleImages && (
                          <div className={styles.imageIndicators}>
                            {allImages.map((_, index) => (
                              <div
                                key={index}
                                className={`${styles.indicator} ${
                                  (currentImageIndex[bookId] || 0) === index ? styles.active : ''
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Discount Badge */}
                      {discountPercentage > 0 && (
                        <div className={styles.discountBadge}>
                          {discountPercentage}% OFF
                        </div>
                      )}

                      {/* Book Tags */}
                      {book.bookTags && book.bookTags.length > 0 && (
                        <div className={`${styles.categoryTag} ${styles[book.bookTags[0].toLowerCase().replace(/\s+/g, '')] || styles.defaultTag}`}>
                          {book.bookTags[0]}
                        </div>
                      )}
                      
                      <button className={styles.infoButton} type="button" aria-label="Book details">
                        ℹ
                      </button>

                      <div className={styles.tooltip}>
                        <div className={styles.tooltipContent}>
                          <div>
                            <h4>{book.bookName}</h4>
                            <p className={styles.tooltipAuthor} >by {book.authorName}</p>
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
                    </div>

                    <div className={styles.bookDetails}>
                      <h3 className={styles.bookTitle}>{book.bookName}</h3>
                      <p className={styles.bookAuthor} onClick={() => handleImageClick(book)}>by {book.authorName}</p>
                      {/* <p className={styles.bookDescription}>
                        {book.description || book.bookDescription || "A fascinating read that will captivate your imagination."}
                      </p> */}
                  
                      <div className={styles.bookMeta}>
                        <div className={styles.priceInfo}>
                          {book.discount > 0 ? (
                            <div className={styles.priceWithDiscount}>
                              <span className={styles.currentPrice}>₹{displayPrice}</span>
                              <span className={styles.originalPrice}>₹{book.mrp}</span>
                              {book.gst > 0 && (
                                <div className={styles.gstText}>Inclusive of GST</div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className={styles.currentPrice}>₹{displayPrice}</span>
                              {book.gst > 0 && (
                                <div className={styles.gstText}>Inclusive of GST</div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={styles.bookMetaRight}>
                          {book.category && (
                            <span className={styles.categoryBadge}>{book.category}</span>
                          )}
                          {hasMultipleImages && (
                            <span className={styles.imageCount}>📷 {allImages.length}</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.actions}>
                        <button 
                          className={`${styles.cartButton} ${cartLoading[bookId] ? styles.loading : ''}`}
                          onClick={() => handleAddToCart(bookId)}
                          disabled={cartLoading[bookId]}
                          type="button"
                        >
                          {cartLoading[bookId] ? (
                            <>
                              <div className={styles.spinner}></div>
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
                          className={styles.buyButton} 
                          type="button"
                          onClick={() => handleBuyNow(bookId)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
                          </svg>
                          Buy Now
                        </button>
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


      {/* ImageViewModal component */}
      <ImageViewModal
        isOpen={imageModalOpen}
        onClose={closeImageModal}
        bookInfo={selectedBookForImage}
        imageUrlList={selectedImageList}
        onAddToCart={handleAddToCart}           
        onBuyNow={handleBuyNow}      
      />

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