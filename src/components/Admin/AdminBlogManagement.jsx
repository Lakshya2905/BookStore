import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BLOG_VIEW_URL, 
  CREATE_BLOG_URL, 
  DELETE_BLOG_URL, 
  EDIT_BLOG_URL 
} from '../../constants/apiConstants';
import styles from './AdminBlogManagement.module.css';

// Toast notification component
const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '✓';
    }
  };

  return (
    <div className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`}>
      <div className={styles.toastIcon}>
        {getToastIcon(toast.type)}
      </div>
      <div className={styles.toastContent}>
        <p className={styles.toastTitle}>{toast.title}</p>
        {toast.message && <p className={styles.toastMessage}>{toast.message}</p>}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className={styles.toastClose}
      >
        ×
      </button>
      <div className={styles.toastProgress}></div>
    </div>
  );
};

// Confirmation dialog component
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.confirmDialog}>
      <div className={styles.confirmDialogContent}>
        <div className={styles.confirmDialogIcon}>⚠</div>
        <h3 className={styles.confirmDialogTitle}>{title}</h3>
        <p className={styles.confirmDialogMessage}>{message}</p>
        <div className={styles.confirmDialogActions}>
          <button
            onClick={onCancel}
            className={`${styles.confirmDialogButton} ${styles.confirmDialogCancel}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`${styles.confirmDialogButton} ${styles.confirmDialogConfirm}`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminBlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [formData, setFormData] = useState({
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    blog: null 
  });

  // Toast management functions
  const addToast = (type, title, message = '', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, type, title, message, duration };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Configure axios defaults
  useEffect(() => {
    // Set default headers if needed
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    
    // Add request interceptor for token
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('token');
          // You might want to redirect to login page here
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on component unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
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

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(BLOG_VIEW_URL);
      const data = response.data;
      
      if (data.status === 'SUCCESS') {
        setBlogs(data.payload || []);
      } else {
        setError(data.message || 'Failed to fetch blogs');
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
      if (err.response) {
        // Server responded with error status
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        // Network error
        setError('Network error. Please check your connection and try again.');
      } else {
        // Other error
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ description: '' });
    setSelectedBlog(null);
    setShowModal(true);
    setError(null);
  };

  const openEditModal = (blog) => {
    setModalMode('edit');
    setFormData({ description: blog.description });
    setSelectedBlog(blog);
    setShowModal(true);
    setError(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ description: '' });
    setSelectedBlog(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    const { user, token } = getUserData();
    if (!user || !token) {
      setError('Authentication required. Please login again.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const requestData = {
        user: user,
        token: token,
        description: formData.description.trim()
      };

      const url = modalMode === 'add' ? CREATE_BLOG_URL : EDIT_BLOG_URL;
      
      if (modalMode === 'edit') {
        requestData.blogId = selectedBlog.id;
      }

      const response = await axios.post(url, requestData);
      const data = response.data;

      if (data.status === 'SUCCESS') {
        closeModal();
        await fetchBlogs(); // Refresh the list
        
        // Success notification
        const message = modalMode === 'add' ? 'Blog created successfully!' : 'Blog updated successfully!';
        addToast('success', message);
      } else {
        setError(data.message || `Failed to ${modalMode} blog`);
      }
    } catch (err) {
      console.error(`Error ${modalMode}ing blog:`, err);
      
      if (err.response) {
        // Server responded with error
        const status = err.response.status;
        const message = err.response.data?.message;
        
        if (status === 401) {
          setError('Unauthorized access. Please check your permissions.');
        } else if (status === 403) {
          setError('Access forbidden. You do not have permission to perform this action.');
        } else if (status === 422) {
          setError(message || 'Invalid data provided. Please check your input.');
        } else {
          setError(message || `Server error occurred. Please try again.`);
        }
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (blog) => {
    setConfirmDialog({ 
      isOpen: true, 
      blog: blog 
    });
  };

  const confirmDelete = async () => {
    const blog = confirmDialog.blog;
    setConfirmDialog({ isOpen: false, blog: null });

    const { user, token } = getUserData();
    if (!user || !token) {
      addToast('error', 'Authentication Error', 'Please login again to continue.');
      return;
    }

    try {
      const requestData = {
        user: user,
        token: token,
        blogId: blog.id
      };

      const response = await axios.post(DELETE_BLOG_URL, requestData);
      const data = response.data;

      if (data.status === 'SUCCESS') {
        await fetchBlogs(); // Refresh the list
        addToast('success', 'Blog Deleted', `Blog #${blog.id} has been successfully deleted.`);
      } else {
        addToast('error', 'Delete Failed', data.message || 'Failed to delete blog');
      }
    } catch (err) {
      console.error('Error deleting blog:', err);
      
      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message;
        
        if (status === 401) {
          addToast('error', 'Unauthorized', 'Please login again to continue.');
        } else if (status === 403) {
          addToast('error', 'Access Denied', 'You do not have permission to delete this blog.');
        } else if (status === 404) {
          addToast('warning', 'Blog Not Found', 'This blog may have already been deleted.');
          fetchBlogs(); // Refresh to sync with server
        } else {
          addToast('error', 'Delete Failed', message || 'Failed to delete blog. Please try again.');
        }
      } else if (err.request) {
        addToast('error', 'Network Error', 'Please check your connection and try again.');
      } else {
        addToast('error', 'Error', 'An unexpected error occurred. Please try again.');
      }
    }
  };

  const cancelDelete = () => {
    setConfirmDialog({ isOpen: false, blog: null });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Blog Management</h1>
            <p className={styles.subtitle}>Manage your blog posts and stories</p>
          </div>
          <button 
            onClick={openAddModal}
            className={styles.addButton}
          >
            + Add New Blog
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {error && !showModal && (
          <div className={styles.errorBanner}>
            <p>{error}</p>
            <button onClick={() => setError(null)} className={styles.closeError}>×</button>
          </div>
        )}

        {blogs.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No Blogs Found</h3>
            <p>Start by creating your first blog post</p>
            <button onClick={openAddModal} className={styles.emptyStateButton}>
              Create First Blog
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {blogs.map((blog) => (
                  <tr key={blog.id} className={styles.tableRow}>
                    <td className={styles.idCell}>#{blog.id}</td>
                    <td className={styles.descriptionCell}>
                      <div className={styles.descriptionPreview}>
                        {truncateText(blog.description)}
                      </div>
                    </td>
                    <td className={styles.actionsCell}>
                      <button 
                        onClick={() => openEditModal(blog)}
                        className={`${styles.actionButton} ${styles.editButton}`}
                        title="Edit blog"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(blog)}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        title="Delete blog"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className={styles.toastContainer}>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              onClose={removeToast}
            />
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Blog"
        message={`Are you sure you want to delete Blog #${confirmDialog.blog?.id}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {modalMode === 'add' ? 'Add New Blog' : 'Edit Blog'}
              </h2>
              <button 
                onClick={closeModal}
                className={styles.closeButton}
                disabled={submitting}
                title="Close modal"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>
                  Blog Content *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={styles.textarea}
                  rows={12}
                  placeholder="Enter your blog content here..."
                  required
                  disabled={submitting}
                />
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={closeModal}
                  className={styles.cancelButton}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={styles.submitButton}
                  disabled={submitting || !formData.description.trim()}
                >
                  {submitting ? (
                    <span className={styles.submittingText}>
                      <span className={styles.submittingSpinner}></span>
                      {modalMode === 'add' ? 'Creating...' : 'Updating...'}
                    </span>
                  ) : (
                    modalMode === 'add' ? 'Create Blog' : 'Update Blog'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogManagement;