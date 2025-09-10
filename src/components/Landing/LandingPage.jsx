import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import axios from 'axios';
import CategoriesView from '../Books/CategoriesView';
import BookViewCard from '../Books/BookViewCard';
import styles from './LandingPage.module.css';
import { BOOK_FETCH_URL, CATRGORY_FETCH_URL } from '../../constants/apiConstants';

const LandingPage = () => {
  const [allBooks, setAllBooks] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [previewBooks, setPreviewBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalCategories: 0,
    averageRating: 4.5
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  
  // Available tags for filtering
  const bookTags = [
    { key: 'ALL', label: 'All Books' },
    { key: 'NEW_RELEASE', label: 'New Release' },
    { key: 'BESTSELLER', label: 'Bestseller' },
    { key: 'TOP_RATED', label: 'Top Rated' },
    { key: 'SALE', label: 'On Sale' }
  ];
  
  useEffect(() => {
    fetchData();
    fetchStats();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoryResponse, bookResponse] = await Promise.all([
        axios.get(`${CATRGORY_FETCH_URL}`),
        axios.get(`${BOOK_FETCH_URL}`)
      ]);

      // Categories
      if (categoryResponse.data.status === "SUCCESS") {
        setCategories(categoryResponse.data.payload || []);
      } else {
        setError(categoryResponse.data.message || "Failed to load categories");
      }

      // Books
      if (bookResponse.data.status === "SUCCESS") {
        const books = bookResponse.data.payload || [];
        setAllBooks(books);

        // Featured books (top 6 with specific tags)
        const featured = books
          .filter(book =>
            book.bookTags?.includes("BESTSELLER") ||
            book.bookTags?.includes("TOP_RATED") ||
            book.bookTags?.includes("NEW_RELEASE")
          )
          .slice(0, 6);
        setFeaturedBooks(featured);

        // Preview books for "All Books" section (first 8 books)
        setPreviewBooks(books.slice(0, 8));

        // Update stats with actual data
        setStats(prev => ({
          ...prev,
          totalBooks: books.length,
          totalCategories: categoryResponse.data.payload?.length || prev.totalCategories
        }));

      } else {
        setError(bookResponse.data.message || "Failed to load books");
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = () => {
    // Mock stats - you can replace with actual API call
    setStats(prev => ({
      ...prev,
      totalUsers: 125000,
      averageRating: 4.5
    }));
  };

  const handleExploreBooks = () => navigate('/books');

  const handleViewAllCategories = () => {
    document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategoryClick = (category) => {
    navigate(`/books?category=${encodeURIComponent(category)}`);
  };

  const handleTagClick = (tag) => {
    if (tag === 'ALL') {
      navigate('/books');
    } else {
      navigate(`/books?tag=${encodeURIComponent(tag)}`);
    }
  };

  const getTagText = (tag) => {
    const tagTexts = {
      BESTSELLER: 'Bestseller',
      NEW_RELEASE: 'New Release',
      TOP_RATED: 'Top Rated',
      SALE: 'On Sale'
    };
    return tagTexts[tag] || tag;
  };

  const FeaturedBookCard = ({ book }) => (
    <div className={styles.featuredBookCard}>
      <div className={styles.bookCover}>
        <span className={styles.bookEmoji}>📚</span>
        {book.bookTags && book.bookTags.map((tag, index) => (
          <span 
            key={`${tag}-${index}`} 
            className={styles.bookTag}
            style={{ top: `${8 + (index * 25)}px` }}
          >
            {getTagText(tag)}
          </span>
        ))}
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
      </div>
    </div>
  );

  return (
    <div className={styles.landingPage}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Discover Your Next
              <span className={styles.highlight}> Great Read</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Explore thousands of books across multiple genres. From bestsellers to hidden gems, 
              find the perfect book for every mood and moment.
            </p>
            <div className={styles.heroButtons}>
              <button className={styles.primaryButton} onClick={handleExploreBooks}>
                <BookOpen size={20} />
                Explore Books
                <ArrowRight size={20} />
              </button>
              <button className={styles.secondaryButton} onClick={handleViewAllCategories}>
                View Categories
              </button>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.bookStack}>
              <div className={styles.book} style={{ background: '#6366f1' }}>📚</div>
              <div className={styles.book} style={{ background: '#8b5cf6' }}>📖</div>
              <div className={styles.book} style={{ background: '#06b6d4' }}>📘</div>
              <div className={styles.book} style={{ background: '#10b981' }}>📗</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <BookOpen className={styles.statIcon} />
            <div className={styles.statNumber}>
              {loading ? '...' : stats.totalBooks.toLocaleString()}
            </div>
            <div className={styles.statLabel}>Books Available</div>
          </div>
          <div className={styles.statCard}>
            <Users className={styles.statIcon} />
            <div className={styles.statNumber}>{stats.totalUsers.toLocaleString()}</div>
            <div className={styles.statLabel}>Happy Readers</div>
          </div>
          <div className={styles.statCard}>
            <Award className={styles.statIcon} />
            <div className={styles.statNumber}>
              {loading ? '...' : stats.totalCategories}
            </div>
            <div className={styles.statLabel}>Categories</div>
          </div>
          <div className={styles.statCard}>
            <Star className={styles.statIcon} />
            <div className={styles.statNumber}>{stats.averageRating}</div>
            <div className={styles.statLabel}>Avg Rating</div>
          </div>
        </div>
      </section>

      {/* Tags Filter Section */}
      <section className={styles.tagsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Browse by Tags</h2>
          <p className={styles.sectionSubtitle}>Filter books by popular tags</p>
        </div>
        <div className={styles.tagsContainer}>
          {bookTags.map((tag) => (
            <button
              key={tag.key}
              className={styles.tagButton}
              onClick={() => handleTagClick(tag.key)}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Books Section */}
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
            <button onClick={fetchData} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className={styles.featuredBooks}>
              {featuredBooks.map((book) => (
                <FeaturedBookCard key={book.bookId} book={book} />
              ))}
            </div>
            {featuredBooks.length === 0 && (
              <div className={styles.noBooks}>
                <p>No featured books available at the moment.</p>
              </div>
            )}
          </>
        )}
        
        <div className={styles.sectionFooter}>
          <button className={styles.viewAllButton} onClick={handleExploreBooks}>
            View All Books
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className={styles.categoriesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Browse by Category</h2>
          <p className={styles.sectionSubtitle}>Find your favorite genre and discover new worlds</p>
        </div>
        <CategoriesView 
          categories={categories} 
          books={previewBooks} // Use preview books instead of all books
          onCategoryClick={handleCategoryClick} 
        />
      </section>

      {/* Books Preview Section (Only show first 8 books) */}
      <section className={styles.featuredSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Popular Books</h2>
          <p className={styles.sectionSubtitle}>Browse some of our most popular titles</p>
        </div>
        <BookViewCard 
          books={previewBooks} // Show only preview books
          loading={loading}
          error={error}
          showPagination={false} // Disable pagination for preview
        />
        <div className={styles.sectionFooter}>
          <button className={styles.viewAllButton} onClick={handleExploreBooks}>
            View All {stats.totalBooks} Books
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className={styles.whyChooseSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Choose BookHaven?</h2>
          <p className={styles.sectionSubtitle}>More than just a bookstore</p>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📦</div>
            <h3 className={styles.featureTitle}>Free Shipping</h3>
            <p className={styles.featureDescription}>
              Free shipping on all orders over $35. Get your books delivered right to your doorstep.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3 className={styles.featureTitle}>Fast Delivery</h3>
            <p className={styles.featureDescription}>
              Quick processing and shipping. Most orders arrive within 2-3 business days.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💎</div>
            <h3 className={styles.featureTitle}>Curated Selection</h3>
            <p className={styles.featureDescription}>
              Handpicked books from bestsellers to hidden gems across all genres.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon">🔄</div>
            <h3 className={styles.featureTitle}>Easy Returns</h3>
            <p className={styles.featureDescription}>
              Not satisfied? Return any book within 30 days for a full refund.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Start Reading?</h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of readers who have found their next favorite book with us.
          </p>
          <button className={styles.ctaButton} onClick={handleExploreBooks}>
            <TrendingUp size={20} />
            Start Browsing Now
            <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
