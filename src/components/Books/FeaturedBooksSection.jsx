import React, { useState, useMemo } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Zap } from 'lucide-react';
import { addItemToCart } from '../../api/addItemToCart';
import styles from './FeaturedBooksSection.module.css';

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
  
  // State for quantities
  const [quantities, setQuantities] = useState({});
  
  // State for carousel positions
  const [carouselPositions, setCarouselPositions] = useState({
    bestsellers: 0,
    newReleases: 0,
    topRated: 0
  });

  // Organize books by tags
  const organizedBooks = useMemo(() => {
    const newReleases = books.filter(book => 
      book.bookTags?.includes('NEW_RELEASE')
    );
    const bestsellers = books.filter(book => 
      book.bookTags?.includes('BESTSELLER')
    );
    const topRated = books.filter(book => 
      book.bookTags?.includes('TOP_RATED')
    );
    
    return {
      newReleases,
      bestsellers,
      topRated,
      all: books
    };
  }, [books]);

  // Handle quantity change
  const handleQuantityChange = (bookId, newQuantity) => {
    const quantity = Math.max(1, Math.min(99, newQuantity));
    setQuantities(prev => ({
      ...prev,
      [bookId]: quantity
    }));
  };

  // Get quantity for a book (default to 1)
  const getQuantity = (bookId) => quantities[bookId] || 1;

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

  // Handle carousel navigation
  const handleCarouselNav = (categoryKey, direction) => {
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

  // Get tag display name and style
  const getTagInfo = (tag) => {
    switch (tag) {
      case 'NEW_RELEASE':
        return { label: 'New Release', className: styles.tagNewRelease };
      case 'BESTSELLER':
        return { label: 'Bestseller', className: styles.tagBestseller };
      case 'TOP_RATED':
        return { label: 'Top Rated', className: styles.tagTopRated };
      default:
        return { label: 'Featured', className: styles.tagDefault };
    }
  };

  const BookCard = ({ book }) => {
    const primaryTag = book.bookTags?.[0] || 'FEATURED';
    const tagInfo = getTagInfo(primaryTag);
    const quantity = getQuantity(book.bookId);
    
    return (
      <div className={`${styles.bookCard} card h-100`}>
        <div className={styles.bookImageContainer}>
          {book.imageUrl ? (
            <img 
              src={book.imageUrl} 
              alt={book.bookName}
              className={`${styles.bookImage} card-img-top`}
            />
          ) : (
            <div className={styles.bookPlaceholder}>
              <i className="fas fa-book fa-3x text-muted"></i>
            </div>
          )}
          <span className={`${styles.bookTag} ${tagInfo.className} badge position-absolute`}>
            {tagInfo.label}
          </span>
        </div>
        
        <div className="card-body d-flex flex-column">
          <h5 className={`${styles.bookTitle} card-title`}>{book.bookName}</h5>
          <p className={`${styles.bookAuthor} card-text text-muted`}>by {book.authorName}</p>
          <p className={`${styles.bookCategory} text-muted small`}>{book.category || 'General'}</p>
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className={`${styles.bookPrice} fw-bold text-success`}>₹{book.price}</span>
            {book.category && (
              <span className={`${styles.categoryBadge} badge bg-light text-dark`}>
                {book.category}
              </span>
            )}
          </div>
          
          {/* Quantity Selector */}
          <div className={`${styles.quantitySelector} d-flex align-items-center justify-content-center mb-3`}>
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => handleQuantityChange(book.bookId, quantity - 1)}
              disabled={quantity <= 1}
              type="button"
            >
              -
            </button>
            <input 
              type="number"
              className={`${styles.quantityInput} form-control form-control-sm text-center mx-2`}
              value={quantity}
              onChange={(e) => handleQuantityChange(book.bookId, parseInt(e.target.value) || 1)}
              min="1"
              max="99"
              style={{ width: '70px' }}
            />
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => handleQuantityChange(book.bookId, quantity + 1)}
              disabled={quantity >= 99}
              type="button"
            >
              +
            </button>
          </div>
          
          <div className="d-grid gap-2 mt-auto">
            <button 
              className={`${styles.addToCartBtn} btn btn-primary`}
              onClick={() => handleAddToCart(book.bookId)}
              disabled={cartLoading[book.bookId]}
              type="button"
            >
              {cartLoading[book.bookId] ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingCart size={16} className="me-2" />
                  Add to Cart
                </>
              )}
            </button>
            <button className="btn btn-success" type="button">
              <Zap size={16} className="me-2" />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CategorySection = ({ title, books, categoryKey, icon }) => {
    if (books.length === 0) return null;
    
    const position = carouselPositions[categoryKey];
    const canGoLeft = position > 0;
    const canGoRight = position < books.length - 4;
    const visibleBooks = books.slice(position, position + 4);

    return (
      <div className={`${styles.categorySection} mb-5`}>
        <div className={`${styles.categoryHeader} d-flex justify-content-between align-items-center mb-4`}>
          <div className="d-flex align-items-center">
            <span className={`${styles.categoryIcon} me-3`}>{icon}</span>
            <div>
              <h2 className={`${styles.categoryTitle} mb-0`}>{title}</h2>
              <small className="text-muted">({books.length} books)</small>
            </div>
          </div>
          <div className={`${styles.categoryControls} d-flex`}>
            <button 
              className={`btn btn-outline-primary me-2 ${!canGoLeft ? 'disabled' : ''}`}
              onClick={() => handleCarouselNav(categoryKey, -1)}
              disabled={!canGoLeft}
              type="button"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              className={`btn btn-outline-primary ${!canGoRight ? 'disabled' : ''}`}
              onClick={() => handleCarouselNav(categoryKey, 1)}
              disabled={!canGoRight}
              type="button"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="row g-4">
          {visibleBooks.map((book) => (
            <div key={book.bookId} className="col-xl-3 col-lg-4 col-md-6">
              <BookCard book={book} />
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
    <div className={styles.featuredSection}>
      {/* Cart Message Display */}
      {cartMessage && (
        <div className={`${getMessageClass(messageType)} alert alert-dismissible fade show position-fixed`} 
             style={{ top: '20px', right: '20px', zIndex: 1050, minWidth: '300px' }}>
          <div className="d-flex justify-content-between align-items-center">
            <span>{cartMessage}</span>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => {
                setCartMessage("");
                setMessageType("");
              }}
            ></button>
          </div>
        </div>
      )}

      <div className="container-fluid py-5">
        {/* Main Header */}
        <div className={`${styles.mainHeader} text-center mb-5`}>
          <div className={`${styles.headerCard} card border-0 shadow-sm mx-auto`}>
            <div className="card-body py-5">
              <h1 className={`${styles.mainTitle} display-4 fw-bold mb-3`}>Featured Books</h1>
              <p className={`${styles.mainSubtitle} lead text-muted`}>
                Discover our carefully curated collection of exceptional reads
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className={`${styles.loading} text-center py-5`}>
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted fs-5">Loading featured books...</p>
          </div>
        ) : error ? (
          <div className={`${styles.error} text-center py-5`}>
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
              <div className={`${styles.categorySection} mb-5`}>
                <div className={`${styles.categoryHeader} d-flex align-items-center mb-4`}>
                  <span className={`${styles.categoryIcon} me-3`}>📚</span>
                  <h2 className={`${styles.categoryTitle} mb-0`}>All Featured Books</h2>
                </div>
                <div className="row g-4">
                  {books.length > 0 ? (
                    books.slice(0, 8).map((book) => (
                      <div key={book.bookId} className="col-xl-3 col-lg-4 col-md-6">
                        <BookCard book={book} categoryTag={null} />
                      </div>
                    ))
                  ) : (
                    <div className="col-12">
                      <div className={`${styles.noBooks} text-center py-5`}>
                        <div className="card border-0">
                          <div className="card-body">
                            <div className="text-muted mb-3">
                              <i className="fas fa-book-open fa-4x"></i>
                            </div>
                            <h3 className="card-title text-muted">No featured books available</h3>
                            <p className="card-text text-muted">Check back soon for our latest picks!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        
        <div className={`${styles.sectionFooter} text-center pt-4 mt-5`}>
          <button 
            className={`${styles.viewAllButton} btn btn-dark btn-lg`}
            onClick={onViewAllClick} 
            type="button"
          >
            <span className="me-2">Explore Our Complete Collection</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedBooksSection;