import React, { useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./BookViewCard.module.css";

const BookViewCard = ({ books = [], loading, error, showPagination = true  }) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search");
  const categoryFilter = searchParams.get("category");
  const tagFilter = searchParams.get("tag");
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 12;
  const scrollContainerRef = useRef(null);

  // 🔹 Load stored books from sessionStorage if no props given
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

  // 🔍 Apply search + filters
  const filteredBooks = useMemo(() => {
  let filtered = sourceBooks || [];

  const searchTerm = (searchQuery || "").toLowerCase();
  const categoryTerm = (categoryFilter || "").toLowerCase();
  const tagTerm = (tagFilter || "").toLowerCase();

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
      book.bookTags?.some(
        tag => tag.toLowerCase().includes(tagTerm)
      )
    );
  }

  return filtered;
}, [sourceBooks, searchQuery, categoryFilter, tagFilter]);

  // Pagination logic
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = showPagination
    ? filteredBooks.slice(indexOfFirstBook, indexOfLastBook)
    : filteredBooks;
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320, // Approximate width of one card plus gap
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320, // Approximate width of one card plus gap
        behavior: 'smooth'
      });
    }
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner}></div><p>Loading books...</p></div>;
  if (error) return <div className={styles.error}><p>Error loading books.</p></div>;

  return (
  <div className={styles.container}>
    <div className={styles.header}>
      <h1 className={styles.title}>Book Collection</h1>
      <p className={styles.subtitle}>
        Discover your next great read from our curated collection
      </p>
    </div>
    
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
            {currentBooks.map((book) => (
              <article key={book.bookId} className={styles.bookCard}>
                <div className={styles.bookImageContainer}>
                  <div className={styles.bookImage}>
                    {book.imageUrl ? (
                      <img 
                        src={book.imageUrl} 
                        alt={book.bookName}
                        className={styles.bookCover}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.bookPlaceholder}>📚</div>
                    )}
                  </div>
                  
                  {/* Info Button */}
                  <button className={styles.infoButton} type="button" aria-label="Book details">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                  </button>

                  {/* Tooltip */}
                  <div className={styles.tooltip}>
                    <div className={styles.tooltipContent}>
                      <div>
                        <h4>{book.bookName}</h4>
                        <p className={styles.tooltipAuthor}>by {book.authorName}</p>
                        <div className={styles.tooltipDescription}>
                          {book.description || book.bookDescription || "No description available for this book."}
                        </div>
                      </div>
                      <div className={styles.tooltipFooter}>
                        <span className={styles.tooltipPrice}>₹{book.price}</span>
                        {book.category && (
                          <span className={styles.tooltipCategory}>{book.category}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Book Tags */}
                  {book.bookTags && book.bookTags.length > 0 && (
                    <div className={`${styles.bookTag} ${styles[book.bookTags[0].toLowerCase().replace(/\s+/g, '')] || styles.defaultTag}`}>
                      {book.bookTags[0]}
                    </div>
                  )}
                </div>

                <div className={styles.bookInfo}>
                  <h3 className={styles.bookTitle}>{book.bookName}</h3>
                  <p className={styles.bookAuthor}>by {book.authorName}</p>
                  <p className={styles.bookDescription}>
                    {book.description || book.bookDescription || "A fascinating read that will captivate your imagination."}
                  </p>
                  
                  <div className={styles.bookFooter}>
                    <span className={styles.bookPrice}>₹{book.price}</span>
                    {book.category && (
                      <span className={styles.bookCategory}>{book.category}</span>
                    )}
                  </div>

                  <div className={styles.bookActions}>
                    <div className={styles.quantityControl}>
                      <button className={styles.quantityButton} type="button" aria-label="Decrease quantity">
                        −
                      </button>
                      <span className={styles.quantity}>1</span>
                      <button className={styles.quantityButton} type="button" aria-label="Increase quantity">
                        +
                      </button>
                    </div>
                    
                    <div className={styles.actionButtons}>
                      <button className={styles.addToCartButton} type="button">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="21" r="1"/>
                          <circle cx="20" cy="21" r="1"/>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                        Add to Cart
                      </button>
                      <button className={styles.checkoutButton} type="button">
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
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

        {/* Pagination */}
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
  </div>
);
  
};

export default BookViewCard;