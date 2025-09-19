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
    publisher: '',
    isbn: '',
    year: '',
    edition: '',
    mrp: '',
    discount: '',
    price: '', // Read-only calculated field
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
    publisher: false,
    isbn: false,
    year: false,
    edition: false,
    discountOnly: false,
    mrpOnly: false,
    discountMrpBoth: false,
    addTags: false,
    removeTags: false
  });

  const BOOK_TAGS = ['NEW_RELEASE', 'BESTSELLER', 'TOP_RATED', 'SALE'];
  const SHOW_STATUS_OPTIONS = ['HIDE', 'SHOW'];

  // Function to calculate discount price
  const getDiscountPrice = (mrp, discountInPercent) => {
    const mrpValue = parseFloat(mrp) || 0;
    const discountValue = parseFloat(discountInPercent) || 0;
    const discountedPrice = mrpValue - (mrpValue * discountValue / 100);
    return Math.round(discountedPrice * 100.0) / 100.0;
  };

  // Update price when MRP or discount changes
  useEffect(() => {
    if (fieldsToUpdate.discountOnly || fieldsToUpdate.mrpOnly || fieldsToUpdate.discountMrpBoth) {
      const currentMrp = fieldsToUpdate.mrpOnly || fieldsToUpdate.discountMrpBoth ? 
        formData.mrp : selectedBook?.mrp || 0;
      const currentDiscount = fieldsToUpdate.discountOnly || fieldsToUpdate.discountMrpBoth ? 
        formData.discount : selectedBook?.discount || 0;
      
      const calculatedPrice = getDiscountPrice(currentMrp, currentDiscount);
      setFormData(prev => ({
        ...prev,
        price: calculatedPrice
      }));
    }
  }, [formData.mrp, formData.discount, fieldsToUpdate.discountOnly, fieldsToUpdate.mrpOnly, fieldsToUpdate.discountMrpBoth, selectedBook]);

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
    const calculatedPrice = getDiscountPrice(book.mrp || 0, book.discount || 0);
    setFormData({
      bookName: book.bookName || '',
      description: book.description || '',
      authorName: book.authorName || '',
      categoryId: book.categoryId || '',
      showStatus: book.showStatus || 'SHOW',
      publisher: book.publisher || '',
      isbn: book.isbn || '',
      year: book.year || '',
      edition: book.edition || '',
      mrp: book.mrp || '',
      discount: book.discount || '',
      price: calculatedPrice,
      addTags: [],
      removeTags: []
    });
    setFieldsToUpdate({
      bookName: false,
      description: false,
      authorName: false,
      category: false,
      showStatus: false,
      publisher: false,
      isbn: false,
      year: false,
      edition: false,
      discountOnly: false,
      mrpOnly: false,
      discountMrpBoth: false,
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
    // Handle pricing options (only one can be selected)
    if (['discountOnly', 'mrpOnly', 'discountMrpBoth'].includes(field)) {
      setFieldsToUpdate(prev => ({
        ...prev,
        discountOnly: field === 'discountOnly',
        mrpOnly: field === 'mrpOnly',
        discountMrpBoth: field === 'discountMrpBoth'
      }));
    } else {
      setFieldsToUpdate(prev => ({
        ...prev,
        [field]: !prev[field]
      }));
    }
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
        showStatus: formData.showStatus,
        publisher: formData.publisher,
        isbn: formData.isbn,
        year: formData.year,
        edition: formData.edition,
        mrp: parseFloat(formData.mrp) || null,
        discount: parseFloat(formData.discount) || null
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
              <th>MRP</th>
              <th>Discount</th>
              <th>Price</th>
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
                <td>₹{book.mrp || 0}</td>
                <td>{book.discount || 0}%</td>
                <td>₹{book.price}</td>
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
              <div className={styles.formContainer}>
                {/* Left Column - Basic Information */}
                <div className={styles.leftColumn}>
                  <div className={styles.sectionHeader}>
                    <h3>Basic Information</h3>
                  </div>

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
                      placeholder="Enter book name"
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
                      placeholder="Enter author name"
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
                      placeholder="Enter book description (optional)"
                      rows="4"
                    />
                  </div>

                  {/* Category and Publisher */}
                  <div className={styles.rowFields}>
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
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.categoryId} value={category.categoryId}>
                            {category.categoryName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={fieldsToUpdate.publisher}
                          onChange={() => handleCheckboxChange('publisher')}
                        />
                        Update Publisher
                      </label>
                      <input
                        type="text"
                        value={formData.publisher}
                        onChange={(e) => handleInputChange('publisher', e.target.value)}
                        disabled={!fieldsToUpdate.publisher}
                        className={styles.input}
                        placeholder="Enter publisher name"
                      />
                    </div>
                  </div>

                  {/* Publication Details */}
                  <div className={styles.sectionHeader}>
                    <h3>Publication Details</h3>
                  </div>

                  <div className={styles.rowFields}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={fieldsToUpdate.isbn}
                          onChange={() => handleCheckboxChange('isbn')}
                        />
                        Update ISBN
                      </label>
                      <input
                        type="text"
                        value={formData.isbn}
                        onChange={(e) => handleInputChange('isbn', e.target.value)}
                        disabled={!fieldsToUpdate.isbn}
                        className={styles.input}
                        placeholder="ISBN"
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={fieldsToUpdate.year}
                          onChange={() => handleCheckboxChange('year')}
                        />
                        Update Year
                      </label>
                      <input
                        type="text"
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        disabled={!fieldsToUpdate.year}
                        className={styles.input}
                        placeholder="Year"
                      />
                    </div>
                  </div>

                  <div className={styles.rowFields}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={fieldsToUpdate.edition}
                          onChange={() => handleCheckboxChange('edition')}
                        />
                        Update Edition
                      </label>
                      <input
                        type="text"
                        value={formData.edition}
                        onChange={(e) => handleInputChange('edition', e.target.value)}
                        disabled={!fieldsToUpdate.edition}
                        className={styles.input}
                        placeholder="Edition"
                      />
                    </div>

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
                  </div>

                  {/* Pricing Section */}
                  <div className={styles.sectionHeader}>
                    <h3>Pricing Options (Select only one)</h3>
                  </div>

                  {/* Discount Only */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={fieldsToUpdate.discountOnly}
                        onChange={() => handleCheckboxChange('discountOnly')}
                      />
                      Update Discount Only
                    </label>
                    <div className={styles.pricingInputs}>
                      <div className={styles.pricingField}>
                        <label>MRP (Current: ₹{selectedBook?.mrp || 0})</label>
                        <input
                          type="number"
                          value={selectedBook?.mrp || 0}
                          disabled
                          className={`${styles.input} ${styles.disabledInput}`}
                        />
                      </div>
                      <div className={styles.pricingField}>
                        <label>Discount (%)</label>
                        <input
                          type="number"
                          value={formData.discount}
                          onChange={(e) => handleInputChange('discount', e.target.value)}
                          disabled={!fieldsToUpdate.discountOnly}
                          className={styles.input}
                          placeholder="Discount %"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* MRP Only */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={fieldsToUpdate.mrpOnly}
                        onChange={() => handleCheckboxChange('mrpOnly')}
                      />
                      Update MRP Only
                    </label>
                    <div className={styles.pricingInputs}>
                      <div className={styles.pricingField}>
                        <label>MRP (₹)</label>
                        <input
                          type="number"
                          value={formData.mrp}
                          onChange={(e) => handleInputChange('mrp', e.target.value)}
                          disabled={!fieldsToUpdate.mrpOnly}
                          className={styles.input}
                          placeholder="MRP"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className={styles.pricingField}>
                        <label>Discount (Current: {selectedBook?.discount || 0}%)</label>
                        <input
                          type="number"
                          value={selectedBook?.discount || 0}
                          disabled
                          className={`${styles.input} ${styles.disabledInput}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Both MRP and Discount */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={fieldsToUpdate.discountMrpBoth}
                        onChange={() => handleCheckboxChange('discountMrpBoth')}
                      />
                      Update Both MRP and Discount
                    </label>
                    <div className={styles.pricingInputs}>
                      <div className={styles.pricingField}>
                        <label>MRP (₹)</label>
                        <input
                          type="number"
                          value={formData.mrp}
                          onChange={(e) => handleInputChange('mrp', e.target.value)}
                          disabled={!fieldsToUpdate.discountMrpBoth}
                          className={styles.input}
                          placeholder="MRP"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className={styles.pricingField}>
                        <label>Discount (%)</label>
                        <input
                          type="number"
                          value={formData.discount}
                          onChange={(e) => handleInputChange('discount', e.target.value)}
                          disabled={!fieldsToUpdate.discountMrpBoth}
                          className={styles.input}
                          placeholder="Discount %"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Final Price Display */}
                  <div className={styles.finalPrice}>
                    <label>Final Price (Calculated)</label>
                    <input
                      type="number"
                      value={formData.price}
                      disabled
                      className={`${styles.input} ${styles.disabledInput} ${styles.finalPriceInput}`}
                      placeholder="Final Price"
                    />
                  </div>
                </div>

                {/* Right Column - Book Tags */}
                <div className={styles.rightColumn}>
                  <div className={styles.sectionHeader}>
                    <h3>Book Tags</h3>
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
                    <div className={styles.tagGrid}>
                      {getAvailableTagsForAdding().map((tag) => (
                        <label key={tag} className={styles.tagCheckboxLabel}>
                          <input
                            type="checkbox"
                            disabled={!fieldsToUpdate.addTags || !canAddTag(tag)}
                            onChange={(e) => handleTagChange(tag, 'addTags', e.target.checked)}
                          />
                          {tag.replace('_', ' ')}
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
                    <div className={styles.tagGrid}>
                      {getAvailableTagsForRemoving().map((tag) => (
                        <label key={tag} className={styles.tagCheckboxLabel}>
                          <input
                            type="checkbox"
                            disabled={!fieldsToUpdate.removeTags || !canRemoveTag(tag)}
                            onChange={(e) => handleTagChange(tag, 'removeTags', e.target.checked)}
                          />
                          {tag.replace('_', ' ')}
                        </label>
                      ))}
                      {getAvailableTagsForRemoving().length === 0 && (
                        <span className={styles.noTagsMessage}>No tags available to remove from this book</span>
                      )}
                    </div>
                  </div>
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