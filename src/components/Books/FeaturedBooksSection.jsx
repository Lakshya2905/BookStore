import React from 'react';
import { ArrowRight, Star } from 'lucide-react';
import styles from './FeaturedBooksSection.module.css';

const FeaturedBooksSection = ({ 
  books = [], 
  loading = false, 
  error = null, 
  onViewAllClick = () => {} 
}) => {
  const FeaturedBookCard = ({ book }) => (
    <div className={styles.featuredBookCard}>
      <div className={styles.bookCover}>
        <span className={styles.bookEmoji}>📚</span>
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
          <span className={styles.bookPrice}>${book.price}</span>
          <span className={styles.bookCategory}>{book.category}</span>
        </div>
        <div className={styles.bookActions}>
          <button className={styles.buyNowBtn}>Buy Now</button>
          <button className={styles.addToCartBtn}>Add to Cart</button>
        </div>
      </div>
    </div>
  );

  return (
    <section className={styles.featuredSection}>
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