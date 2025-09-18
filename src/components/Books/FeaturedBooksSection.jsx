import React, { useEffect, useState, useMemo } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Zap, ImageOff } from 'lucide-react';
import { addItemToCart } from '../../api/addItemToCart';
import PlaceOrderModal from "../Order/PlaceOrderModal";
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
  const [messageType, setMessageType] = useState(""); // SUCCESS, FAILED, etc.
  
  // State for carousel positions
  const [carouselPositions, setCarouselPositions] = useState({
    bestsellers: 0,
    newReleases: 0,
    topRated: 0
  });

  // State for Place Order Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(null);

  // State for image loading
  const [imageLoadStates, setImageLoadStates] = useState({});
  const [imageErrors, setImageErrors] = useState({});

  // State for cached images
  const [cachedImages, setCachedImages] = useState({});

  // Load cached images from sessionStorage
  useEffect(() => {
    try {
      const storedImages = sessionStorage.getItem("bookImages");
      if (storedImages) {
        setCachedImages(JSON.parse(storedImages));
      }
    } catch (error) {
      console.error("Error loading cached images:", error);
    }
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

  // Function to get book image URL with fallback logic
  const getBookImageUrl = (book) => {
    if (book.coverImageUrl) {
      return book.coverImageUrl;
    }
    
    if (book.imageUrl) {
      return book.imageUrl;
    }
    
    const cachedImage = getCachedImage(book.bookId);
    if (cachedImage) {
      return cachedImage;
    }
    
    return null;
  };

  // Function to handle image load error
  const handleImageError = (bookId) => {
    console.warn(`Failed to load image for book ${bookId}`);
    setImageErrors(prev => ({ ...prev, [bookId]: true }));
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

  // Handle Add to Cart
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

  // Get tag display name and style for specific tags
  const getTagInfo = (bookTags, categoryKey) => {
    // Determine which tag to show based on category
    if (categoryKey === 'bestsellers' && bookTags?.includes('BESTSELLER')) {
      return { label: 'Bestseller', className: styles.bestseller };
    }
    if (categoryKey === 'topRated' && bookTags?.includes('TOP_RATED')) {
      return { label: 'Top Rated', className: styles.toprated };
    }
    if (categoryKey === 'newReleases' && bookTags?.includes('NEW_RELEASE')) {
      return { label: 'New Release', className: styles.newrelease };
    }
    
    // Fallback for general books or mixed categories
    if (bookTags?.includes('BESTSELLER')) {
      return { label: 'Bestseller', className: styles.bestseller };
    }
    if (bookTags?.includes('TOP_RATED')) {
      return { label: 'Top Rated', className: styles.toprated };
    }
    if (bookTags?.includes('NEW_RELEASE')) {
      return { label: 'New Release', className: styles.newrelease };
    }
    
    return null; // No tag to show
  };

  const BookCard = ({ book, categoryKey }) => {
    const imageUrl = getBookImageUrl(book);
    const bookId = book.bookId || book.id;
    const tagInfo = getTagInfo(book.bookTags, categoryKey);
    
    return (
      <article className={styles.bookCard}>
        <div className={styles.bookImageContainer}>
          <div className={styles.bookImage}>
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={book.bookName}
                className={styles.bookCover}
                loading="lazy"
                onError={() => handleImageError(bookId)}
              />
            ) : (
              <div className={styles.bookPlaceholder}>
                <div className={styles.placeholderIcon}>📚</div>
                <div className={styles.placeholderText}>No Image</div>
              </div>
            )}
          </div>
          
          {/* Show tag only if it matches the category */}
          {tagInfo && (
            <div className={`${styles.bookTag} ${tagInfo.className}`}>
              {tagInfo.label}
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
            <button 
              className={`${styles.addToCartButton} ${cartLoading[bookId] ? styles.loading : ''}`}
              onClick={(event) => handleAddToCart(bookId, event)}
              disabled={cartLoading[bookId]}
              type="button"
            >
              {cartLoading[bookId] ? (
                <>
                  <div className={styles.buttonSpinner}></div>
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
              className={styles.checkoutButton} 
              type="button"
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
      <div className={styles.categorySection}>
        <div className={`${styles.categoryHeader} d-flex justify-content-between align-items-center mb-4`}>
          <div className="d-flex align-items-center">
            <span className={`${styles.categoryIcon} me-3`}>{icon}</span>
            <div>
              <h2 className={`${styles.categoryTitle} mb-0`}>{title}</h2>
            </div>
          </div>
          <div className={`${styles.categoryControls} d-flex gap-2`}>
            <button 
              className={`btn btn-outline-primary ${!canGoLeft ? 'disabled' : ''}`}
              onClick={(event) => handleCarouselNav(categoryKey, -1, event)}
              disabled={!canGoLeft}
              type="button"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              className={`btn btn-outline-primary ${!canGoRight ? 'disabled' : ''}`}
              onClick={(event) => handleCarouselNav(categoryKey, 1, event)}
              disabled={!canGoRight}
              type="button"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="row g-4">
          {visibleBooks.map((book) => (
            <div key={book.bookId || book.id} className="col-xl-3 col-lg-4 col-md-6">
              <BookCard book={book} categoryKey={categoryKey} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBooksByCategory = () => {
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
      {/* Cart Message Display */}
      {cartMessage && (
        <div className={`${getMessageClass(messageType)} position-fixed`} 
             style={{ top: '20px', right: '20px', zIndex: 1050, minWidth: '300px' }}>
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

      <div className="container-fluid py-5">
        {/* Main Header */}

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading featured books...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <div className="card border-danger mx-auto" style={{ maxWidth: '500px' }}>
              <div className="card-body">
                <div className="text-danger mb-3">
                  <i className="fas fa-exclamation-triangle fa-3x"></i>
                </div>
                <h3 className="card-title text-danger">Oops! Something went wrong</h3>
                <p className="card-text text-muted">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn btn-danger"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Render books by categories */}
            {renderBooksByCategory()}
            
            {/* If no categorized books, show all books */}
            {organizedBooks.bestsellers.length === 0 && 
             organizedBooks.newReleases.length === 0 && 
             organizedBooks.topRated.length === 0 && (
              <div className={styles.categorySection}>
                <div className={`${styles.categoryHeader} d-flex align-items-center mb-4`}>
                  <span className={`${styles.categoryIcon} me-3`}>📚</span>
                  <div>
                    <h2 className={`${styles.categoryTitle} mb-0`}>All Featured Books</h2>
                    <small className="text-muted">(sorted by priority)</small>
                  </div>
                </div>
                <div className="row g-4">
                  {books.length > 0 ? (
                    organizedBooks.all.slice(0, 8).map((book) => (
                      <div key={book.bookId || book.id} className="col-xl-3 col-lg-4 col-md-6">
                        <BookCard book={book} categoryKey="all" />
                      </div>
                    ))
                  ) : (
                    <div className="col-12">
                      <div className={styles.noBooks}>
                        <h2>No featured books available</h2>
                        <p>Check back soon for our latest picks!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Section Footer with View All Button */}
        <div className={`${styles.sectionFooter} text-center mt-5`}>
          <button 
            className={styles.viewAllButton}
            onClick={onViewAllClick} 
            type="button"
          >
            <span className="me-2">Explore Our Complete Collection</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
      
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