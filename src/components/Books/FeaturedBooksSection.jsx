import React, { useState, useMemo } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { addItemToCart } from '../../api/addItemToCart';

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
    const baseClass = "message";
    switch (status) {
      case "SUCCESS":
      case "AUTHORIZED":
        return `${baseClass} messageSuccess`;
      case "FAILED":
      case "UNAUTHORIZED":
        return `${baseClass} messageError`;
      case "NOT_FOUND":
        return `${baseClass} messageWarning`;
      default:
        return `${baseClass} messageInfo`;
    }
  };

  // Get tag display name and style
  const getTagInfo = (tag) => {
    switch (tag) {
      case 'NEW_RELEASE':
        return { label: 'New Release', className: 'newRelease' };
      case 'BESTSELLER':
        return { label: 'Bestseller', className: 'bestseller' };
      case 'TOP_RATED':
        return { label: 'Top Rated', className: 'topRated' };
      default:
        return { label: 'Featured', className: 'defaultTag' };
    }
  };

  const BookCard = ({ book }) => {
    const primaryTag = book.bookTags?.[0] || 'FEATURED';
    const tagInfo = getTagInfo(primaryTag);
    const quantity = getQuantity(book.bookId);
    
    return (
      <div className="bookCard">
        <div className="bookCover">
          {book.imageUrl ? (
            <img 
              src={book.imageUrl} 
              alt={book.bookName}
              className="bookCoverImage"
              loading="lazy"
            />
          ) : (
            <div className="bookPlaceholder">📚</div>
          )}
          <span className={`bookTag ${tagInfo.className}`}>
            {tagInfo.label}
          </span>
        </div>
        
        <div className="bookInfo">
          <h3 className="bookTitle">{book.bookName}</h3>
          <p className="bookAuthor">by {book.authorName}</p>
          <p className="bookCategory">{book.category || 'General'}</p>
          
          <div className="bookMeta">
            <span className="bookPrice">₹{book.price}</span>
            {book.category && (
              <span className="categoryBadge">{book.category}</span>
            )}
          </div>
          
          {/* Quantity Selector */}
          <div className="quantitySelector">
            <button 
              className="quantityBtn"
              onClick={() => handleQuantityChange(book.bookId, quantity - 1)}
              disabled={quantity <= 1}
              type="button"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <input 
              type="number"
              className="quantityInput"
              value={quantity}
              onChange={(e) => handleQuantityChange(book.bookId, parseInt(e.target.value) || 1)}
              min="1"
              max="99"
              aria-label="Quantity"
            />
            <button 
              className="quantityBtn"
              onClick={() => handleQuantityChange(book.bookId, quantity + 1)}
              disabled={quantity >= 99}
              type="button"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          
          <div className="bookActions">
            <button 
              className={`addToCartBtn ${cartLoading[book.bookId] ? 'loading' : ''}`}
              onClick={() => handleAddToCart(book.bookId)}
              disabled={cartLoading[book.bookId]}
              type="button"
            >
              {cartLoading[book.bookId] ? (
                <>
                  <div className="buttonSpinner"></div>
                  Adding...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  Add to Cart
                </>
              )}
            </button>
            <button className="buyNowBtn" type="button">
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
      <div className="categorySection">
        <div className="categoryHeader">
          <div className="categoryTitleWrapper">
            <div className="categoryIcon">{icon}</div>
            <h2 className="categoryTitle">{title}</h2>
            <div className="categoryCount">({books.length} books)</div>
          </div>
          <div className="categoryControls">
            <button 
              className={`carouselBtn ${!canGoLeft ? 'disabled' : ''}`}
              onClick={() => handleCarouselNav(categoryKey, -1)}
              disabled={!canGoLeft}
              type="button"
              aria-label={`Previous ${title.toLowerCase()}`}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              className={`carouselBtn ${!canGoRight ? 'disabled' : ''}`}
              onClick={() => handleCarouselNav(categoryKey, 1)}
              disabled={!canGoRight}
              type="button"
              aria-label={`Next ${title.toLowerCase()}`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="booksCarousel">
          <div className="booksGrid">
            {visibleBooks.map((book) => (
              <BookCard key={book.bookId} book={book} />
            ))}
          </div>
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
    <section className="featuredSection">
      {/* Cart Message Display */}
      {cartMessage && (
        <div className={getMessageClass(messageType)}>
          <div className="messageContent">
            <span>{cartMessage}</span>
            <button 
              className="messageClose"
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

      <div className="sectionContainer">
        {/* Main Header */}
        <div className="mainHeader">
          <div className="headerContent">
            <h1 className="mainTitle">Featured Books</h1>
            <p className="mainSubtitle">Discover our carefully curated collection of exceptional reads</p>
          </div>
          <div className="headerDecoration">
            <div className="decorationCircle"></div>
            <div className="decorationLine"></div>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading featured books...</p>
          </div>
        ) : error ? (
          <div className="error">
            <div className="errorContent">
              <h3>Oops! Something went wrong</h3>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="retryButton">
                Try Again
              </button>
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
              <div className="categorySection">
                <div className="categoryHeader">
                  <div className="categoryTitleWrapper">
                    <div className="categoryIcon">📚</div>
                    <h2 className="categoryTitle">All Featured Books</h2>
                  </div>
                </div>
                <div className="booksGrid">
                  {books.length > 0 ? (
                    books.slice(0, 8).map((book) => (
                      <BookCard key={book.bookId} book={book} />
                    ))
                  ) : (
                    <div className="noBooks">
                      <div className="noBooksContent">
                        <div className="noBooksIcon">📖</div>
                        <h3>No featured books available</h3>
                        <p>Check back soon for our latest picks!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        
        <div className="sectionFooter">
          <button className="viewAllButton" onClick={onViewAllClick} type="button">
            <span>Explore Our Complete Collection</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      <style jsx>{`
        /* Featured Books Section Styles */
        .featuredSection {
          padding: 4rem 1rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
          position: relative;
        }

        .featuredSection::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 200px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          clip-path: polygon(0 0, 100% 0, 100% 70%, 0 100%);
        }

        .sectionContainer {
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* Main Header */
        .mainHeader {
          text-align: center;
          margin-bottom: 4rem;
          position: relative;
        }

        .headerContent {
          background: white;
          padding: 3rem 2rem;
          border-radius: 2rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .headerContent::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
        }

        .mainTitle {
          font-size: 3.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #1e293b, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .mainSubtitle {
          font-size: 1.25rem;
          color: #64748b;
          font-weight: 400;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .headerDecoration {
          position: absolute;
          top: -2rem;
          right: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .decorationCircle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          opacity: 0.8;
        }

        .decorationLine {
          width: 100px;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, transparent);
        }

        /* Category Section */
        .categorySection {
          margin-bottom: 4rem;
          background: white;
          border-radius: 1.5rem;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }

        .categoryHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f1f5f9;
        }

        .categoryTitleWrapper {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .categoryIcon {
          font-size: 2rem;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #e2e8f0;
        }

        .categoryTitle {
          font-size: 2.25rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .categoryCount {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 500;
          background: #f1f5f9;
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
        }

        .categoryControls {
          display: flex;
          gap: 0.5rem;
        }

        .carouselBtn {
          width: 48px;
          height: 48px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #64748b;
        }

        .carouselBtn:hover:not(.disabled) {
          border-color: #3b82f6;
          background: #3b82f6;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
        }

        .carouselBtn.disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Books Grid */
        .booksCarousel {
          overflow: hidden;
        }

        .booksGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          transition: transform 0.3s ease;
        }

        /* Book Card */
        .bookCard {
          background: white;
          border-radius: 1.25rem;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          border: 1px solid #f1f5f9;
        }

        .bookCard:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .bookCover {
          position: relative;
          width: 100%;
          height: 240px;
          background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .bookCoverImage {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .bookCard:hover .bookCoverImage {
          transform: scale(1.05);
        }

        .bookPlaceholder {
          font-size: 4rem;
          color: #94a3b8;
        }

        .bookTag {
          position: absolute;
          top: 1rem;
          left: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          z-index: 2;
          backdrop-filter: blur(10px);
        }

        .newRelease {
          background: rgba(99, 102, 241, 0.9);
          color: white;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .bestseller {
          background: rgba(245, 158, 11, 0.9);
          color: white;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .topRated {
          background: rgba(139, 92, 246, 0.9);
          color: white;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .defaultTag {
          background: rgba(59, 130, 246, 0.9);
          color: white;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        /* Book Info */
        .bookInfo {
          padding: 1.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .bookTitle {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .bookAuthor {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 0.75rem;
          font-weight: 500;
        }

        .bookCategory {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-bottom: 1rem;
          font-weight: 400;
        }

        .bookMeta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .bookPrice {
          font-size: 1.375rem;
          font-weight: 800;
          background: linear-gradient(135deg, #059669, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .categoryBadge {
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          color: #475569;
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid #e2e8f0;
        }

        /* Quantity Selector */
        .quantitySelector {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .quantityBtn {
          width: 36px;
          height: 36px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
          color: #374151;
        }

        .quantityBtn:hover:not(:disabled) {
          border-color: #3b82f6;
          background: #f8fafc;
          color: #3b82f6;
        }

        .quantityBtn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .quantityInput {
          width: 60px;
          height: 36px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
          color: #374151;
          background: white;
        }

        .quantityInput:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Book Actions */
        .bookActions {
          margin-top: auto;
          display: flex;
          gap: 0.75rem;
        }

        .addToCartBtn,
        .buyNowBtn {
          padding: 0.875rem 1.25rem;
          border: none;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .addToCartBtn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: 2px solid transparent;
        }

        .addToCartBtn:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }

        .addToCartBtn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .buyNowBtn {
          background: linear-gradient(135deg, #059669, #047857);
          color: white;
          border: 2px solid transparent;
        }

        .buyNowBtn:hover {
          background: linear-gradient(135deg, #047857, #065f46);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(5, 150, 105, 0.3);
        }

        .buttonSpinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Message Styles */
        .message {
          position: fixed;
          top: 2rem;
          right: 2rem;
          z-index: 1000;
          border-radius: 1rem;
          padding: 1rem 1.5rem;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
          animation: slideInRight 0.4s ease-out;
          max-width: 400px;
          backdrop-filter: blur(10px);
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .messageContent {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .messageClose {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: inherit;
          opacity: 0.8;
          transition: opacity 0.2s ease;
          padding: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .messageClose:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.2);
        }

        .messageSuccess {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95));
          color: white;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .messageError {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95));
          color: white;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .messageWarning {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95));
          color: white;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .messageInfo {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95));
          color: white;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        /* Loading and Error States */
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          color: #64748b;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1.5rem;
        }

        .loading p {
          font-size: 1.125rem;
          font-weight: 500;
        }

        .error {
          display: flex;
          justify-content: center;
          padding: 6rem 2rem;
        }

        .errorContent {
          text-align: center;
          max-width: 500px;
          background: white;
          padding: 3rem 2rem;
          border-radius: 1.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .errorContent h3 {
          color: #dc2626;
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .errorContent p {
          color: #64748b;
          font-size: 1rem;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .retryButton {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .retryButton:hover {
          background: linear-gradient(135deg, #b91c1c, #991b1b);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
        }

        /* No Books State */
        .noBooks {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          padding: 4rem 2rem;
        }

        .noBooksContent {
          text-align: center;
          max-width: 500px;
        }

        .noBooksIcon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          opacity: 0.6;
        }

        .noBooksContent h3 {
          color: #475569;
          font-size: 1.75rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .noBooksContent p {
          color: #64748b;
          font-size: 1.125rem;
          line-height: 1.6;
        }

        /* Section Footer */
        .sectionFooter {
          text-align: center;
          padding: 3rem 0;
          margin-top: 2rem;
        }

        .viewAllButton {
          background: linear-gradient(135deg, #1e293b, #374151);
          color: white;
          border: none;
          padding: 1.25rem 2.5rem;
          border-radius: 1rem;
          font-weight: 600;
          font-size: 1.125rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          position: relative;
          overflow: hidden;
        }

        .viewAllButton::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .viewAllButton:hover::before {
          left: 100%;
        }

        .viewAllButton:hover {
          background: linear-gradient(135deg, #374151, #4b5563);
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(30, 41, 59, 0.3);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .booksGrid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }
          
          .mainTitle {
            font-size: 3rem;
          }
        }

        @media (max-width: 968px) {
          .featuredSection {
            padding: 3rem 1rem;
          }
          
          .headerContent {
            padding: 2rem 1.5rem;
          }
          
          .mainTitle {
            font-size: 2.5rem;
          }
          
          .mainSubtitle {
            font-size: 1.125rem;
          }
          
          .categorySection {
            padding: 1.5rem;
          }
          
          .categoryHeader {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          
          .categoryControls {
            align-self: flex-end;
          }
          
          .booksGrid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
          
          .message {
            top: 1rem;
            left: 1rem;
            right: 1rem;
            max-width: none;
          }
        }

        @media (max-width: 640px) {
          .featuredSection::before {
            height: 120px;
          }
          
          .headerContent {
            padding: 2rem 1rem;
          }
          
          .mainTitle {
            font-size: 2rem;
          }
          
          .mainSubtitle {
            font-size: 1rem;
          }
          
          .headerDecoration {
            display: none;
          }
          
          .categorySection {
            padding: 1rem;
          }
          
          .categoryTitleWrapper {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          
          .categoryIcon {
            width: 50px;
            height: 50px;
            font-size: 1.5rem;
          }
          
          .categoryTitle {
            font-size: 1.75rem;
          }
          
          .booksGrid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .bookCard {
            max-width: 400px;
            margin: 0 auto;
          }
          
          .bookActions {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .addToCartBtn,
          .buyNowBtn {
            flex: none;
          }
          
          .carouselBtn {
            width: 40px;
            height: 40px;
          }
        }

        @media (max-width: 480px) {
          .featuredSection {
            padding: 2rem 0.75rem;
          }
          
          .headerContent {
            padding: 1.5rem 1rem;
            border-radius: 1rem;
          }
          
          .mainTitle {
            font-size: 1.75rem;
          }
          
          .categorySection {
            padding: 1rem 0.75rem;
            border-radius: 1rem;
          }
          
          .categoryTitle {
            font-size: 1.5rem;
          }
          
          .viewAllButton {
            padding: 1rem 2rem;
            font-size: 1rem;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .bookCard {
            border: 3px solid #000;
          }
          
          .bookTag {
            border: 2px solid #000;
          }
          
          .addToCartBtn,
          .buyNowBtn {
            border: 2px solid #000;
          }
          
          .carouselBtn {
            border: 3px solid #000;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .bookCard,
          .addToCartBtn,
          .buyNowBtn,
          .carouselBtn,
          .viewAllButton,
          .retryButton {
            transition: none;
          }
          
          .bookCard:hover {
            transform: none;
          }
          
          .bookCoverImage {
            transition: none;
          }
          
          .bookCard:hover .bookCoverImage {
            transform: none;
          }
          
          .spinner,
          .buttonSpinner {
            animation: none;
          }
          
          .message {
            animation: none;
          }
          
          .viewAllButton::before {
            display: none;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .featuredSection {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          }
          
          .headerContent,
          .categorySection,
          .bookCard {
            background: #1e293b;
            border-color: #334155;
          }
          
          .mainTitle {
            background: linear-gradient(135deg, #f1f5f9, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .mainSubtitle,
          .categoryTitle,
          .bookTitle {
            color: #f1f5f9;
          }
          
          .bookAuthor,
          .bookCategory {
            color: #94a3b8;
          }
          
          .categoryIcon {
            background: linear-gradient(135deg, #334155, #475569);
          }
          
          .categoryCount,
          .categoryBadge {
            background: #334155;
            color: #cbd5e1;
          }
          
          .quantityBtn,
          .quantityInput,
          .carouselBtn {
            background: #334155;
            border-color: #475569;
            color: #f1f5f9;
          }
        }
      `}</style>
    </section>
  );
};

export default FeaturedBooksSection;