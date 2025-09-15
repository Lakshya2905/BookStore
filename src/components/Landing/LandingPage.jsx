import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, TrendingUp, Star } from 'lucide-react';
import axios from 'axios';
import CategoriesView from '../Books/CategoriesView';
import BookViewCard from '../Books/BookViewCard';
import FeaturedBooksSection from '../Books/FeaturedBooksSection';
import styles from './LandingPage.module.css';
import { BOOK_FETCH_URL, CATRGORY_FETCH_URL, BOOK_IMAGE_FETCH_URL } from '../../constants/apiConstants';
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
  const [imageLoadingProgress, setImageLoadingProgress] = useState(0);

  const navigate = useNavigate();
  
  useEffect(() => {
    fetchData();
    fetchStats();
  }, []);

  // Function to get cached image from session storage
  const getCachedImage = (bookId) => {
    try {
      const cachedImages = JSON.parse(sessionStorage.getItem("bookImages") || "{}");
      return cachedImages[bookId] || null;
    } catch (error) {
      console.error("Error reading cached images:", error);
      return null;
    }
  };

  // Function to cache image in session storage
  const cacheImage = (bookId, imageData) => {
    try {
      const cachedImages = JSON.parse(sessionStorage.getItem("bookImages") || "{}");
      cachedImages[bookId] = imageData;
      sessionStorage.setItem("bookImages", JSON.stringify(cachedImages));
    } catch (error) {
      console.error("Error caching image:", error);
      // If storage is full, clear old cache and try again
      if (error.name === 'QuotaExceededError') {
        try {
          sessionStorage.removeItem("bookImages");
          const newCache = { [bookId]: imageData };
          sessionStorage.setItem("bookImages", JSON.stringify(newCache));
        } catch (e) {
          console.error("Failed to cache image even after clearing:", e);
        }
      }
    }
  };

  // Function to fetch single book image
  const fetchSingleBookImage = async (book) => {
    try {
      // First check cache
      const cachedImage = getCachedImage(book.bookId);
      if (cachedImage) {
        return {
          ...book,
          coverImageUrl: cachedImage
        };
      }

      // Fetch from server if not cached
      const imageResponse = await axios.get(`${BOOK_IMAGE_FETCH_URL}?bookId=${book.bookId}`, {
        responseType: 'blob',
        timeout: 15000 // 15 second timeout
      });

      const blob = imageResponse.data;
      
      // Convert blob to base64 for caching
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          
          // Cache the image
          cacheImage(book.bookId, base64data);
          
          resolve({
            ...book,
            coverImageUrl: base64data
          });
        };
        reader.onerror = () => {
          console.warn(`Failed to convert image to base64 for book ${book.bookId}`);
          resolve({
            ...book,
            coverImageUrl: null
          });
        };
        reader.readAsDataURL(blob);
      });

    } catch (error) {
      console.warn(`Failed to load image for book ${book.bookId}:`, error.message);
      return {
        ...book,
        coverImageUrl: null
      };
    }
  };

  // Function to load book images one by one with progress tracking
  const loadBookImagesSequentially = async (books) => {
    if (!books || books.length === 0) return books;
    
    setImageLoading(true);
    setImageLoadingProgress(0);
    
    const booksWithImages = [];
    let cachedCount = 0;
    let fetchedCount = 0;

    try {
      for (let i = 0; i < books.length; i++) {
        const book = books[i];
        
        // Check cache first
        const cachedImage = getCachedImage(book.bookId);
        
        if (cachedImage) {
          // Use cached image
          booksWithImages.push({
            ...book,
            coverImageUrl: cachedImage
          });
          cachedCount++;
        } else {
          // Fetch from server
          try {
            const bookWithImage = await fetchSingleBookImage(book);
            booksWithImages.push(bookWithImage);
            fetchedCount++;
          } catch (error) {
            console.warn(`Failed to process image for book ${book.bookId}:`, error);
            booksWithImages.push({
              ...book,
              coverImageUrl: null
            });
          }
        }
        
        // Update progress
        const progress = ((i + 1) / books.length) * 100;
        setImageLoadingProgress(Math.round(progress));
        
        // Small delay to prevent overwhelming the server
        if (i < books.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Image loading complete: ${cachedCount} from cache, ${fetchedCount} fetched from server`);
      return booksWithImages;

    } catch (error) {
      console.error("Error in sequential image loading:", error);
      return books.map(book => ({
        ...book,
        coverImageUrl: getCachedImage(book.bookId) || null
      }));
    } finally {
      setImageLoading(false);
      setImageLoadingProgress(0);
    }
  };

  // Function to load images for visible books first (priority loading)
  const loadImagesWithPriority = async (books) => {
    if (!books || books.length === 0) return books;

    setImageLoading(true);
    
    try {
      // Separate books into priority (first 8 for preview) and others
      const priorityBooks = books.slice(0, 8);
      const remainingBooks = books.slice(8);
      
      // Load priority images first
      const priorityBooksWithImages = await Promise.all(
        priorityBooks.map(async (book) => {
          const cachedImage = getCachedImage(book.bookId);
          if (cachedImage) {
            return { ...book, coverImageUrl: cachedImage };
          }
          return await fetchSingleBookImage(book);
        })
      );

      // Update state with priority books immediately
      const initialBooksWithImages = [
        ...priorityBooksWithImages,
        ...remainingBooks.map(book => ({ 
          ...book, 
          coverImageUrl: getCachedImage(book.bookId) || null 
        }))
      ];

      setAllBooks(initialBooksWithImages);
      setFeaturedBooks(priorityBooksWithImages.slice(0, 6));
      setPreviewBooks(priorityBooksWithImages);

      // Load remaining images in background
      if (remainingBooks.length > 0) {
        const remainingBooksWithImages = await Promise.all(
          remainingBooks.map(async (book) => {
            const cachedImage = getCachedImage(book.bookId);
            if (cachedImage) {
              return { ...book, coverImageUrl: cachedImage };
            }
            return await fetchSingleBookImage(book);
          })
        );

        // Update state with all books
        const finalBooksWithImages = [
          ...priorityBooksWithImages,
          ...remainingBooksWithImages
        ];

        setAllBooks(finalBooksWithImages);
        sessionStorage.setItem("allBooks", JSON.stringify(finalBooksWithImages));
      } else {
        sessionStorage.setItem("allBooks", JSON.stringify(initialBooksWithImages));
      }

      return initialBooksWithImages;

    } catch (error) {
      console.error("Error in priority image loading:", error);
      return books.map(book => ({
        ...book,
        coverImageUrl: getCachedImage(book.bookId) || null
      }));
    } finally {
      setImageLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Check for cached categories
      const cachedCategories = sessionStorage.getItem("allCategories");
      let categoryData = [];
      
      if (cachedCategories) {
        categoryData = JSON.parse(cachedCategories);
        setCategories(categoryData);
      }

      // Check for cached books with images
      const cachedBooks = sessionStorage.getItem("allBooks");
      
      if (cachedBooks) {
        try {
          const bookData = JSON.parse(cachedBooks);
          
          // Verify cached books still have valid image URLs
          const booksWithValidImages = bookData.map(book => ({
            ...book,
            coverImageUrl: getCachedImage(book.bookId) || book.coverImageUrl
          }));
          
          setAllBooks(booksWithValidImages);
          setFeaturedBooks(booksWithValidImages.slice(0, 6));
          setPreviewBooks(booksWithValidImages.slice(0, 8));
          
          setStats(prev => ({
            ...prev,
            totalBooks: booksWithValidImages.length,
            totalCategories: categoryData.length || prev.totalCategories
          }));
          
          setLoading(false);
          return;
        } catch (error) {
          console.error("Error parsing cached books:", error);
          // Continue with fresh fetch if cache is corrupted
        }
      }

      // Fetch fresh data
      const requests = [];
      
      // Add category request if not cached
      if (!cachedCategories) {
        requests.push(axios.get(`${CATRGORY_FETCH_URL}`));
      } else {
        requests.push(Promise.resolve({ data: { status: "SUCCESS", payload: categoryData } }));
      }
      
      // Add books request
      requests.push(axios.get(`${BOOK_FETCH_URL}`));

      const [categoryResponse, bookResponse] = await Promise.all(requests);

      // Handle categories
      if (categoryResponse.data.status === "SUCCESS") {
        const categoriesPayload = categoryResponse.data.payload || [];
        setCategories(categoriesPayload);
        
        if (!cachedCategories) {
          sessionStorage.setItem("allCategories", JSON.stringify(categoriesPayload));
        }
      } else {
        setError(categoryResponse.data.message || "Failed to load categories");
      }

      // Handle books
      if (bookResponse.data.status === "SUCCESS") {
        const books = bookResponse.data.payload || [];
        
        if (books.length === 0) {
          setError("No books found");
          setLoading(false);
          return;
        }

        // Load images with priority approach
        const booksWithImages = await loadImagesWithPriority(books);
        
        // Update stats
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
      setError("Failed to load data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = () => {
    // Mock stats - replace with actual API call if available
    setStats(prev => ({
      ...prev,
      totalUsers: 125000,
      averageRating: 4.5
    }));
  };

  // Function to clear image cache
  const clearImageCache = () => {
    sessionStorage.removeItem("bookImages");
    console.log("Image cache cleared");
  };

  // Function to get cache info for debugging
  const getCacheInfo = () => {
    try {
      const cachedImages = JSON.parse(sessionStorage.getItem("bookImages") || "{}");
      const cacheSize = JSON.stringify(cachedImages).length;
      const imageCount = Object.keys(cachedImages).length;
      
      console.log(`Image cache: ${imageCount} images, ${(cacheSize / 1024 / 1024).toFixed(2)} MB`);
      return { imageCount, cacheSize };
    } catch (error) {
      console.error("Error getting cache info:", error);
      return { imageCount: 0, cacheSize: 0 };
    }
  };

  const handleExploreBooks = () => {
  navigate('/books');
  window.location.reload();
};

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
          <div className={styles.loadingContent}>
            <p>Loading book covers... {imageLoadingProgress > 0 && `${imageLoadingProgress}%`}</p>
            {imageLoadingProgress > 0 && (
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${imageLoadingProgress}%` }}
                />
              </div>
            )}
          </div>
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