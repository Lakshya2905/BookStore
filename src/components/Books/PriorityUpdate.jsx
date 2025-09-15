import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './PriorityUpdate.module.css';
import { FIND_ALL_BOOK_URL, BOOK_UPDATE_PRIORITY } from '../../constants/apiConstants';

const PriorityUpdate = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewedChanges, setReviewedChanges] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '', show: false });

  const showMessage = (type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => {
      setMessage(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const getUserData = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      const token = sessionStorage.getItem("token");
      return { user, token };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null };
    }
  };

  const processBooksData = (bookList) => {
    // If no priorities exist, assign them based on current order
    const booksWithPriorities = bookList.map((book, index) => ({
      ...book,
      priority: book.priority || index + 1
    }));
    
    // Sort by priority
    return booksWithPriorities.sort((a, b) => a.priority - b.priority);
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { user, token } = getUserData();
      
      if (!user || !token) {
        showMessage('error', 'Please login first');
        return;
      }

      const response = await axios.post(`${FIND_ALL_BOOK_URL}`, {
        user,
        token
      });

      if (response.data && response.data.status === 'SUCCESS') {
        // Process books data and assign priorities if needed
        const processedBooks = processBooksData(response.data.payload);
        setBooks(processedBooks);
        setHasChanges(false);
        setReviewedChanges(false);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      showMessage('error', 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const updatePriorities = async (updatedBooks) => {
    try {
      const { user, token } = getUserData();
      
      if (!user || !token) {
        showMessage('error', 'Please login first');
        return false;
      }

      // Create priority update list
      const priorityUpdateList = updatedBooks.map((book, index) => ({
        bookId: book.bookId,
        priority: index + 1 // Priority starts from 1
      }));

      const response = await axios.post(`${BOOK_UPDATE_PRIORITY}`, {
        user,
        token,
        priorityUpdateList
      });

      if (response.data && response.data.status === 'SUCCESS') {
        setHasChanges(false);
        setReviewedChanges(false);
        return true;
      } else {
        showMessage('error', 'Failed to update priorities');
        return false;
      }
    } catch (error) {
      console.error('Error updating priorities:', error);
      showMessage('error', 'Failed to update priorities');
      return false;
    }
  };

  const handleReviewPriorities = () => {
    setShowReviewModal(true);
  };

  const handleCloseModal = () => {
    setShowReviewModal(false);
  };

  const handleSubmitPriorities = async () => {
    setLoading(true);
    const success = await updatePriorities(books);
    if (success) {
      showMessage('success', 'Priorities have been updated successfully!');
      setShowReviewModal(false);
    }
    setLoading(false);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverIndex(index);
  };

  const handleDragLeave = () => {
    setDraggedOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDraggedOverIndex(null);
      return;
    }

    const updatedBooks = [...books];
    const draggedBook = updatedBooks[draggedIndex];
    
    // Remove the dragged item
    updatedBooks.splice(draggedIndex, 1);
    
    // Insert at new position
    updatedBooks.splice(dropIndex, 0, draggedBook);
    
    // Update priorities based on new order
    const booksWithNewPriorities = updatedBooks.map((book, index) => ({
      ...book,
      priority: index + 1
    }));

    setBooks(booksWithNewPriorities);
    setDraggedIndex(null);
    setDraggedOverIndex(null);
    setHasChanges(true);
    setReviewedChanges(false); // Reset review status when changes are made
  };

  const moveUp = (index) => {
    if (index === 0) return;
    
    const updatedBooks = [...books];
    [updatedBooks[index], updatedBooks[index - 1]] = [updatedBooks[index - 1], updatedBooks[index]];
    
    // Update priorities
    const booksWithNewPriorities = updatedBooks.map((book, idx) => ({
      ...book,
      priority: idx + 1
    }));

    setBooks(booksWithNewPriorities);
    setHasChanges(true);
    setReviewedChanges(false); // Reset review status when changes are made
  };

  const moveDown = (index) => {
    if (index === books.length - 1) return;
    
    const updatedBooks = [...books];
    [updatedBooks[index], updatedBooks[index + 1]] = [updatedBooks[index + 1], updatedBooks[index]];
    
    // Update priorities
    const booksWithNewPriorities = updatedBooks.map((book, idx) => ({
      ...book,
      priority: idx + 1
    }));

    setBooks(booksWithNewPriorities);
    setHasChanges(true);
    setReviewedChanges(false); // Reset review status when changes are made
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  if (loading && books.length === 0) {
    return <div className={styles.loading}>Loading books...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Book Priority Management</h2>
        <div className={styles.headerButtons}>
          {hasChanges && (
            <button 
              onClick={handleReviewPriorities} 
              className={styles.reviewBtn}
              disabled={loading}
            >
              Review & Submit Priorities
            </button>
          )}
  
          <button onClick={fetchBooks} className={styles.refreshBtn} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message.show && (
        <div className={`${styles.messageContainer} ${styles[message.type]}`}>
          <div className={styles.messageIcon}>
            {message.type === 'success' ? '✅' : '❌'}
          </div>
          <div className={styles.messageContent}>
            <p>{message.text}</p>
          </div>
          <button 
            className={styles.messageClose}
            onClick={() => setMessage(prev => ({ ...prev, show: false }))}
          >
            ×
          </button>
        </div>
      )}

      {hasChanges && (
        <div className={styles.changesNotice}>
          <div className={styles.noticeIcon}>⚠️</div>
          <div className={styles.noticeContent}>
            <p>You have unsaved changes. Please review your priorities before submitting.</p>
          </div>
        </div>
      )}

      {books.length === 0 ? (
        <div className={styles.noBooks}>
          <div className={styles.noBooksIcon}>📚</div>
          <p>No books found</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.headerRow}>
                  <th className={styles.priorityHeader}>Priority</th>
                  <th className={styles.bookHeader}>Book Name</th>
                  <th className={styles.authorHeader}>Author</th>
                  <th className={styles.categoryHeader}>Category</th>
                  <th className={styles.priceHeader}>Price</th>
                  <th className={styles.descriptionHeader}>Description</th>
                  <th className={styles.actionsHeader}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book, index) => (
                  <tr
                    key={book.bookId}
                    className={`${styles.row} ${
                      draggedIndex === index ? styles.dragging : ''
                    } ${draggedOverIndex === index ? styles.dragOver : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <td className={styles.priorityCell}>
                      <div className={styles.priorityBadge}>{book.priority}</div>
                    </td>
                    <td className={styles.bookCell}>
                      <div className={styles.bookName}>{book.bookName}</div>
                    </td>
                    <td className={styles.authorCell}>{book.authorName}</td>
                    <td className={styles.categoryCell}>
                      <span className={styles.categoryTag}>{book.category}</span>
                    </td>
                    <td className={styles.priceCell}>
                      {book.price ? `${book.price.toFixed(2)} Rs` : 'N/A'}
                    </td>
                    <td className={styles.descriptionCell}>
                      <div className={styles.description}>
                        {book.description || 'No description available'}
                      </div>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className={`${styles.actionBtn} ${styles.upBtn}`}
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveDown(index)}
                          disabled={index === books.length - 1}
                          className={`${styles.actionBtn} ${styles.downBtn}`}
                          title="Move Down"
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className={styles.instructions}>
        <h3 className={styles.instructionsTitle}>💡 How to Use</h3>
        <ul className={styles.instructionsList}>
          <li>Drag and drop rows to reorder book priorities</li>
          <li>Use the arrow buttons (↑ ↓) to move books up or down</li>
          <li>Click "Review & Submit Priorities" to review and submit your changes</li>
          <li>Review modal will show final order before submitting to server</li>
        </ul>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>📋 Review & Submit Priority Order</h3>
              <button 
                className={styles.closeBtn}
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalDescription}>
                Please review the final priority order below. If you're satisfied with the arrangement, 
                click "Submit Priorities" to save the changes to the server.
              </p>
              <div className={styles.modalTableContainer}>
                <table className={styles.modalTable}>
                  <thead>
                    <tr>
                      <th>Priority</th>
                      <th>Book Name</th>
                      <th>Author</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book, index) => (
                      <tr key={book.bookId} className={styles.modalRow}>
                        <td>
                          <span className={styles.modalPriorityBadge}>{book.priority}</span>
                        </td>
                        <td className={styles.modalBookName}>{book.bookName}</td>
                        <td>{book.authorName}</td>
                        <td>
                          <span className={styles.modalCategoryTag}>{book.category}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                onClick={handleCloseModal}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitPriorities}
                className={styles.confirmBtn}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Priorities'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriorityUpdate;