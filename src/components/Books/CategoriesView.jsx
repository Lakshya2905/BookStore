import React from 'react';
import styles from './CategoriesView.module.css';

const CategoriesView = ({ categories = [], books = [], onCategoryClick }) => {
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

if (!categories.length) {
    return (
      <div className={styles.noCategories}>
        <h2>No Categories Available</h2>
        <p>Check back later for book categories.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.categoriesGrid}>
        {categories.map((category) => (
          <article 
            key={category} 
            className={styles.categoryCard}
            onClick={() => onCategoryClick(category)}
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
          </article>
        ))}
      </div>
    </div>
  );

};

export default CategoriesView;
