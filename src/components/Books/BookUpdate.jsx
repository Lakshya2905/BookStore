import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './BookUpdate.module.css';
import { FIND_ALL_BOOK_URL,BOOK_UPDATE,BOOK_CATEGORIES_FETCH_URL } from '../../constants/apiConstants';

const BookUpdate = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    bookName: '',
    description: '',
    authorName: '',
    categoryId: '',
    showStatus: 'SHOW',
    addTags: [],
    removeTags: []
  });
  
  // Checkboxes for fields to update
  const [fieldsToUpdate, setFieldsToUpdate] = useState({
    bookName: false,
    description: false,
    authorName: false,
    category: false,
    showStatus: false,
    addTags: false,
    removeTags: false
  });

  const BOOK_TAGS = ['NEW_RELEASE', 'BESTSELLER', 'TOP_RATED', 'SALE'];
  const SHOW_STATUS_OPTIONS = ['HIDE', 'SHOW'];

  // Function to get available tags for adding (not already on the book)
  const getAvailableTagsForAdding = () => {
    if (!selectedBook || !selectedBook.bookTags) {
      return BOOK_TAGS;
    }
    return BOOK_TAGS.filter(tag => !selectedBook.bookTags.includes(tag));
  };

  // Function to get available tags for removing (already on the book)
  const getAvailableTagsForRemoving = () => {
    if (!selectedBook || !selectedBook.bookTags) {
      return [];
    }
    return BOOK_TAGS.filter(tag => selectedBook.bookTags.includes(tag));
  };

  // Function to check if a tag can be added
  const canAddTag = (tag) => {
    return getAvailableTagsForAdding().includes(tag);
  };

  // Function to check if a tag can be removed
  const canRemoveTag = (tag) => {
    return getAvailableTagsForRemoving().includes(tag);
  };
 
  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

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

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { user, token } = getUserData();
      const response = await axios.post(`${FIND_ALL_BOOK_URL}`, { user, token });
      
      if (response.data && response.data.status === 'SUCCESS') {
        setBooks(response.data.payload || []);
      } else {
        setMessage({ text: 'Failed to load books', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setMessage({ text: 'Failed to load books', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BOOK_CATEGORIES_FETCH_URL}`);
      if (response.data && response.data.status === 'SUCCESS') {
        setCategories(response.data.payload || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setMessage({ text: 'Failed to load categories', type: 'error' });
    }
  };

  const openModal = (book) => {
    setSelectedBook(book);
    setFormData({
      bookName: book.bookName || '',
      description: book.description || '',
      authorName: book.authorName || '',
      categoryId: book.categoryId || '',
      showStatus: book.showStatus || 'SHOW',
      addTags: [],
      removeTags: []
    });
    setFieldsToUpdate({
      bookName: false,
      description: false,
      authorName: false,
      category: false,
      showStatus: false,
      addTags: false,
      removeTags: false
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBook(null);
    setMessage({ text: '', type: '' });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field) => {
    setFieldsToUpdate(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleTagChange = (tag, type, isChecked) => {
    const tagEnum = tag.toUpperCase();
    setFormData(prev => ({
      ...prev,
      [type]: isChecked 
        ? [...prev[type], tagEnum]
        : prev[type].filter(t => t !== tagEnum)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user, token } = getUserData();
      
      // Get only the fields that are checked for update
      const updatedValues = Object.keys(fieldsToUpdate).filter(key => fieldsToUpdate[key]);
      
      if (updatedValues.length === 0) {
        setMessage({ text: 'Please select at least one field to update', type: 'error' });
        setLoading(false);
        return;
      }

      const bookDto = {
        bookId: selectedBook.bookId,
        bookName: formData.bookName,
        description: formData.description,
        authorName: formData.authorName,
        categoryId: parseInt(formData.categoryId) || selectedBook.categoryId,
        showStatus: formData.showStatus
      };

      const requestData = {
        user,
        token,
        bookDto,
        updatedValues,
        addTags: formData.addTags,
        removeTags: formData.removeTags
      };

      const response = await axios.post(`${BOOK_UPDATE}`, requestData);
      
      if (response.data && response.data.status === 'SUCCESS') {
        setMessage({ text: 'Book updated successfully!', type: 'success' });
        fetchBooks(); // Refresh the books list
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        setMessage({ text: response.data?.message || 'Failed to update book', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating book:', error);
      setMessage({ text: 'Error updating book', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Book Management</h1>
      
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {loading && <div className={styles.loading}>Loading...</div>}

      {/* Books Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Book Name</th>
              <th>Author</th>
              <th>Category</th>
              <th>Status</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.bookId}>
                <td>{book.bookId}</td>
                <td>{book.bookName}</td>
                <td>{book.authorName}</td>
                <td>{book.category}</td>
                <td>
                  <span className={`${styles.status} ${styles[book.showStatus?.toLowerCase()]}`}>
                    {book.showStatus}
                  </span>
                </td>
                <td>
                  <div className={styles.tags}>
                    {book.bookTags?.map((tag, index) => (
                      <span key={index} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <button 
                    className={styles.editBtn}
                    onClick={() => openModal(book)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Update Book</h2>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Book Name */}
              <div className={styles.fieldGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={fieldsToUpdate.bookName}
                    onChange={() => handleCheckboxChange('bookName')}
                  />
                  Update Book Name
                </label>
                <input
                  type="text"
                  value={formData.bookName}
                  onChange={(e) => handleInputChange('bookName', e.target.value)}
                  disabled={!fieldsToUpdate.bookName}
                  className={styles.input}
                  placeholder="Book Name"
                />
              </div>

              {/* Description */}
              <div className={styles.fieldGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={fieldsToUpdate.description}
                    onChange={() => handleCheckboxChange('description')}
                  />
                  Update Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!fieldsToUpdate.description}
                  className={styles.textarea}
                  placeholder="Description"
                  rows="3"
                />
              </div>

              {/* Author Name */}
              <div className={styles.fieldGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={fieldsToUpdate.authorName}
                    onChange={() => handleCheckboxChange('authorName')}
                  />
                  Update Author Name
                </label>
                <input
                  type="text"
                  value={formData.authorName}
                  onChange={(e) => handleInputChange('authorName', e.target.value)}
                  disabled={!fieldsToUpdate.authorName}
                  className={styles.input}
                  placeholder="Author Name"
                />
              </div>

              {/* Category */}
              <div className={styles.fieldGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={fieldsToUpdate.category}
                    onChange={() => handleCheckboxChange('category')}
                  />
                  Update Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  disabled={!fieldsToUpdate.category}
                  className={styles.select}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show Status */}
              <div className={styles.fieldGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={fieldsToUpdate.showStatus}
                    onChange={() => handleCheckboxChange('showStatus')}
                  />
                  Update Show Status
                </label>
                <select
                  value={formData.showStatus}
                  onChange={(e) => handleInputChange('showStatus', e.target.value)}
                  disabled={!fieldsToUpdate.showStatus}
                  className={styles.select}
                >
                  {SHOW_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Tags */}
              <div className={styles.fieldGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={fieldsToUpdate.addTags}
                    onChange={() => handleCheckboxChange('addTags')}
                  />
                  Add Tags
                </label>
                <div className={styles.tagCheckboxes}>
                  {getAvailableTagsForAdding().map((tag) => (
                    <label key={tag} className={styles.tagCheckboxLabel}>
                      <input
                        type="checkbox"
                        disabled={!fieldsToUpdate.addTags || !canAddTag(tag)}
                        onChange={(e) => handleTagChange(tag, 'addTags', e.target.checked)}
                      />
                      {tag}
                    </label>
                  ))}
                  {getAvailableTagsForAdding().length === 0 && (
                    <span className={styles.noTagsMessage}>All tags are already added to this book</span>
                  )}
                </div>
              </div>

              {/* Remove Tags */}
              <div className={styles.fieldGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={fieldsToUpdate.removeTags}
                    onChange={() => handleCheckboxChange('removeTags')}
                  />
                  Remove Tags
                </label>
                <div className={styles.tagCheckboxes}>
                  {getAvailableTagsForRemoving().map((tag) => (
                    <label key={tag} className={styles.tagCheckboxLabel}>
                      <input
                        type="checkbox"
                        disabled={!fieldsToUpdate.removeTags || !canRemoveTag(tag)}
                        onChange={(e) => handleTagChange(tag, 'removeTags', e.target.checked)}
                      />
                      {tag}
                    </label>
                  ))}
                  {getAvailableTagsForRemoving().length === 0 && (
                    <span className={styles.noTagsMessage}>No tags available to remove from this book</span>
                  )}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.updateBtn}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookUpdate;