import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './CategoriesView.module.css';

const CategoriesView = () => {
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesResponse, booksResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/categories`),
        axios.get(`${API_BASE_URL}/bookList`)
      ]);
      
      setCategories(categoriesResponse.data.data || []);
      setBooks(booksResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load categories');
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

  const handleCategoryClick = (category) => {
    navigate(`/books?category=${encodeURIComponent(category)}`);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading Categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={fetchData} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Browse by Category</h1>
        <p className={styles.subtitle}>Find your perfect book in our carefully curated categories</p>
      </div>
      
      <div className={styles.categoriesGrid}>
        {categories.map((category) => (
          <div 
            key={category} 
            className={styles.categoryCard}
            onClick={() => handleCategoryClick(category)}
          >
            <div className={styles.categoryIcon}>
              {getCategoryIcon(category)}
            </div>
            <h3 className={styles.categoryTitle}>{category}</h3>
            <p className={styles.categoryCount}>
              {getCategoryCount(category).toLocaleString()} books
            </p>
            <div className={styles.categoryOverlay}>
              <span>View Books →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoriesView;