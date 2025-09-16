import React, { useState } from 'react';
import styles from './CategoriesView.module.css';

const CategoriesView = ({ categories = [], books = [], onCategoryClick }) => {
  const [imageErrors, setImageErrors] = useState({});

  const getCategoryIcon = (categoryName) => {
    const icons = {
      Fantasy: '🐲',
      Romance: '❤️',
      Mystery: '🕵️‍♂️',
      'Sci-Fi': '🚀',
      'Science Fiction': '🚀',
      History: '🏛️',
      Psychology: '🧠',
      Children: '😊',
      Business: '💼',
      Technology: '💻',
      Thriller: '🔪',
      Horror: '👻',
      Comedy: '😄',
      Drama: '🎭',
      Adventure: '⛰️',
      Biography: '👤',
      Health: '💊',
      Cooking: '👨‍🍳',
      Travel: '✈️',
      Art: '🎨',
      Music: '🎵',
      Sports: '⚽',
      Science: '🔬',
      Philosophy: '🤔',
      Religion: '🙏',
      Politics: '🏛️',
      Economics: '💰',
      Education: '🎓',
      Parenting: '👶',
      'Self-Help': '💪',
      SelfHelp: '💪',
      Fiction: '📖',
      'Non-Fiction': '📚',
      NonFiction: '📚'
    };
    return icons[categoryName] || '📚';
  };

  const getCategoryCount = (categoryName) => {
    if (!books || !Array.isArray(books)) return 0;
    return books.filter(book => 
      book.category === categoryName || 
      book.categoryName === categoryName ||
      (book.categories && book.categories.includes(categoryName))
    ).length;
  };

  const handleImageError = (categoryId) => {
    setImageErrors(prev => ({ ...prev, [categoryId]: true }));
  };

  const handleImageLoad = (categoryId) => {
    setImageErrors(prev => ({ ...prev, [categoryId]: false }));
  };

  if (!categories || !Array.isArray(categories) || categories.length === 0) {
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
        {categories.map((category) => {
          // Handle the CategoryDto structure: {categoryId, categoryName}
          const categoryName = category.categoryName || category.name || category;
          const categoryId = category.categoryId || category.id || categoryName;
          const categoryImage = category.imageUrl || null;
          
          const hasImageError = imageErrors[categoryId];
          const shouldShowImage = categoryImage && !hasImageError;
          const bookCount = getCategoryCount(categoryName);

          if (!categoryName) {
            console.warn('Category missing name:', category);
            return null;
          }

          return (
            <article 
              key={categoryId} 
              className={styles.categoryCard}
              data-category={categoryName}
              onClick={() => onCategoryClick?.(categoryName)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onCategoryClick?.(categoryName);
                }
              }}
            >
              <div className={styles.categoryImageContainer}>
                {shouldShowImage ? (
                  <img 
                    src={categoryImage} 
                    alt={`${categoryName} category`}
                    className={styles.categoryImage}
                    onError={() => handleImageError(categoryId)}
                    onLoad={() => handleImageLoad(categoryId)}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.categoryIconFallback}>
                    <span className={styles.categoryIcon}>
                      {getCategoryIcon(categoryName)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className={styles.categoryContent}>
                <h3 className={styles.categoryTitle}>{categoryName}</h3>
                <p className={styles.categoryCount}>
                  {bookCount.toLocaleString()} book{bookCount !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className={styles.categoryOverlay}>
                <span>View Books →</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesView;