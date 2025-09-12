import React, { useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { addItemToCart } from '../../api/addItemToCart';
import styles from './FeaturedBooksSection.module.css';

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

  const FeaturedBookCard = ({ book }) => (
    <div className={styles.featuredBookCard}>
      <div className={styles.bookCover}>
        {book.imageUrl ? (
          <img 
            src={book.imageUrl} 
            alt={book.bookName}
            className={styles.bookCoverImage}
          />
        ) : (
          <span className={styles.bookEmoji}>📚</span>
        )}
        <span className={styles.bookTag}>
          FEATURED
        </span>
      </div>
      <div className={styles.bookInfo}>
        <h3 className={styles.bookTitle}>{book.bookName}</h3>
        <p className={styles.bookAuthor}>by {book.authorName}</p>
        <div className={styles.bookRating}>
          <Star size={16} fill="#fbbf24" color="#fbbf24" />
          <span>4.5</span>
        </div>
        <div className={styles.bookFooter}>
          <span className={styles.bookPrice}>₹{book.price}</span>
          <span className={styles.bookCategory}>{book.category}</span>
        </div>
        <div className={styles.bookActions}>
          <button className={styles.buyNowBtn}>Buy Now</button>
          <button 
            className={`${styles.addToCartBtn} ${cartLoading[book.bookId] ? styles.loading : ''}`}
            onClick={() => handleAddToCart(book.bookId)}
            disabled={cartLoading[book.bookId]}
          >
            {cartLoading[book.bookId] ? (
              <>
                <div className={styles.buttonSpinner}></div>
                Adding...
              </>
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>
    </div>
  );

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
        <h2 className={styles.sectionTitle}>Featured This Week</h2>
        <p className={styles.sectionSubtitle}>Handpicked selections from our editorial team</p>
      </div>
      
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading featured books...</p>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className={styles.featuredBooks}>
            {books.map((book) => (
              <FeaturedBookCard key={book.bookId} book={book} />
            ))}
          </div>
          {books.length === 0 && (
            <div className={styles.noBooks}>
              <p>No featured books available at the moment.</p>
            </div>
          )}
        </>
      )}
      
      <div className={styles.sectionFooter}>
        <button className={styles.viewAllButton} onClick={onViewAllClick}>
          View All Books
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
};

export default FeaturedBooksSection;