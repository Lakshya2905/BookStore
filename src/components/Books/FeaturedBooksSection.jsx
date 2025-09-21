import React, { useEffect, useState, useMemo } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Zap, X } from 'lucide-react';
import { addItemToCart } from '../../api/addItemToCart';
import PlaceOrderModal from "../Order/PlaceOrderModal";
import ImageViewModal from "./ImageViewModal"; // Import the new component
import styles from './FeaturedBooksSection.module.css';

const loadBootstrap = () => {
  if (document.getElementById('featured-books-bootstrap')) return;
  const link = document.createElement('link');
  link.id = 'featured-books-bootstrap';
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
  document.head.appendChild(link);
};

const FeaturedBooksSection = ({ 
  books = [], 
  loading = false, 
  error = null, 
  onViewAllClick = () => {} 
}) => {
  // Load Bootstrap when component mounts
  useEffect(() => {
    loadBootstrap();
  }, []);

  // State for cart operations
  const [cartLoading, setCartLoading] = useState({});
  const [cartMessage, setCartMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  
  // State for carousel positions
  const [carouselPositions, setCarouselPositions] = useState({
    bestsellers: 0,
    newReleases: 0,
    topRated: 0
  });

  // State for Place Order Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(null);

  // State for image errors
  const [imageErrors, setImageErrors] = useState({});

  // State for Image View Modal - Updated for new component
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedBookForImage, setSelectedBookForImage] = useState(null);
  const [selectedImageList, setSelectedImageList] = useState([]);

  // State for image slideshow in cards
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [slideshowIntervals, setSlideshowIntervals] = useState({});

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

  // Function to get all available images for a book
  // Function to get all available images for a book
const getBookImages = (book) => {
  const images = [];
  const bookId = book.bookId || book.id;
  
  // Helper function to validate if a string is a valid image URL
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.trim()) return false;
    
    // Check if it's a valid URL format
    try {
      new URL(url);
    } catch {
      // If not a valid URL, check if it's a relative path that looks like an image
      if (!url.includes('.') || (!url.includes('/') && !url.startsWith('data:'))) {
        return false;
      }
    }
    
    // Check if it has image file extension or is a data URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const lowerUrl = url.toLowerCase();
    const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
    const isDataUrl = lowerUrl.startsWith('data:image/');
    
    return hasImageExtension || isDataUrl || lowerUrl.includes('image') || lowerUrl.includes('img');
  };
  
  // Add coverImageUrl if available
  if (book.coverImageUrl && isValidImageUrl(book.coverImageUrl) && !imageErrors[`${bookId}-cover`]) {
    images.push({ url: book.coverImageUrl, type: 'cover', key: `${bookId}-cover` });
  }
  
  // Add imageUrl if different from coverImageUrl
  if (book.imageUrl && isValidImageUrl(book.imageUrl) && 
      book.imageUrl !== book.coverImageUrl && 
      !imageErrors[`${bookId}-main`]) {
    images.push({ url: book.imageUrl, type: 'main', key: `${bookId}-main` });
  }
  
  // Add cached image if available and different
  const cachedImage = getCachedImage(bookId);
  if (cachedImage && isValidImageUrl(cachedImage) &&
      cachedImage !== book.coverImageUrl && 
      cachedImage !== book.imageUrl &&
      !imageErrors[`${bookId}-cached`]) {
    images.push({ url: cachedImage, type: 'cached', key: `${bookId}-cached` });
  }
  
  // Add allImages if available
  if (book.allImages && Array.isArray(book.allImages)) {
    book.allImages.forEach((imgObj, index) => {
      let imgUrl;
      
      // Handle different formats of image objects
      if (typeof imgObj === 'string') {
        imgUrl = imgObj;
      } else if (imgObj && typeof imgObj === 'object') {
        imgUrl = imgObj.imageUrl || imgObj.url || imgObj.src;
      }
      
      // Validate the image URL and check for duplicates
      if (imgUrl && isValidImageUrl(imgUrl) &&
          imgUrl !== book.coverImageUrl && 
          imgUrl !== book.imageUrl &&
          imgUrl !== cachedImage &&
          !images.some(img => img.url === imgUrl) && // Prevent duplicates
          !imageErrors[`${bookId}-all-${index}`]) {
        images.push({ 
          url: imgUrl, 
          type: 'additional', 
          key: `${bookId}-all-${index}` 
        });
      }
    });
  }
  
  return images;
};

  // Function to get current display image
  const getCurrentImage = (book) => {
    const allImages = getBookImages(book);
    if (allImages.length === 0) return null;
    
    const bookId = book.bookId || book.id;
    const currentIndex = currentImageIndex[bookId] || 0;
    return allImages[Math.min(currentIndex, allImages.length - 1)] || allImages[0];
  };

  // Initialize slideshow for books with multiple images
  useEffect(() => {
    const intervals = {};
    
    books.forEach(book => {
      const bookId = book.bookId || book.id;
      const allImages = getBookImages(book);
      
      if (allImages.length > 1) {
        intervals[bookId] = setInterval(() => {
          setCurrentImageIndex(prev => ({
            ...prev,
            [bookId]: ((prev[bookId] || 0) + 1) % allImages.length
          }));
        }, 5000); // 5 seconds
      }
    });
    
    setSlideshowIntervals(intervals);
    
    // Cleanup intervals
    return () => {
      Object.values(intervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [books, imageErrors]);

  // Cleanup slideshow intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(slideshowIntervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [slideshowIntervals]);

  // Function to handle image error
  const handleImageError = (imageKey) => {
    setImageErrors(prev => ({ ...prev, [imageKey]: true }));
  };

  // Updated function to open image modal with new component structure
  const openImageModal = (book, event) => {
    event?.preventDefault();
    event?.stopPropagation();
    
    const allImages = getBookImages(book);
    if (allImages.length === 0) return;
    
    // Extract just the URLs for the modal
    const imageUrls = allImages.map(img => img.url);
    
    setSelectedBookForImage(book);
    setSelectedImageList(imageUrls);
    setImageModalOpen(true);
  };

  // Function to close image modal
  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedBookForImage(null);
    setSelectedImageList([]);
  };

  // Function to sort books by priority
  const sortBooksByPriority = (books) => {
    return [...books].sort((a, b) => {
      const priorityA = a.priority || Number.MAX_SAFE_INTEGER;
      const priorityB = b.priority || Number.MAX_SAFE_INTEGER;
      return priorityA - priorityB;
    });
  };

  // Organize books by tags with priority sorting
  const organizedBooks = useMemo(() => {
    const newReleases = sortBooksByPriority(books.filter(book => 
      book.bookTags?.includes('NEW_RELEASE')
    ));
    const bestsellers = sortBooksByPriority(books.filter(book => 
      book.bookTags?.includes('BESTSELLER')
    ));
    const topRated = sortBooksByPriority(books.filter(book => 
      book.bookTags?.includes('TOP_RATED')
    ));
    
    return {
      newReleases,
      bestsellers,
      topRated,
      all: sortBooksByPriority(books)
    };
  }, [books]);

  // Handle Add to Cart - API call unchanged
  const handleAddToCart = async (bookId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setCartLoading(prev => ({ ...prev, [bookId]: true }));
    setCartMessage("");
    
    try {
      const response = await addItemToCart(bookId);
      
      setMessageType(response.status);
      setCartMessage(response.message || "Operation completed");
      
      setTimeout(() => {
        setCartMessage("");
        setMessageType("");
      }, 3000);
      
    } catch (error) {
      setMessageType("FAILED");
      setCartMessage(error.response?.data?.message || error.message || "Failed to add item to cart");
      
      setTimeout(() => {
        setCartMessage("");
        setMessageType("");
      }, 3000);
    } finally {
      setCartLoading(prev => ({ ...prev, [bookId]: false }));
    }
  };

  // Handle Buy Now - Open Place Order Modal
  const handleBuyNow = (bookId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setSelectedBookId(bookId);
    setOrderModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setOrderModalOpen(false);
    setSelectedBookId(null);
  };

  // Handle carousel navigation
  const handleCarouselNav = (categoryKey, direction, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const categoryBooks = organizedBooks[categoryKey];
    const maxPosition = Math.max(0, categoryBooks.length - 4);
    
    setCarouselPositions(prev => ({
      ...prev,
      [categoryKey]: Math.max(0, Math.min(maxPosition, prev[categoryKey] + (direction * 4)))
    }));
  };

  // Get message styling based on status
  const getMessageClass = (status) => {
    switch (status) {
      case "SUCCESS":
      case "AUTHORIZED":
        return `${styles.message} ${styles.messageSuccess}`;
      case "FAILED":
      case "UNAUTHORIZED":
        return `${styles.message} ${styles.messageError}`;
      case "NOT_FOUND":
        return `${styles.message} ${styles.messageWarning}`;
      default:
        return `${styles.message} ${styles.messageInfo}`;
    }
  };

  // Get tag info for display
  const getTagInfo = (bookTags, categoryKey) => {
    if (categoryKey === 'bestsellers' && bookTags?.includes('BESTSELLER')) {
      return { label: 'Bestseller', className: styles.bestseller };
    }
    if (categoryKey === 'topRated' && bookTags?.includes('TOP_RATED')) {
      return { label: 'Top Rated', className: styles.toprated };
    }
    if (categoryKey === 'newReleases' && bookTags?.includes('NEW_RELEASE')) {
      return { label: 'New Release', className: styles.newrelease };
    }
    
    if (bookTags?.includes('BESTSELLER')) {
      return { label: 'Bestseller', className: styles.bestseller };
    }
    if (bookTags?.includes('TOP_RATED')) {
      return { label: 'Top Rated', className: styles.toprated };
    }
    if (bookTags?.includes('NEW_RELEASE')) {
      return { label: 'New Release', className: styles.newrelease };
    }
    
    return null;
  };

  // Calculate discount percentage
  const calculateDiscount = (price, mrp) => {
    if (!mrp || !price || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  const BookCard = ({ book, categoryKey }) => {
    const bookId = book.bookId || book.id;
    const allImages = getBookImages(book);
    const currentImage = getCurrentImage(book);
    const hasMultipleImages = allImages.length > 1;
    const tagInfo = getTagInfo(book.bookTags, categoryKey);
    
    // Price calculations
    const price = parseFloat(book.price) || 0;
    const mrp = parseFloat(book.mrp || book.originalPrice) || price;
    const discount = calculateDiscount(price, mrp);
    
    return (
      <article className={styles.bookCard}>
        <div className={styles.imageContainer}>
          {currentImage ? (
            <div className={styles.imageWrapper}>
              <img 
                src={currentImage.url} 
                alt={book.bookName}
                className={styles.bookImage}
                onError={() => handleImageError(currentImage.key)}
                onClick={(e) => openImageModal(book, e)}
                loading="lazy"
                style={{ cursor: 'pointer' }}
              />
              
              {/* Image Indicators */}
              {hasMultipleImages && (
                <div className={styles.imageIndicators}>
                  {allImages.map((_, index) => (
                    <div
                      key={index}
                      className={`${styles.indicator} ${
                        (currentImageIndex[bookId] || 0) === index ? styles.active : ''
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div 
              className={styles.noImage}
              onClick={(e) => openImageModal(book, e)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.noImageIcon}>📚</div>
              <div className={styles.noImageText}>No Image</div>
            </div>
          )}
          
          {/* Discount Badge */}
          {discount > 0 && (
            <div className={styles.discountBadge}>
              {discount}% OFF
            </div>
          )}
          
          {/* Category Tag */}
          {tagInfo && (
            <div className={`${styles.categoryTag} ${tagInfo.className}`}>
              {tagInfo.label}
            </div>
          )}
        </div>

        <div className={styles.bookDetails}>
          <h3 className={styles.bookTitle}>{book.bookName}</h3>
          <p className={styles.bookAuthor}>by {book.authorName}</p>
          <p className={styles.bookDescription}>
            {book.description || book.bookDescription || "A fascinating read that will captivate your imagination."}
          </p>
          
          <div className={styles.bookMeta}>
            <div className={styles.priceInfo}>
              <span className={styles.currentPrice}>₹{price.toFixed(1)}</span>
              {mrp > price && (
                <span className={styles.originalPrice}>₹{mrp.toFixed(0)}</span>
              )}
            </div>
            {book.category && (
              <span className={styles.categoryBadge}>{book.category}</span>
            )}
          </div>

          <div className={styles.actions}>
            <button 
              className={`${styles.cartButton} ${cartLoading[bookId] ? styles.loading : ''}`}
              onClick={(event) => handleAddToCart(bookId, event)}
              disabled={cartLoading[bookId]}
            >
              {cartLoading[bookId] ? (
                <>
                  <div className={styles.spinner}></div>
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart size={14} />
                  Add to Cart
                </>
              )}
            </button>
            <button 
              className={styles.buyButton}
              onClick={(event) => handleBuyNow(bookId, event)}
            >
              <Zap size={14} />
              Buy Now
            </button>
          </div>
        </div>
      </article>
    );
  };

  const CategorySection = ({ title, books, categoryKey, icon }) => {
    if (books.length === 0) return null;
    
    const position = carouselPositions[categoryKey];
    const canGoLeft = position > 0;
    const canGoRight = position < books.length - 4;
    const visibleBooks = books.slice(position, position + 4);

    return (
      <section className={styles.categorySection}>
        <div className={styles.categoryHeader}>
          <div className={styles.categoryTitle}>
            <span className={styles.categoryIcon}>{icon}</span>
            <h2>{title}</h2>
          </div>
          <div className={styles.categoryNav}>
            <button 
              className={`${styles.carouselButton} ${!canGoLeft ? styles.disabled : ''}`}
              onClick={(event) => handleCarouselNav(categoryKey, -1, event)}
              disabled={!canGoLeft}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              className={`${styles.carouselButton} ${!canGoRight ? styles.disabled : ''}`}
              onClick={(event) => handleCarouselNav(categoryKey, 1, event)}
              disabled={!canGoRight}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className={styles.booksGrid}>
          {visibleBooks.map((book) => (
            <BookCard 
              key={book.bookId || book.id} 
              book={book} 
              categoryKey={categoryKey} 
            />
          ))}
        </div>
      </section>
    );
  };

  const renderCategories = () => {
    const categories = [
      { 
        title: 'Best Sellers', 
        books: organizedBooks.bestsellers, 
        categoryKey: 'bestsellers',
        icon: '🏆'
      },
      { 
        title: 'New Releases', 
        books: organizedBooks.newReleases, 
        categoryKey: 'newReleases',
        icon: '✨'
      },
      { 
        title: 'Top Rated', 
        books: organizedBooks.topRated, 
        categoryKey: 'topRated',
        icon: '⭐'
      }
    ];

    return categories.map(category => (
      <CategorySection 
        key={category.categoryKey}
        title={category.title}
        books={category.books}
        categoryKey={category.categoryKey}
        icon={category.icon}
      />
    ));
  };

  return (
    <div className={styles.container}>
      {/* Cart Message */}
      {cartMessage && (
        <div className={getMessageClass(messageType)}>
          <span>{cartMessage}</span>
          <button 
            className={styles.messageClose}
            onClick={() => {
              setCartMessage("");
              setMessageType("");
            }}
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading featured books...</p>
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Category Sections */}
          {renderCategories()}
          
          {/* Fallback - All Books */}
          {organizedBooks.bestsellers.length === 0 && 
           organizedBooks.newReleases.length === 0 && 
           organizedBooks.topRated.length === 0 && (
            <section className={styles.categorySection}>
              <div className={styles.categoryHeader}>
                <div className={styles.categoryTitle}>
                  <span className={styles.categoryIcon}>📚</span>
                  <h2>All Featured Books</h2>
                </div>
              </div>
              <div className={styles.booksGrid}>
                {organizedBooks.all.slice(0, 8).map((book) => (
                  <BookCard 
                    key={book.bookId || book.id} 
                    book={book} 
                    categoryKey="all" 
                  />
                ))}
              </div>
            </section>
          )}
          
          {/* View All Button */}
          <div className={styles.viewAllSection}>
            <button 
              className={styles.viewAllButton}
              onClick={onViewAllClick}
            >
              <span>Explore Our Complete Collection</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}
      
      {/* Replace old modal with new ImageViewModal component */}
<ImageViewModal
  isOpen={imageModalOpen}
  onClose={closeImageModal}
  bookInfo={selectedBookForImage}
  imageUrlList={selectedImageList}
  onAddToCart={handleAddToCart}
  onBuyNow={handleBuyNow}
/>
      
      {/* Place Order Modal */}
      <PlaceOrderModal
        isOpen={orderModalOpen}
        onClose={handleModalClose}
        bookId={selectedBookId}
      />
    </div>
  );
};

export default FeaturedBooksSection;