import React, { useState, useEffect } from 'react';
import { Search, Heart, ShoppingCart, User, Menu, X } from 'lucide-react';
import styles from './LandingPage.module.css';

// Mock axios for demo - replace with actual axios import
const axios = {
  get: async (url) => {
    // Mock API responses
    if (url === '/api/bookList') {
      return {
        data: {
          data: [
            {
              bookId: 1,
              bookName: "The Dragon's Legacy",
              description: "Epic fantasy adventure in a realm of magic and dragons",
              category: "Fantasy",
              authorName: "Sarah Mitchell",
              price: 24.99,
              bookTags: ["BESTSELLER", "SALE"]
            },
            {
              bookId: 2,
              bookName: "Hearts Entwined",
              description: "A passionate romance that spans generations",
              category: "Romance",
              authorName: "Emma Davidson",
              price: 19.99,
              bookTags: ["NEW_RELEASE"]
            },
            {
              bookId: 3,
              bookName: "Shadows of Truth",
              description: "A gripping mystery that will keep you guessing",
              category: "Mystery",
              authorName: "Michael Thompson",
              price: 22.99,
              bookTags: ["NEW_RELEASE"]
            },
            {
              bookId: 4,
              bookName: "Quantum Horizons",
              description: "Hard science fiction exploring the boundaries of reality",
              category: "Sci-Fi",
              authorName: "David Chen",
              price: 26.99,
              bookTags: ["TOP_RATED"]
            },
            {
              bookId: 5,
              bookName: "The Mind Unveiled",
              description: "Understanding human psychology and behavior",
              category: "Psychology",
              authorName: "Dr. Lisa Johnson",
              price: 29.99,
              bookTags: ["BESTSELLER"]
            },
            {
              bookId: 6,
              bookName: "Business Mastery",
              description: "Strategic insights for modern entrepreneurs",
              category: "Business",
              authorName: "Robert Williams",
              price: 34.99,
              bookTags: ["TOP_RATED"]
            }
          ]
        }
      };
    }
    if (url === '/api/categories') {
      return {
        data: {
          data: ["Fantasy", "Romance", "Mystery", "Sci-Fi", "History", "Psychology", "Children", "Business"]
        }
      };
    }
  }
};

