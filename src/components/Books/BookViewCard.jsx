import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import styles from './BookViewCard.module.css';

const BookViewCard = ({ books, loading, error, showPagination = true }) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  const categoryFilter = searchParams.get('category');
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 12;
  
  // Filter books based on search query and category
  const filteredBooks = React.useMemo(() => {
    let filtered = books || [];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book => 
        book.bookName?.toLowerCase().includes(query) ||
        book.authorName?.toLowerCase().includes(query) ||
        book.category?.toLowerCase().includes(query) ||
        book.description?.toLowerCase().includes(query) ||
        book.bookTags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(book => 
        book.category === categoryFilter ||
        book.bookTags?.includes(categoryFilter)
      );
    }
    
    return filtered;
  }, [books, searchQuery, categoryFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const startIndex = (currentPage - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const currentBooks = filteredBooks.slice(startIndex, endIndex);

  // Display search results info
  const getResultsText = () => {
    if (searchQuery && categoryFilter) {
      return `Showing ${filteredBooks.length} results for "${searchQuery}" in ${categoryFilter}`;
    } else if (searchQuery) {
      return `Showing ${filteredBooks.length} results for "${searchQuery}"`;
    } else if (categoryFilter) {
      return `Showing ${filteredBooks.length} books in ${categoryFilter}`;
    } else {
      return `Showing ${filteredBooks.length} books`;
    }
  };

  const getTagText = (tag) => {
    const tagTexts = {
      BESTSELLER: 'Bestseller',
      NEW_RELEASE: 'New',
      TOP_RATED: 'Top Rated',
      SALE: 'Sale'
    };
    return tagTexts[tag] || tag;
  };

  const handleAddToCart = (book) => {
    // Add your cart logic here
    console.log('Adding to cart:', book);
  };

  const handleWishlist = (book) => {
    // Add your wishlist logic here
    console.log('Adding to wishlist:', book);
  };

  // BookCard Component
  const BookCard = ({ book }) => (
    <div className={styles.bookCard}>
      <div className={styles.bookImageContainer}>
        <div className={styles.bookImage}>
          <span className={styles.bookEmoji}>📚</span>
        </div>
        {book.bookTags && book.bookTags.map((tag, index) => (
          <span 
            key={`${tag}-${index}`} 
            className={styles.bookTag}
            style={{ top: `${8 + (index * 25)}px` }}
          >
            {getTagText(tag)}
          </span>
        ))}
        <div className={styles.bookActions}>
          <button 
            className={styles.actionBtn}
            onClick={() => handleWishlist(book)}
            title="Add to Wishlist"
          >
            <Heart size={16} />
          </button>
          <button 
            className={styles.actionBtn}
            onClick={() => handleAddToCart(book)}
            title="Add to Cart"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
      
      <div className={styles.bookDetails}>
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
          <span className={styles.ratingText}>4.5 (124 reviews)</span>
        </div>
        
        <div className={styles.bookCategory}>
          <span className={styles.categoryTag}>{book.category}</span>
        </div>
        
        {book.description && (
          <p className={styles.bookDescription}>
            {book.description.length > 100 
              ? `${book.description.substring(0, 100)}...` 
              : book.description
            }
          </p>
        )}
        
        <div className={styles.bookFooter}>
          <div className={styles.bookPrice}>
            <span className={styles.currentPrice}>${book.price}</span>
            {book.originalPrice && book.originalPrice > book.price && (
              <span className={styles.originalPrice}>${book.originalPrice}</span>
            )}
          </div>
          <button 
            className={styles.buyButton}
            onClick={() => handleAddToCart(book)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.bookViewContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading books...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.bookViewContainer}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bookViewContainer}>
      {(searchQuery || categoryFilter) && (
        <div className={styles.searchInfo}>
          <h3>{getResultsText()}</h3>
          {filteredBooks.length === 0 && (
            <div className={styles.noResults}>
              <p>No books found matching your criteria.</p>
              <p>Try adjusting your search or browse our categories.</p>
            </div>
          )}
        </div>
      )}
      
      {filteredBooks.length > 0 && (
        <>
          <div className={styles.booksGrid}>
            {currentBooks.map(book => (
              <BookCard key={book.bookId} book={book} />
            ))}
          </div>
          
          {/* Pagination */}
          {showPagination && totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={`${styles.pageBtn} ${currentPage === 1 ? styles.disabled : ''}`}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <div className={styles.pageNumbers}>
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      className={`${styles.pageBtn} ${currentPage === pageNum ? styles.active : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                className={`${styles.pageBtn} ${currentPage === totalPages ? styles.disabled : ''}`}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
          
          <div className={styles.resultsInfo}>
            <p>
              Showing {startIndex + 1} to {Math.min(endIndex, filteredBooks.length)} of {filteredBooks.length} books
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default BookViewCard;