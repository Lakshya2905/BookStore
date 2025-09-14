import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, TrendingUp, Star } from 'lucide-react';
import axios from 'axios';
import CategoriesView from '../Books/CategoriesView';
import BookViewCard from '../Books/BookViewCard';
import FeaturedBooksSection from '../Books/FeaturedBooksSection';
import styles from './LandingPage.module.css';
import { BOOK_FETCH_URL, CATRGORY_FETCH_URL,BOOK_IMAGE_FETCH_URL } from '../../constants/apiConstants';
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
  const [imageLoading, setImageLoading] = useState(false);

  const navigate = useNavigate();
  
  useEffect(() => {
    fetchData();
    fetchStats();
  }, []);

  // Function to fetch and cache book cover images
  const fetchAndCacheBookImages = async (books) => {
    if (!books || books.length === 0) return books;
    
    setImageLoading(true);
    
    try {
      // Check for cached images first
      const cachedImages = JSON.parse(sessionStorage.getItem("bookImages") || "{}");
      
      const booksWithImages = await Promise.all(
        books.map(async (book) => {
          try {
            // Check if image is already cached
            if (cachedImages[book.id]) {
              return {
                ...book,
                coverImageUrl: cachedImages[book.id]
              };
            }

            // Fetch image from your Spring Boot endpoint
            const imageResponse = await axios.get(`/api/book/image?bookId=${book.id}`, {
              responseType: 'blob'
            });

            // Convert blob to base64 data URL for caching
            const blob = imageResponse.data;
            const reader = new FileReader();
            
            return new Promise((resolve) => {
              reader.onloadend = () => {
                const base64data = reader.result;
                
                // Cache the image
                cachedImages[book.id] = base64data;
                sessionStorage.setItem("bookImages", JSON.stringify(cachedImages));
                
                resolve({
                  ...book,
                  coverImageUrl: base64data
                });
              };
              reader.readAsDataURL(blob);
            });

          } catch (imageError) {
            console.warn(`Failed to load image for book ${book.id}:`, imageError);
            // Return book without image if fetch fails
            return {
              ...book,
              coverImageUrl: null
            };
          }
        })
      );

      return booksWithImages;
    } catch (error) {
      console.error("Error fetching book images:", error);
      return books; // Return original books if image fetching fails
    } finally {
      setImageLoading(false);
    }
  };

 // Alternative approach: Fetch images in batches to avoid overwhelming the server
const fetchBookImagesInBatches = async (books, batchSize = 5) => {
  if (!books || books.length === 0) return books;
  
  setImageLoading(true);
  const cachedImages = JSON.parse(sessionStorage.getItem("bookImages") || "{}");
  const updatedBooks = [...books];

  try {
    // Process books in batches
    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (book, index) => {
          const actualIndex = i + index;
          
          try {
            // Skip if already cached
            if (cachedImages[book.bookId]) {
              updatedBooks[actualIndex] = {
                ...book,
                coverImageUrl: cachedImages[book.bookId]
              };
              return;
            }

            const imageResponse = await axios.get(`${BOOK_IMAGE_FETCH_URL}?bookId=${book.bookId}`, {
              responseType: 'blob',
              timeout: 10000 // 10 second timeout
            });

            const blob = imageResponse.data;
            const reader = new FileReader();
            
            reader.onloadend = () => {
              const base64data = reader.result;
              cachedImages[book.bookId] = base64data;
              sessionStorage.setItem("bookImages", JSON.stringify(cachedImages));
              
              updatedBooks[actualIndex] = {
                ...book,
                coverImageUrl: base64data
              };
            };
            reader.readAsDataURL(blob);

          } catch (imageError) {
            console.warn(`Failed to load image for book ${book.bookId}:`, imageError);
            updatedBooks[actualIndex] = {
              ...book,
              coverImageUrl: null
            };
          }
        })
      );

      // Small delay between batches to avoid overwhelming the server
      if (i + batchSize < books.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return updatedBooks;
  } catch (error) {
    console.error("Error in batch image fetching:", error);
    return books;
  } finally {
    setImageLoading(false);
  }
};


  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Check for cached categories in session storage
      const cachedCategories = sessionStorage.getItem("allCategories");
      let categoryData = [];
      
      if (cachedCategories) {
        categoryData = JSON.parse(cachedCategories);
        setCategories(categoryData);
      }

      // Check for cached books
      const cachedBooks = sessionStorage.getItem("allBooks");
      
      if (cachedBooks) {
        const bookData = JSON.parse(cachedBooks);
        setAllBooks(bookData);
        setFeaturedBooks(bookData.slice(0, 6));
        setPreviewBooks(bookData.slice(0, 8));
        
        setStats(prev => ({
          ...prev,
          totalBooks: bookData.length,
          totalCategories: categoryData.length || prev.totalCategories
        }));
        
        setLoading(false);
        return;
      }

      const [categoryResponse, bookResponse] = await Promise.all([
        // Only fetch categories if not in cache
        cachedCategories ? Promise.resolve({ data: { status: "SUCCESS", payload: categoryData } }) : axios.get(`${CATRGORY_FETCH_URL}`),
        axios.get(`${BOOK_FETCH_URL}`)
      ]);

      // Categories
      if (categoryResponse.data.status === "SUCCESS") {
        const categoriesPayload = categoryResponse.data.payload || [];
        setCategories(categoriesPayload);
        // Store categories in session storage if not already cached
        if (!cachedCategories) {
          sessionStorage.setItem("allCategories", JSON.stringify(categoriesPayload));
        }
      } else {
        setError(categoryResponse.data.message || "Failed to load categories");
      }

      // Books
      if (bookResponse.data.status === "SUCCESS") {
        const books = bookResponse.data.payload || [];
        
        // Fetch and cache images for all books
        const booksWithImages = await fetchBookImagesInBatches(books);
        
        setAllBooks(booksWithImages);
        sessionStorage.setItem("allBooks", JSON.stringify(booksWithImages));

        // Featured books - get first 6 books for featured section
        const featured = booksWithImages.slice(0, 6);
        setFeaturedBooks(featured);

        // Preview books for "All Books" section (first 8 books)
        setPreviewBooks(booksWithImages.slice(0, 8));

        // Update stats with actual data
        setStats(prev => ({
          ...prev,
          totalBooks: booksWithImages.length,
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

  // Utility function to get cached image
  const getCachedImage = (bookId) => {
    const cachedImages = JSON.parse(sessionStorage.getItem("bookImages") || "{}");
    return cachedImages[bookId] || null;
  };

  // Function to clear image cache if needed
  const clearImageCache = () => {
    sessionStorage.removeItem("bookImages");
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

      {/* Loading indicator for images */}
      {imageLoading && (
        <div className={styles.imageLoadingIndicator}>
          <p>Loading book covers...</p>
        </div>
      )}

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