const LandingPage = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [booksResponse, categoriesResponse] = await Promise.all([
        axios.get('/api/bookList'),
        axios.get('/api/categories')
      ]);
      
      setBooks(booksResponse.data.data);
      setCategories(categoriesResponse.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Fantasy: '🐲',
      Romance: '❤️',
      Mystery: '🕵️‍♂️',
      'Sci-Fi': '🚀',
      History: '🏛️',
      Psychology: '🧠',
      Children: '😊',
      Business: '💼'
    };
    return icons[category] || '📚';
  };

  const getCategoryCount = (category) => {
    return books.filter(book => book.category === category).length;
  };

  const getTagStyle = (tag) => {
    const tagStyles = {
      BESTSELLER: styles.bestseller,
      NEW_RELEASE: styles.newRelease,
      TOP_RATED: styles.topRated,
      SALE: styles.sale
    };
    return tagStyles[tag] || '';
  };

  const getTagText = (tag) => {
    const tagTexts = {
      BESTSELLER: 'Bestseller',
      NEW_RELEASE: 'New',
      TOP_RATED: 'Top Rated',
      SALE: 'Sale'
    };
    return tagTexts[tag] || tag;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading BookHaven...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.topBar}>
          <div className={styles.topBarContent}>
            <span className={styles.freeShipping}>📦 Free shipping on orders over $35</span>
            <span className={styles.customerService}>📞 Customer Service: 1-800-BOOKS</span>
            <div className={styles.authLinks}>
              <span>Sign In</span>
              <span>Create Account</span>
            </div>
          </div>
        </div>
        
        <div className={styles.mainHeader}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>📚</span>
              <h1>BookHaven</h1>
            </div>
            
            <div className={styles.searchBar}>
              <input 
                type="text" 
                placeholder="Search books, authors, genres..."
                className={styles.searchInput}
              />
              <button className={styles.searchButton}>
                <Search size={20} />
                Search
              </button>
            </div>
            
            <div className={styles.headerActions}>
              <button className={styles.actionButton}>
                <Heart size={20} />
              </button>
              <button className={styles.actionButton}>
                <ShoppingCart size={20} />
              </button>
              <div className={styles.userInfo}>
                <User size={20} />
                <span>John Doe</span>
              </div>
              <button 
                className={styles.mobileMenuButton}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        <nav className={`${styles.navigation} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <div className={styles.navContent}>
            <a href="#" className={styles.navLink}>Home</a>
            <a href="#" className={styles.navLink}>New Releases</a>
            <a href="#" className={styles.navLink}>Best Sellers</a>
            <a href="#" className={styles.navLink}>Categories</a>
            <a href="#" className={styles.navLink}>Authors</a>
            <a href="#" className={styles.navLink}>Sale</a>
          </div>
        </nav>
      </header>

      <main className={styles.main}>
        {/* Browse by Genre Section */}
        <section className={styles.genreSection}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Browse by Genre</h2>
            <p className={styles.sectionSubtitle}>Find your perfect book in our carefully curated categories</p>
            
            <div className={styles.genreGrid}>
              {categories.map((category) => (
                <div key={category} className={styles.genreCard}>
                  <div className={styles.genreIcon}>
                    {getCategoryIcon(category)}
                  </div>
                  <h3 className={styles.genreTitle}>{category}</h3>
                  <p className={styles.genreCount}>
                    {getCategoryCount(category).toLocaleString()} books
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Books Section */}
        <section className={styles.featuredSection}>
          <div className={styles.sectionContent}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Featured Books</h2>
                <p className={styles.sectionSubtitle}>Handpicked selections from our editors</p>
              </div>
              <button className={styles.viewAllButton}>
                View All →
              </button>
            </div>
            
            <div className={styles.bookGrid}>
              {books.slice(0, 4).map((book) => (
                <div key={book.bookId} className={styles.bookCard}>
                  <div className={styles.bookImageContainer}>
                    <div className={styles.bookImage}>
                      <span className={styles.bookPlaceholder}>📖</span>
                    </div>
                    {book.bookTags.map((tag) => (
                      <span key={tag} className={`${styles.bookTag} ${getTagStyle(tag)}`}>
                        {getTagText(tag)}
                      </span>
                    ))}
                    <button className={styles.favoriteButton}>
                      <Heart size={20} />
                    </button>
                  </div>
                  
                  <div className={styles.bookInfo}>
                    <h3 className={styles.bookTitle}>{book.bookName}</h3>
                    <p className={styles.bookAuthor}>{book.authorName}</p>
                    <p className={styles.bookDescription}>{book.description}</p>
                    <div className={styles.bookFooter}>
                      <span className={styles.bookPrice}>${book.price}</span>
                      <span className={styles.bookCategory}>{book.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All Books Section */}
        <section className={styles.allBooksSection}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>All Books</h2>
            <div className={styles.bookList}>
              {books.map((book) => (
                <div key={book.bookId} className={styles.bookListItem}>
                  <div className={styles.bookListImage}>
                    <span className={styles.bookPlaceholder}>📖</span>
                    {book.bookTags.map((tag) => (
                      <span key={tag} className={`${styles.bookTag} ${getTagStyle(tag)}`}>
                        {getTagText(tag)}
                      </span>
                    ))}
                  </div>
                  <div className={styles.bookListInfo}>
                    <h4 className={styles.bookListTitle}>{book.bookName}</h4>
                    <p className={styles.bookListAuthor}>{book.authorName}</p>
                    <p className={styles.bookListDescription}>{book.description}</p>
                    <div className={styles.bookListFooter}>
                      <span className={styles.bookListPrice}>${book.price}</span>
                      <span className={styles.bookListCategory}>{book.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;