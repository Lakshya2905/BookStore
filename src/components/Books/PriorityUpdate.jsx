import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './PriorityUpdate.module.css';
import { FIND_ALL_BOOK_URL, BOOK_UPDATE_PRIORITY } from '../../constants/apiConstants';

const PriorityUpdate = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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

  const assignInitialPriorities = (bookList) => {
    // Check if priorities need to be assigned (all are 0 or same)
    const priorities = bookList.map(book => book.priority || 0);
    const uniquePriorities = [...new Set(priorities)];
    const needsInitialAssignment = uniquePriorities.length === 1 && uniquePriorities[0] <= 1;
    
    if (needsInitialAssignment) {
      // Sort by book name alphabetically and assign priorities
      const sortedBooks = [...bookList].sort((a, b) => 
        a.bookName.toLowerCase().localeCompare(b.bookName.toLowerCase())
      );
      
      const booksWithPriorities = sortedBooks.map((book, index) => ({
        ...book,
        priority: index + 1
      }));
      
      setIsInitialSetup(true);
      return booksWithPriorities;
    }
    
    // Sort by existing priority
    return bookList.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { user, token } = getUserData();
      
      if (!user || !token) {
        alert('Please login first');
        return;
      }

      const response = await axios.post(`${FIND_ALL_BOOK_URL}`, {
        user,
        token
      });

      if (response.data && response.data.status === 'SUCCESS') {
        // Handle initial priority assignment or sort by existing priority
        const processedBooks = assignInitialPriorities(response.data.payload);
        setBooks(processedBooks);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      alert('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const updatePriorities = async (updatedBooks, showAlert = true) => {
    try {
      const { user, token } = getUserData();
      
      if (!user || !token) {
        alert('Please login first');
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
        if (showAlert) {
          alert('Priorities updated successfully');
        }
        setIsInitialSetup(false);
        setHasChanges(false);
        return true;
      } else {
        if (showAlert) {
          alert('Failed to update priorities');
        }
        return false;
      }
    } catch (error) {
      console.error('Error updating priorities:', error);
      if (showAlert) {
        alert('Failed to update priorities');
      }
      return false;
    }
  };

  const handleSubmitPriorities = async () => {
    setLoading(true);
    const success = await updatePriorities(books, true);
    if (success) {
      alert('Initial priorities have been set successfully!');
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

    // Update priorities on server only if not in initial setup
    if (!isInitialSetup) {
      updatePriorities(booksWithNewPriorities, false);
    }
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
    
    // Update priorities on server only if not in initial setup
    if (!isInitialSetup) {
      updatePriorities(booksWithNewPriorities, false);
    }
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
    
    // Update priorities on server only if not in initial setup
    if (!isInitialSetup) {
      updatePriorities(booksWithNewPriorities, false);
    }
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
        <h2>Book Priority Management</h2>
        <div className={styles.headerButtons}>
          {isInitialSetup && (
            <button 
              onClick={handleSubmitPriorities} 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Setting Priorities...' : 'Submit Initial Priorities'}
            </button>
          )}
          <button onClick={fetchBooks} className={styles.refreshBtn}>
            Refresh
          </button>
        </div>
      </div>

      {isInitialSetup && (
        <div className={styles.initialSetupNotice}>
          <h3>🎯 Initial Priority Setup</h3>
          <p>
            Books have been arranged alphabetically by name. Please drag and drop or use arrow buttons 
            to set your preferred priority order, then click "Submit Initial Priorities" to save.
          </p>
          {hasChanges && (
            <p className={styles.changesIndicator}>
              ✏️ You have unsaved changes. Don't forget to submit!
            </p>
          )}
        </div>
      )}

      {books.length === 0 ? (
        <div className={styles.noBooks}>No books found</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Book Name</th>
                <th>Author</th>
                <th>Category</th>
                <th>Price</th>
                <th>Description</th>
                <th>Actions</th>
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
                  <td className={styles.priority}>{book.priority}</td>
                  <td className={styles.bookName}>{book.bookName}</td>
                  <td>{book.authorName}</td>
                  <td>{book.category}</td>
                  <td className={styles.price}>
                    {book.price ? `$${book.price.toFixed(2)}` : 'N/A'}
                  </td>
                  <td className={styles.description}>
                    {book.description || 'No description'}
                  </td>
                  <td className={styles.actions}>
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className={styles.actionBtn}
                      title="Move Up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === books.length - 1}
                      className={styles.actionBtn}
                      title="Move Down"
                    >
                      ↓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className={styles.instructions}>
        <p>💡 Instructions:</p>
        <ul>
          {isInitialSetup ? (
            <>
              <li>Books are initially sorted alphabetically by name</li>
              <li>Drag and drop rows or use arrow buttons to set priority order</li>
              <li>Click "Submit Initial Priorities" to save your settings</li>
            </>
          ) : (
            <>
              <li>Drag and drop rows to reorder priorities</li>
              <li>Use arrow buttons to move items up/down</li>
              <li>Priorities are automatically updated on the server</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default PriorityUpdate;