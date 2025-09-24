import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './BlogPage.module.css';
import { BLOG_VIEW_URL } from '../../constants/apiConstants';

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BLOG_VIEW_URL}`);
      
      if (response.data.status === 'SUCCESS') {
        setBlogs(response.data.payload);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to fetch blogs');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to format date to dd-mm-yyyy
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      return dateString; // Return original if formatting fails
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading our latest stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Book Stories & Insights</h1>
          <p className={styles.subtitle}>
            Discover fascinating stories, author interviews, and literary insights from our curated collection
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {error ? (
          <div className={styles.errorWrapper}>
            <div className={styles.errorCard}>
              <h3>Unable to Load Stories</h3>
              <p>{error}</p>
              <button onClick={fetchBlogs} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          </div>
        ) : blogs.length === 0 ? (
          <div className={styles.emptyWrapper}>
            <div className={styles.emptyCard}>
              <h3>No Stories Available</h3>
              <p>Check back soon for new literary content and book insights!</p>
            </div>
          </div>
        ) : (
          <div className={styles.blogList}>
            {blogs.map((blog, index) => (
              <article key={blog.id} className={styles.blogPost}>
                <div className={styles.postHeader}>
                
                  {blog.heading && (
                    <div className={styles.postTitleRow}>
                      <h2 className={styles.postTitle}>{blog.heading}</h2>
                      <span className={styles.postDate}>
                        {formatDate(blog.date)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className={styles.postContent}>
                  <div className={styles.postDescription}>
                    {blog.description.split('\n').map((paragraph, paragraphIndex) => (
                      paragraph.trim() && (
                        <p key={paragraphIndex} className={styles.postParagraph}>
                          {paragraph.trim()}
                        </p>
                      )
                    ))}
                  </div>
                </div>
                
                <div className={styles.postFooter}>
                  <div className={styles.postDivider}></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BlogPage;