import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, TrendingUp, Star } from 'lucide-react';
import axios from 'axios';
import CategoriesView from '../Books/CategoriesView';
import BookViewCard from '../Books/BookViewCard';
import FeaturedBooksSection from '../Books/FeaturedBooksSection';
import styles from './LandingPage.module.css';
import { BOOK_FETCH_URL, CATRGORY_FETCH_URL } from '../../constants/apiConstants';
import Discovery from './Discovery';

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
        sessionStorage.setItem("allBooks", JSON.stringify(books));

        // Featured books - get first 6 books for featured section
        const featured = books.slice(0, 6);
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

  return (
    <div className={styles.landingPage}>
      {/* Hero Section */}
     <div className={styles.discovery}>
  <Discovery />
</div>

   
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

      {/* Featured Books Section */}
      <FeaturedBooksSection 
        books={featuredBooks}
        loading={loading}
        error={error}
        onViewAllClick={handleExploreBooks}
      />

    

      {/* Categories Section */}
      <section id="categories" className={styles.categoriesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Browse by Category</h2>
          <p className={styles.sectionSubtitle}>Find your favorite genre and discover new worlds</p>
        </div>
        <CategoriesView 
          categories={categories} 
          books={previewBooks}
          onCategoryClick={handleCategoryClick} 
        />
      </section>

      {/* Books Preview Section */}
      <section className={styles.booksPreviewSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Popular Books</h2>
          <p className={styles.sectionSubtitle}>Browse some of our most popular titles</p>
        </div>
        <BookViewCard 
          books={previewBooks}
          loading={loading}
          error={error}
          showPagination={false}
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
            <div className={styles.featureIcon}>🔄</div>
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