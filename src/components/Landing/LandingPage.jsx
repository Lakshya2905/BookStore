import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, TrendingUp, Star } from 'lucide-react';
import axios from 'axios';
import CategoriesView from '../Books/CategoriesView';
import BookViewCard from '../Books/BookViewCard';
import FeaturedBooksSection from '../Books/FeaturedBooksSection';
import styles from './LandingPage.module.css';
import { BOOK_FETCH_URL, CATRGORY_VIEW_URL, BOOK_IMAGE_FETCH_URL, CATEGORY_IMAGE_FETCH_URL } from '../../constants/apiConstants';
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
  const [categoryImageLoading, setCategoryImageLoading] = useState(false);
  const { hash } = useLocation();

  const navigate = useNavigate();

  useEffect(() => {
    // Only scroll to top if there's no hash in URL
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.replace("#", ""));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [hash]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, []);

  // Function to get cached book cover image from session storage
  const getCachedBookCoverImage = (bookId) => {
    try {
      const cachedCovers = JSON.parse(sessionStorage.getItem("bookCovers") || "{}");
      return cachedCovers[bookId] || null;
    } catch (error) {
      console.error("Error reading cached book covers:", error);
      return null;
    }
  };

  // Function to cache book cover image in session storage
  const cacheBookCoverImage = (bookId, imageData) => {
    try {
      const cachedCovers = JSON.parse(sessionStorage.getItem("bookCovers") || "{}");
      cachedCovers[bookId] = imageData;
      sessionStorage.setItem("bookCovers", JSON.stringify(cachedCovers));
    } catch (error) {
      console.error("Error caching book cover:", error);
      // If storage is full, clear old cache and try again
      if (error.name === 'QuotaExceededError') {
        try {
          sessionStorage.removeItem("bookCovers");
          const newCache = { [bookId]: imageData };
          sessionStorage.setItem("bookCovers", JSON.stringify(newCache));
        } catch (e) {
          console.error("Failed to cache book cover even after clearing:", e);
        }
      }
    }
  };

  // Function to get cached category image from session storage
  const getCachedCategoryImage = (categoryId) => {
    try {
      const cachedImages = JSON.parse(sessionStorage.getItem("categoryImages") || "{}");
      return cachedImages[categoryId] || null;
    } catch (error) {
      console.error("Error reading cached category images:", error);
      return null;
    }
  };

  // Function to cache category image in session storage
  const cacheCategoryImage = (categoryId, imageData) => {
    try {
      const cachedImages = JSON.parse(sessionStorage.getItem("categoryImages") || "{}");
      cachedImages[categoryId] = imageData;
      sessionStorage.setItem("categoryImages", JSON.stringify(cachedImages));
    } catch (error) {
      console.error("Error caching category image:", error);
      // If storage is full, clear old cache and try again
      if (error.name === 'QuotaExceededError') {
        try {
          sessionStorage.removeItem("categoryImages");
          const newCache = { [categoryId]: imageData };
          sessionStorage.setItem("categoryImages", JSON.stringify(newCache));
        } catch (e) {
          console.error("Failed to cache category image even after clearing:", e);
        }
      }
    }
  };

  // Function to find cover image info from book's image list
  const findCoverImageInfo = (book) => {
    const bookImageList = book.bookImageList || [];
    if (bookImageList.length === 0) return null;
    
    // Look for cover image first, then fall back to first image
    const coverImage = bookImageList.find(img => img.imageType === 'COVER');
    return coverImage || bookImageList[0];
  };

  // Function to fetch single image by imageId
  const fetchSingleImageById = async (imageId) => {
    try {
      const imageResponse = await axios.get(`${BOOK_IMAGE_FETCH_URL}?imageId=${imageId}`, {
        responseType: 'blob',
        timeout: 15000 // 15 second timeout
      });

      const blob = imageResponse.data;
      
      // Convert blob to base64 for caching
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          resolve(base64data);
        };
        reader.onerror = () => {
          console.warn(`Failed to convert image to base64 for imageId ${imageId}`);
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });

    } catch (error) {
      console.warn(`Failed to load image for imageId ${imageId}:`, error.message);
      return null;
    }
  };

  // Function to fetch only cover image for a single book
  const fetchBookCoverImage = async (book) => {
    try {
      // First check cache
      const cachedCover = getCachedBookCoverImage(book.bookId);
      if (cachedCover) {
        return {
          ...book,
          coverImageUrl: cachedCover
        };
      }

      // Find cover image info
      const coverImageInfo = findCoverImageInfo(book);
      if (!coverImageInfo) {
        // No images available
        return {
          ...book,
          coverImageUrl: null
        };
      }

      // Fetch only the cover image
      const imageData = await fetchSingleImageById(coverImageInfo.imageId);
      
      if (imageData) {
        // Cache the cover image
        cacheBookCoverImage(book.bookId, imageData);
      }
      
      return {
        ...book,
        coverImageUrl: imageData
      };

    } catch (error) {
      console.warn(`Failed to load cover image for book ${book.bookId}:`, error.message);
      return {
        ...book,
        coverImageUrl: null
      };
    }
  };

  // Function to fetch single category image
  const fetchSingleCategoryImage = async (category) => {
    try {
      // First check cache
      const cachedImage = getCachedCategoryImage(category.categoryId);
      if (cachedImage) {
        return {
          ...category,
          imageUrl: cachedImage
        };
      }

      // Fetch from server if not cached
      const imageResponse = await axios.get(`${CATEGORY_IMAGE_FETCH_URL}?categoryId=${category.categoryId}`, {
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
          cacheCategoryImage(category.categoryId, base64data);
          
          resolve({
            ...category,
            imageUrl: base64data
          });
        };
        reader.onerror = () => {
          console.warn(`Failed to convert category image to base64 for category ${category.categoryId}`);
          resolve({
            ...category,
            imageUrl: null
          });
        };
        reader.readAsDataURL(blob);
      });

    } catch (error) {
      console.warn(`Failed to load image for category ${category.categoryId}:`, error.message);
      return {
        ...category,
        imageUrl: null
      };
    }
  };

  // Function to load category images
  const loadCategoryImages = async (categories) => {
    if (!categories || categories.length === 0) return categories;
    
    setCategoryImageLoading(true);
    
    try {
      const categoriesWithImages = await Promise.all(
        categories.map(async (category) => {
          // Handle CategoryDto structure properly
          if (!category.categoryId || !category.categoryName) {
            console.warn('Invalid category structure:', category);
            return category;
          }
          
          const cachedImage = getCachedCategoryImage(category.categoryId);
          if (cachedImage) {
            return { ...category, imageUrl: cachedImage };
          }
          return await fetchSingleCategoryImage(category);
        })
      );

      console.log(`Category image loading complete`);
      return categoriesWithImages;

    } catch (error) {
      console.error("Error loading category images:", error);
      return categories.map(category => ({
        ...category,
        imageUrl: getCachedCategoryImage(category.categoryId) || null
      }));
    } finally {
      setCategoryImageLoading(false);
    }
  };

  // Function to load book cover images with progress tracking
  const loadBookCoverImages = async (books) => {
    if (!books || books.length === 0) return books;
    
    setImageLoading(true);
    setImageLoadingProgress(0);
    
    const booksWithCovers = [];
    let cachedCount = 0;
    let fetchedCount = 0;

    try {
      for (let i = 0; i < books.length; i++) {
        const book = books[i];
        
        // Check cache first
        const cachedCover = getCachedBookCoverImage(book.bookId);
        
        if (cachedCover) {
          // Use cached cover
          booksWithCovers.push({
            ...book,
            coverImageUrl: cachedCover
          });
          cachedCount++;
        } else {
          // Fetch cover from server
          try {
            const bookWithCover = await fetchBookCoverImage(book);
            booksWithCovers.push(bookWithCover);
            if (bookWithCover.coverImageUrl) {
              fetchedCount++;
            }
          } catch (error) {
            console.warn(`Failed to process cover image for book ${book.bookId}:`, error);
            booksWithCovers.push({
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
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      console.log(`Book cover loading complete: ${cachedCount} from cache, ${fetchedCount} fetched from server`);
      return booksWithCovers;

    } catch (error) {
      console.error("Error in book cover loading:", error);
      return books.map(book => {
        const cachedCover = getCachedBookCoverImage(book.bookId);
        return {
          ...book,
          coverImageUrl: cachedCover
        };
      });
    } finally {
      setImageLoading(false);
      setImageLoadingProgress(0);
    }
  };

  // Function to load cover images for visible books first (priority loading)
  const loadCoversWithPriority = async (books) => {
    if (!books || books.length === 0) return books;

    setImageLoading(true);
    
    try {
      // Separate books into priority (first 8 for preview) and others
      const priorityBooks = books.slice(0, 8);
      const remainingBooks = books.slice(8);
      
      // Load priority covers first
      const priorityBooksWithCovers = await Promise.all(
        priorityBooks.map(async (book) => {
          const cachedCover = getCachedBookCoverImage(book.bookId);
          if (cachedCover) {
            return { 
              ...book, 
              coverImageUrl: cachedCover
            };
          }
          return await fetchBookCoverImage(book);
        })
      );

      // Update state with priority books immediately
      const initialBooksWithCovers = [
        ...priorityBooksWithCovers,
        ...remainingBooks.map(book => {
          const cachedCover = getCachedBookCoverImage(book.bookId);
          return { 
            ...book, 
            coverImageUrl: cachedCover
          };
        })
      ];

      setAllBooks(initialBooksWithCovers);
      setFeaturedBooks(priorityBooksWithCovers.slice(0, 6));
      setPreviewBooks(priorityBooksWithCovers);

      // Load remaining covers in background
      if (remainingBooks.length > 0) {
        const remainingBooksWithCovers = await Promise.all(
          remainingBooks.map(async (book) => {
            const cachedCover = getCachedBookCoverImage(book.bookId);
            if (cachedCover) {
              return { 
                ...book, 
                coverImageUrl: cachedCover
              };
            }
            return await fetchBookCoverImage(book);
          })
        );

        // Update state with all books
        const finalBooksWithCovers = [
          ...priorityBooksWithCovers,
          ...remainingBooksWithCovers
        ];

        setAllBooks(finalBooksWithCovers);
        sessionStorage.setItem("allBooks", JSON.stringify(finalBooksWithCovers));
      } else {
        sessionStorage.setItem("allBooks", JSON.stringify(initialBooksWithCovers));
      }

      return initialBooksWithCovers;

    } catch (error) {
      console.error("Error in priority cover loading:", error);
      return books.map(book => {
        const cachedCover = getCachedBookCoverImage(book.bookId);
        return {
          ...book,
          coverImageUrl: cachedCover
        };
      });
    } finally {
      setImageLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for cached data first
      const cachedCategories = sessionStorage.getItem("allCategories");
      const cachedBooks = sessionStorage.getItem("allBooks");
      
      // If we have both cached categories and books, use them
      if (cachedCategories && cachedBooks) {
        try {
          const categoryData = JSON.parse(cachedCategories);
          const bookData = JSON.parse(cachedBooks);
          
          // Verify cached categories have proper structure
          const validCachedCategories = categoryData.filter(category => 
            category.categoryId && category.categoryName
          ).map(category => ({
            ...category,
            imageUrl: getCachedCategoryImage(category.categoryId) || category.imageUrl
          }));
          
          // Verify cached books and restore cover data
          const validCachedBooks = bookData.map(book => {
            const cachedCover = getCachedBookCoverImage(book.bookId);
            return {
              ...book,
              coverImageUrl: cachedCover || book.coverImageUrl
            };
          });
          
          if (validCachedCategories.length > 0 && validCachedBooks.length > 0) {
            setCategories(validCachedCategories);
            setAllBooks(validCachedBooks);
            setFeaturedBooks(validCachedBooks.slice(0, 6));
            setPreviewBooks(validCachedBooks.slice(0, 8));
            
            setStats(prev => ({
              ...prev,
              totalBooks: validCachedBooks.length,
              totalCategories: validCachedCategories.length
            }));
            
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error parsing cached data:", error);
          // Continue with fresh fetch if cache is corrupted
        }
      }

      // Step 1: Fetch categories first
      console.log("Fetching categories...");
      let categoriesData = [];
      
      try {
        const categoryResponse = await axios.get(`${CATRGORY_VIEW_URL}`);
        
        if (categoryResponse.data.status === "SUCCESS") {
          const categoriesPayload = categoryResponse.data.payload || [];
          
          // Validate category structure
          const validCategories = categoriesPayload.filter(category => {
            if (!category.categoryId || !category.categoryName) {
              console.warn('Invalid category structure received from API:', category);
              return false;
            }
            return true;
          });

          if (validCategories.length === 0) {
            console.warn('No valid categories received from API');
          } else {
            categoriesData = validCategories;
            console.log(`Found ${categoriesData.length} valid categories`);
            
            // Set categories without images first
            setCategories(categoriesData);
            setStats(prev => ({
              ...prev,
              totalCategories: categoriesData.length
            }));
          }
        } else {
          console.error('Category API error:', categoryResponse.data);
          setError(categoryResponse.data.message || "Failed to load categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Failed to load categories. Please check your connection.");
      }

      // Step 2: Fetch books
      console.log("Fetching books...");
      let booksData = [];
      
      try {
        const bookResponse = await axios.get(`${BOOK_FETCH_URL}`);
        
        if (bookResponse.data.status === "SUCCESS") {
          const books = bookResponse.data.payload || [];
          
          if (books.length === 0) {
            setError("No books found");
          } else {
            booksData = books;
            console.log(`Found ${booksData.length} books`);
            
            setStats(prev => ({
              ...prev,
              totalBooks: booksData.length
            }));
          }
        } else {
          console.error('Books API error:', bookResponse.data);
          setError(bookResponse.data.message || "Failed to load books");
        }
      } catch (error) {
        console.error("Error fetching books:", error);
        setError("Failed to load books. Please check your connection.");
      }

      // Step 3: Load category images (if categories were fetched successfully)
      if (categoriesData.length > 0) {
        console.log("Loading category images...");
        try {
          const categoriesWithImages = await loadCategoryImages(categoriesData);
          setCategories(categoriesWithImages);
          
          // Cache categories with images
          sessionStorage.setItem("allCategories", JSON.stringify(categoriesWithImages));
          console.log("Categories cached with images");
        } catch (error) {
          console.error("Error loading category images:", error);
          // Keep categories without images if image loading fails
        }
      }

      // Step 4: Load book cover images (if books were fetched successfully)
      if (booksData.length > 0) {
        console.log("Loading book cover images...");
        try {
          const booksWithCovers = await loadCoversWithPriority(booksData);
          // loadCoversWithPriority already updates the state and cache
          console.log("Book cover images loaded and cached");
        } catch (error) {
          console.error("Error loading book cover images:", error);
          // Set books without covers if image loading fails
          setAllBooks(booksData);
          setFeaturedBooks(booksData.slice(0, 6));
          setPreviewBooks(booksData.slice(0, 8));
        }
      }

    } catch (err) {
      console.error("Error in fetchData:", err);
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
    sessionStorage.removeItem("bookCovers"); // Updated cache name
    sessionStorage.removeItem("categoryImages");
    sessionStorage.removeItem("allBooks");
    sessionStorage.removeItem("allCategories");
    console.log("Cache cleared");
  };

  // Function to get cache info for debugging
  const getCacheInfo = () => {
    try {
      const cachedBookCovers = JSON.parse(sessionStorage.getItem("bookCovers") || "{}");
      const cachedCategoryImages = JSON.parse(sessionStorage.getItem("categoryImages") || "{}");
      
      const bookCacheSize = JSON.stringify(cachedBookCovers).length;
      const categoryCacheSize = JSON.stringify(cachedCategoryImages).length;
      const totalCacheSize = bookCacheSize + categoryCacheSize;
      
      const bookCoverCount = Object.keys(cachedBookCovers).length;
      const categoryImageCount = Object.keys(cachedCategoryImages).length;
      
      console.log(`Book covers cache: ${bookCoverCount} covers, ${(bookCacheSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Category images cache: ${categoryImageCount} images, ${(categoryCacheSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Total cache size: ${(totalCacheSize / 1024 / 1024).toFixed(2)} MB`);
      
      return { 
        bookCoverCount, 
        categoryImageCount, 
        bookCacheSize, 
        categoryCacheSize, 
        totalCacheSize 
      };
    } catch (error) {
      console.error("Error getting cache info:", error);
      return { 
        bookCoverCount: 0, 
        categoryImageCount: 0, 
        bookCacheSize: 0, 
        categoryCacheSize: 0, 
        totalCacheSize: 0 
      };
    }
  };

  const handleExploreBooks = () => {
    navigate('/books');
    window.location.reload();
  };

  const handleViewAllCategories = () => {
    document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/books?category=${encodeURIComponent(categoryName)}`);
    window.location.reload();
  };

  return (
    <div className={styles.landingPage}>
      {/* Hero Section */}
      <div className={styles.discovery}>
        <Discovery />
      </div>

      {/* Loading indicator for images */}
      {(imageLoading || categoryImageLoading) && (
        <div className={styles.imageLoadingIndicator}>
          <div className={styles.loadingContent}>
            <p>
              {categoryImageLoading && "Loading category images..."}
              {imageLoading && `Loading book covers... ${imageLoadingProgress > 0 ? `${imageLoadingProgress}%` : ''}`}
            </p>
            {imageLoading && imageLoadingProgress > 0 && (
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

      {/* Error Display */}
      {error && (
        <div className={styles.errorMessage}>
          <p>⚠️ {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
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
      <div id="categories" className={styles.categoriesSection}>
        <CategoriesView 
          categories={categories} 
          books={previewBooks}
          onCategoryClick={handleCategoryClick} 
        />
      </div>

      {/* Books Preview Section */}
      <div className={styles.booksPreviewSection}>
        <BookViewCard 
          books={previewBooks}
          loading={loading}
          error={error}
          showPagination={false}
        />
      </div>

      {/* Why Choose Us Section */}
      <div className={styles.whyChooseSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Choose Shaahkart?</h2>
          <p className={styles.sectionSubtitle}>More than just a bookstore</p>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📦</div>
            <h3 className={styles.featureTitle}>Free Shipping</h3>
            <p className={styles.featureDescription}>
              Free shipping on all orders. Get your books delivered right to your doorstep.
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
      </div>

      {/* Call to Action Section */}
      <div className={styles.ctaSection}>
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
      </div>

      {/* Stats Section */}
      <div className={styles.statsSection}>
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
      </div>
    </div>
  );
};

export default LandingPage;