import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './AddBookPage.module.css';
import { BOOK_ADD_URL,BOOK_CATEGORIES_FETCH_URL } from '../../constants/apiConstants';

const AddBookPage = () => {
  const [formData, setFormData] = useState({
    bookName: '',
    description: '',
    category: '',
    authorName: '',
    price: '',
    bookTags: [],
    categoryId: ''
  });
  
  const [coverImage, setCoverImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [imagePreview, setImagePreview] = useState(null);

  const bookTagsOptions = [
    { value: 'NEW_RELEASE', label: 'New Release' },
    { value: 'BESTSELLER', label: 'Bestseller' },
    { value: 'TOP_RATED', label: 'Top Rated' },
    { value: 'SALE', label: 'Sale' }
  ];

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

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BOOK_CATEGORIES_FETCH_URL}`);
      if (response.data && response.data.status=='SUCCESS') {
        setCategories(response.data.payload);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setMessage({ text: 'Failed to load categories', type: 'error' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'categoryId' && { 
        category: categories.find(cat => cat.categoryId === parseInt(value))?.categoryName || '' 
      })
    }));
  };

  const handleTagsChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      bookTags: checked 
        ? [...prev.bookTags, value]
        : prev.bookTags.filter(tag => tag !== value)
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ text: 'Please select a valid image file (JPG, JPEG, or PNG)', type: 'error' });
        e.target.value = '';
        setCoverImage(null);
        setImagePreview(null);
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setMessage({ text: 'File size must be less than 5MB', type: 'error' });
        e.target.value = '';
        setCoverImage(null);
        setImagePreview(null);
        return;
      }

      setCoverImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setMessage({ text: '', type: '' });
    }
  };

  const validateForm = () => {
    if (!formData.bookName.trim()) {
      setMessage({ text: 'Book name is required', type: 'error' });
      return false;
    }
    if (!formData.authorName.trim()) {
      setMessage({ text: 'Author name is required', type: 'error' });
      return false;
    }
    if (!formData.description.trim()) {
      setMessage({ text: 'Description is required', type: 'error' });
      return false;
    }
    if (!formData.categoryId) {
      setMessage({ text: 'Please select a category', type: 'error' });
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setMessage({ text: 'Please enter a valid price', type: 'error' });
      return false;
    }
    if (!coverImage) {
      setMessage({ text: 'Please select a cover image', type: 'error' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const { user, token } = getUserData();
    
    if (!user || !token) {
      setMessage({ text: 'User authentication required', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const bookDto = {
        ...formData,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId)
      };

      const requestBody = {
        bookDto,
        user,
        token
      };

      const formDataToSend = new FormData();
      formDataToSend.append('requestBody', new Blob([JSON.stringify(requestBody)], {
        type: 'application/json'
      }));
      formDataToSend.append('file', coverImage);

      const response = await axios.post(`${BOOK_ADD_URL}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'SUCCESS') {
        setMessage({ text: 'Book added successfully!', type: 'success' });
        // Reset form
        setFormData({
          bookName: '',
          description: '',
          category: '',
          authorName: '',
          price: '',
          bookTags: [],
          categoryId: ''
        });
        setCoverImage(null);
        setImagePreview(null);
        document.getElementById('coverImage').value = '';
      } else {
        setMessage({ text: response.data.message || 'Failed to add book', type: 'error' });
      }
    } catch (error) {
      console.error('Error adding book:', error);
      setMessage({ 
        text: error.response?.data?.message || 'An error occurred while adding the book', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Add New Book</h1>
        
        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="bookName" className={styles.label}>
              Book Name *
            </label>
            <input
              type="text"
              id="bookName"
              name="bookName"
              value={formData.bookName}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter book name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="authorName" className={styles.label}>
              Author Name *
            </label>
            <input
              type="text"
              id="authorName"
              name="authorName"
              value={formData.authorName}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter author name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={styles.textarea}
              placeholder="Enter book description"
              rows="4"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="categoryId" className={styles.label}>
              Category *
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className={styles.select}
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="price" className={styles.label}>
              Price *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Book Tags</label>
            <div className={styles.checkboxGroup}>
              {bookTagsOptions.map(tag => (
                <label key={tag.value} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    value={tag.value}
                    checked={formData.bookTags.includes(tag.value)}
                    onChange={handleTagsChange}
                    className={styles.checkbox}
                  />
                  {tag.label}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="coverImage" className={styles.label}>
              Cover Image * (JPG, JPEG, PNG only)
            </label>
            <input
              type="file"
              id="coverImage"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              className={styles.fileInput}
              required
            />
            {imagePreview && (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Cover preview" className={styles.previewImage} />
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Adding Book...' : 'Add Book'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddBookPage;