import React, { useState, useMemo } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { addItemToCart } from '../../api/addItemToCart';
import styles from './FeaturedBooksSection.module.css';

import logo from '../../images/logo.jpg';

const FeaturedBooksSection = ({ 
  books = [], 
  loading = false, 
  error = null, 
  onViewAllClick = () => {} 
}) => {
  // State for cart operations
  const [cartLoading, setCartLoading] = useState({});
  const [cartMessage, setCartMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // SUCCESS, FAILED, etc.
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 12; // 4 books per row × 3 rows

  // Organize books by tags
  const organizedBooks = useMemo(() => {
    const newReleases = books.filter(book => 
      book.bookTags?.includes('NEW_RELEASE')
    );
    const bestsellers = books.filter(book => 
      book.bookTags?.includes('BESTSELLER')
    );
    const topRated = books.filter(book => 
      book.bookTags?.includes('TOP_RATED')
    );
    
    return {
      newReleases,
      bestsellers,
      topRated,
      all: books
    };
  }, [books]);

  // Pagination logic
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(books.length / booksPerPage);

  // Handle Add to Cart
  const handleAddToCart = async (bookId) => {
    setCartLoading(prev => ({ ...prev, [bookId]: true }));
    setCartMessage("");
    
    try {
      const response = await addItemToCart(bookId);
      
      // Show success/failure message based on response
      setMessageType(response.status);
      setCartMessage(response.message || "Operation completed");
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setCartMessage("");
        setMessageType("");
      }, 3000);
      
    } catch (error) {
      setMessageType("FAILED");
      setCartMessage(error.response?.data?.message || error.message || "Failed to add item to cart");
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setCartMessage("");
        setMessageType("");
      }, 3000);
    } finally {
      setCartLoading(prev => ({ ...prev, [bookId]: false }));
    }
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

  // Get tag display name and style
  const getTagInfo = (tag) => {
    switch (tag) {
      case 'NEW_RELEASE':
        return { label: 'New Release', className: styles.newRelease };
      case 'BESTSELLER':
        return { label: 'Bestseller', className: styles.bestseller };
      case 'TOP_RATED':
        return { label: 'Top Rated', className: styles.topRated };
      default:
        return { label: 'Featured', className: styles.defaultTag };
    }
  };

  const FeaturedBookCard = ({ book }) => {
    const primaryTag = book.bookTags?.[0] || 'FEATURED';
    const tagInfo = getTagInfo(primaryTag);
    
    return (
      <div className={styles.featuredBookCard}>
        <div className={styles.bookCover}>
          {book.imageUrl ? (
            <img 
              src={book.imageUrl} 
              alt={book.bookName}
              className={styles.bookCoverImage}
              loading="lazy"
            />
          ) : (
            <div className={styles.bookPlaceholder}>📚</div>
          )}
          <span className={`${styles.bookTag} ${tagInfo.className}`}>
            {tagInfo.label}
          </span>
          
          {/* Quick view overlay */}
          <div className={styles.quickViewOverlay}>
            <button className={styles.quickViewBtn} type="button">
              Quick View
            </button>
          </div>
        </div>
        
        <div className={styles.bookInfo}>
          <h3 className={styles.bookTitle}>{book.bookName}</h3>
          <p className={styles.bookAuthor}>by {book.authorName}</p>
          
          <div className={styles.bookRating}>
            <div className={styles.stars}>
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={14} 
                  fill={i < 4 ? "#fbbf24" : "none"} 
                  color="#fbbf24" 
                />
              ))}
            </div>
            <span className={styles.ratingText}>4.5</span>
          </div>
          
          <div className={styles.bookMeta}>
            <span className={styles.bookPrice}>₹{book.price}</span>
            {book.category && (
              <span className={styles.bookCategory}>{book.category}</span>
            )}
          </div>
          
          <div className={styles.bookActions}>
            <button 
              className={`${styles.addToCartBtn} ${cartLoading[book.bookId] ? styles.loading : ''}`}
              onClick={() => handleAddToCart(book.bookId)}
              disabled={cartLoading[book.bookId]}
              type="button"
            >
              {cartLoading[book.bookId] ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  Adding...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  Add to Cart
                </>
              )}
            </button>
            <button className={styles.buyNowBtn} type="button">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render books in rows
  const renderBooksInRows = (booksToRender) => {
    const rows = [];
    for (let i = 0; i < booksToRender.length; i += 4) {
      const rowBooks = booksToRender.slice(i, i + 4);
      rows.push(
        <div key={i} className={styles.bookRow}>
          {rowBooks.map((book) => (
            <FeaturedBookCard key={book.bookId} book={book} />
          ))}
        </div>
      );
    }
    return rows;
  };

  return (
    <section className={styles.featuredSection}>
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

      <div className={styles.sectionHeader}>
        <div className={styles.headerContent}>
          <h2 className={styles.sectionTitle}>Featured This Week</h2>
          <p className={styles.sectionSubtitle}>Handpicked selections from our editorial team</p>
        </div>
        
        {/* Tag filters */}
        <div className={styles.tagFilters}>
          <span className={styles.filterLabel}>Browse by:</span>
          <div className={styles.tagButtons}>
            <button className={`${styles.tagButton} ${styles.newRelease}`} type="button">
              New Releases ({organizedBooks.newReleases.length})
            </button>
            <button className={`${styles.tagButton} ${styles.bestseller}`} type="button">
              Bestsellers ({organizedBooks.bestsellers.length})
            </button>
            <button className={`${styles.tagButton} ${styles.topRated}`} type="button">
              Top Rated ({organizedBooks.topRated.length})
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading featured books...</p>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <div className={styles.errorContent}>
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.booksContainer}>
            {currentBooks.length > 0 ? (
              renderBooksInRows(currentBooks)
            ) : (
              <div className={styles.noBooks}>
                <div className={styles.noBooksContent}>
                  <h3>No featured books available</h3>
                  <p>Check back soon for our latest picks!</p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Featured books pagination">
              <button 
                className={styles.pageButton}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                type="button"
                aria-label="Go to previous page"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
                Previous
              </button>
              
              <div className={styles.pageNumbers}>
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
              </div>
              
              <button 
                className={styles.pageButton}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                type="button"
                aria-label="Go to next page"
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>
            </nav>
          )}
        </>
      )}
      
      <div className={styles.sectionFooter}>
        <button className={styles.viewAllButton} onClick={onViewAllClick} type="button">
          <span>View All Books</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
};

export default FeaturedBooksSection;