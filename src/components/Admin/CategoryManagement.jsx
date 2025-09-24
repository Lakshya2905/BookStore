import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './CategoryManagement.module.css';
import { CATRGORY_VIEW_URL,
         CATRGORY_UPDATE_URL,
         CATRGORY_DELETE_URL,
         CATEGORY_IMAGE_FETCH_URL,
         CATRGORY_IMAGE_UPDATE_URL } from '../../constants/apiConstants';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  
  // Missing state variables that were causing the errors
  const [loadingImages, setLoadingImages] = useState({});
  const [imageErrors, setImageErrors] = useState({});

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

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${CATRGORY_VIEW_URL}`);
      if (response.data && response.data.status==='SUCCESS') {
        setCategories(response.data.payload);    
        await prefetchCategoryImages(response.data.payload);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showMessage('error', 'Failed to fetch categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    const { user, token } = getUserData();
    if (!user || !token) {
      showMessage('error', 'Authentication required. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${CATRGORY_DELETE_URL}`, {
        user,
        token,
        categoryId
      });

      if (response.data.status === 'SUCCESS') {
        showMessage('success', response.data.message);
        fetchCategories();
      } else {
        showMessage('error', response.data.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      if (error.response && error.response.status === 401) {
        showMessage('error', 'Unauthorized access. Please check your permissions.');
      } else {
        showMessage('error', 'Failed to delete category. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category.categoryId);
    setEditCategoryName(category.categoryName);
  };

  const handleUpdateCategory = async () => {
    if (!editCategoryName.trim()) {
      showMessage('error', 'Category name is required and cannot be empty');
      return;
    }

    if (editCategoryName.length < 2) {
      showMessage('error', 'Category name must be at least 2 characters long');
      return;
    }

    const { user, token } = getUserData();
    if (!user || !token) {
      showMessage('error', 'Authentication required. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${CATRGORY_UPDATE_URL}`, {
        user,
        token,
        categoryId: editingCategory,
        categoryName: editCategoryName.trim()
      });

      if (response.data.status === 'SUCCESS') {
        showMessage('success', response.data.message);
        setEditingCategory(null);
        setEditCategoryName('');
        fetchCategories();
      } else {
        showMessage('error', response.data.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      if (error.response && error.response.status === 401) {
        showMessage('error', 'Unauthorized access. Please check your permissions.');
      } else {
        showMessage('error', 'Failed to update category. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditCategoryName('');
  };

  const handleEditImage = (categoryId) => {
    setEditingImage(categoryId);
    setSelectedFile(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        showMessage('error', 'Please select a valid image file (JPG, PNG, GIF, etc.)');
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'Image file size should be less than 5MB');
        return;
      }

      setSelectedFile(file);
    }
  };

const handleUpdateImage = async () => {
  if (!selectedFile) {
    showMessage('error', 'Please select an image file');
    return;
  }

  const { user, token } = getUserData();
  if (!user || !token) {
    showMessage('error', 'Authentication required. Please login again.');
    return;
  }

  const formData = new FormData();
  
  // Create the request body object - same format as AddCategory
  const requestBody = {
    user: user,
    token: token,
    categoryId: editingImage
  };
  
  // Add the request body as a Blob with correct content type - same as AddCategory
  formData.append('requestBody', new Blob([JSON.stringify(requestBody)], {
    type: 'application/json'
  }));
  
  // Add file - same as AddCategory
  formData.append('file', selectedFile);

  setLoading(true);
  try {
    const response = await axios.post(`${CATRGORY_IMAGE_UPDATE_URL}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.status === 'SUCCESS') {
      showMessage('success', response.data.message);
      setEditingImage(null);
      setSelectedFile(null);
      
      // Refresh the specific image after successful update
      try {
        const imageUrl = await getCategoryImageUrl(editingImage);
        setImageUrls(prev => ({
          ...prev,
          [editingImage]: imageUrl
        }));
        setImageErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[editingImage];
          return newErrors;
        });
      } catch (error) {
        console.error('Error refreshing updated image:', error);
      }
      
      // Also refresh categories data
      setTimeout(() => {
        fetchCategories();
      }, 2000);
    } else {
      showMessage('error', response.data.message || 'Failed to update category image');
    }
  } catch (error) {
    console.error('Error updating category image:', error);
    if (error.response && error.response.status === 401) {
      showMessage('error', 'Unauthorized access. Please check your permissions.');
    } else {
      showMessage('error', 'Failed to update category image. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};


  const handleCancelImageEdit = () => {
    setEditingImage(null);
    setSelectedFile(null);
  };

  // Prefetch image using axios and return blob URL
  const getCategoryImageUrl = async (categoryId) => {
    try {
      const response = await axios.get(`${CATEGORY_IMAGE_FETCH_URL}?categoryId=${categoryId}`, {
        responseType: 'blob',
        timeout: 10000, // 10 second timeout
      });
      
      // Create blob URL from response
      const imageBlob = new Blob([response.data], { type: response.headers['content-type'] || 'image/jpeg' });
      return URL.createObjectURL(imageBlob);
    } catch (error) {
      console.error(`Error fetching image for category ${categoryId}:`, error);
      throw error;
    }
  };

  // Prefetch all category images
  const prefetchCategoryImages = async (categories) => {
    const newImageUrls = {};
    const newLoadingImages = {};
    const newImageErrors = {};

    // Initialize loading states
    categories.forEach(category => {
      newLoadingImages[category.categoryId] = true;
    });
    setLoadingImages(newLoadingImages);

    // Fetch images concurrently
    const imagePromises = categories.map(async (category) => {
      try {
        const imageUrl = await getCategoryImageUrl(category.categoryId);
        newImageUrls[category.categoryId] = imageUrl;
        newLoadingImages[category.categoryId] = false;
      } catch (error) {
        console.error(`Failed to load image for category ${category.categoryId}:`, error);
        newImageErrors[category.categoryId] = true;
        newLoadingImages[category.categoryId] = false;
      }
    });

    // Wait for all images to load (or fail)
    await Promise.allSettled(imagePromises);
    
    setImageUrls(newImageUrls);
    setLoadingImages(newLoadingImages);
    setImageErrors(newImageErrors);
  };

  // Component for rendering category image
  const CategoryImage = ({ category }) => {
    const hasError = imageErrors[category.categoryId];
    const isLoading = loadingImages[category.categoryId];
    const imageUrl = imageUrls[category.categoryId];
    
    if (isLoading) {
      return (
        <div className={styles.imageLoadingPlaceholder}>
          <div className={styles.imageSpinner}></div>
        </div>
      );
    }
    
    if (hasError || !imageUrl) {
      return (
        <div className={styles.noImagePlaceholder}>
          <div className={styles.noImageIcon}>📷</div>
          <span className={styles.noImageText}>No Image</span>
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt={category.categoryName}
        className={styles.categoryImage}
        onError={() => {
          setImageErrors(prev => ({
            ...prev,
            [category.categoryId]: true
          }));
        }}
      />
    );
  };

  // Cleanup blob URLs on component unmount
  useEffect(() => {
    return () => {
      // Cleanup all blob URLs to prevent memory leaks
      Object.values(imageUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrls]);

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Category Management</h1>
        <button 
          onClick={fetchCategories} 
          className={styles.refreshBtn}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          <span className={styles.messageIcon}>
            {message.type === 'success' ? '✓' : '⚠'}
          </span>
          {message.text}
          <button 
            className={styles.closeMessage}
            onClick={() => setMessage({ type: '', text: '' })}
          >
            ×
          </button>
        </div>
      )}

      {loading && (
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <span>Loading...</span>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Category Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.categoryId} className={styles.tableRow}>
                <td className={styles.idCell}>{category.categoryId}</td>
                <td className={styles.imageCell}>
                  <div className={styles.imageContainer}>
                    <CategoryImage category={category} />
                  </div>
                </td>
                <td className={styles.nameCell}>
                  {editingCategory === category.categoryId ? (
                    <div className={styles.editForm}>
                      <input
                        type="text"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        className={styles.editInput}
                        placeholder="Category name"
                        maxLength="50"
                      />
                      <div className={styles.editActions}>
                        <button 
                          onClick={handleUpdateCategory}
                          className={styles.saveBtn}
                          disabled={loading || !editCategoryName.trim()}
                        >
                          Save
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className={styles.cancelBtn}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className={styles.categoryName}>{category.categoryName}</span>
                  )}
                </td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionButtons}>
                    {editingCategory === category.categoryId ? null : (
                      <>
                        <button
                          onClick={() => handleEditCategory(category)}
                          className={`${styles.actionBtn} ${styles.editBtn}`}
                          disabled={loading}
                          title="Edit category name"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleEditImage(category.categoryId)}
                          className={`${styles.actionBtn} ${styles.imageBtn}`}
                          disabled={loading}
                          title="Edit category image"
                        >
                          Edit Image
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.categoryId)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          disabled={loading}
                          title="Delete category"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingImage && (
        <div className={styles.modal} onClick={(e) => e.target === e.currentTarget && handleCancelImageEdit()}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Update Category Image</h3>
              <button 
                className={styles.closeModal}
                onClick={handleCancelImageEdit}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fileInputContainer}>
                <label className={styles.fileInputLabel}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                  <span className={styles.fileInputText}>
                    {selectedFile ? selectedFile.name : 'Choose image file'}
                  </span>
                </label>
              </div>
              {selectedFile && (
                <div className={styles.preview}>
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className={styles.previewImage}
                  />
                  <p className={styles.previewInfo}>
                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={handleUpdateImage}
                className={`${styles.actionBtn} ${styles.saveBtn}`}
                disabled={loading || !selectedFile}
              >
                {loading ? 'Uploading...' : 'Update Image'}
              </button>
              <button
                onClick={handleCancelImageEdit}
                className={`${styles.actionBtn} ${styles.cancelBtn}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {categories.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📁</div>
          <h3>No Categories Found</h3>
          <p>There are no categories to display. Try refreshing or check your connection.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;