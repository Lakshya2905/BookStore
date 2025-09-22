import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BLOG_VIEW_URL, 
  CREATE_BLOG_URL, 
  DELETE_BLOG_URL, 
  EDIT_BLOG_URL 
} from '../../constants/apiConstants';
import styles from './AdminBlogManagement.module.css';

// Icons as components
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);

const AddIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
  </svg>
);

// Enhanced Toast notification component
const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return <CheckIcon />;
      case 'error': return <XIcon />;
      case 'warning': return <WarningIcon />;
      case 'info': return <InfoIcon />;
      default: return <CheckIcon />;
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
        <XIcon />
      </button>
      <div className={styles.toastProgress}></div>
    </div>
  );
};

// Enhanced Confirmation dialog component
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.confirmDialog}>
      <div className={styles.confirmDialogContent}>
        <div className={styles.confirmDialogIcon}>
          <DeleteIcon />
        </div>
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
            <DeleteIcon />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Loading component
const LoadingSpinner = ({ size = 'default', text = 'Loading...' }) => (
  <div className={`${styles.loadingWrapper} ${styles[`loading${size.charAt(0).toUpperCase() + size.slice(1)}`]}`}>
    <div className={styles.spinner}></div>
    <p className={styles.loadingText}>{text}</p>
  </div>
);

// Stats card component
const StatsCard = ({ title, value, icon, color = 'blue' }) => (
  <div className={`${styles.statsCard} ${styles[`statsCard${color.charAt(0).toUpperCase() + color.slice(1)}`]}`}>
    <div className={styles.statsIcon}>
      {icon}
    </div>
    <div className={styles.statsContent}>
      <p className={styles.statsValue}>{value}</p>
      <p className={styles.statsTitle}>{title}</p>
    </div>
  </div>
);

const AdminBlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [formData, setFormData] = useState({
    blogHeading: '',
    description: '',
    date: ''
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

  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Helper function to format date for display
  const formatDateForDisplay = (date) => {
    if (!date) return 'No date';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
    setFormData({ 
      blogHeading: '',
      description: '',
      date: formatDateForInput(new Date()) // Default to today's date
    });
    setSelectedBlog(null);
    setShowModal(true);
    setError(null);
  };

  const openEditModal = (blog) => {
    setModalMode('edit');
    setFormData({ 
      blogHeading: blog.blogHeading || '',
      description: blog.description || '',
      date: formatDateForInput(blog.date)
    });
    setSelectedBlog(blog);
    setShowModal(true);
    setError(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ 
      blogHeading: '',
      description: '',
      date: ''
    });
    setSelectedBlog(null);
    setError(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.blogHeading.trim()) {
      setError('Blog heading is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.date) {
      setError('Date is required');
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
      setError('Authentication required. Please login again.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const requestData = {
        user: user,
        token: token,
        blogHeading: formData.blogHeading.trim(),
        description: formData.description.trim(),
        date: new Date(formData.date)
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
        <LoadingSpinner text="Loading blog management..." />
      </div>
    );
  }

  const totalBlogs = blogs.length;
  const recentBlogs = blogs.filter(blog => {
    const blogDate = new Date(blog.date);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    return blogDate >= lastWeek;
  }).length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <div className={styles.titleSection}>
              <h1 className={styles.title}>
                <span className={styles.titleIcon}>📝</span>
                Blog Management
              </h1>
              <p className={styles.subtitle}>Create, manage and publish your stories</p>
            </div>
            <div className={styles.headerStats}>
              <StatsCard 
                title="Total Blogs" 
                value={totalBlogs} 
                icon={<InfoIcon />}
                color="blue" 
              />
              <StatsCard 
                title="Recent Posts" 
                value={recentBlogs} 
                icon={<CalendarIcon />}
                color="green" 
              />
            </div>
          </div>
          <button 
            onClick={openAddModal}
            className={styles.addButton}
          >
            <AddIcon />
            Create New Blog
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {error && !showModal && (
          <div className={styles.errorBanner}>
            <div className={styles.errorContent}>
              <WarningIcon />
              <p>{error}</p>
            </div>
            <button onClick={() => setError(null)} className={styles.closeError}>
              <XIcon />
            </button>
          </div>
        )}

        {blogs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📝</div>
            <h3>No Blogs Found</h3>
            <p>Start creating engaging content for your audience</p>
            <button onClick={openAddModal} className={styles.emptyStateButton}>
              <AddIcon />
              Create Your First Blog
            </button>
          </div>
        ) : (
          <div className={styles.tableSection}>
            <div className={styles.tableSectionHeader}>
              <h2 className={styles.sectionTitle}>All Blog Posts</h2>
              <p className={styles.sectionSubtitle}>Manage and organize your published content</p>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Content Preview</th>
                    <th>Publication Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {blogs.map((blog) => (
                    <tr key={blog.id} className={styles.tableRow}>
                      <td className={styles.idCell}>
                        <span className={styles.blogId}>#{blog.id}</span>
                      </td>
                      <td className={styles.headingCell}>
                        <div className={styles.headingPreview}>
                          <h4 className={styles.blogTitle}>{blogs.heading}</h4>
                        </div>
                      </td>
                      <td className={styles.descriptionCell}>
                        <div className={styles.descriptionPreview}>
                          {truncateText(blog.description)}
                        </div>
                      </td>
                      <td className={styles.dateCell}>
                        <div className={styles.dateInfo}>
                          <CalendarIcon />
                          <span>{formatDateForDisplay(blog.date)}</span>
                        </div>
                      </td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionButtons}>
                          <button 
                            onClick={() => openEditModal(blog)}
                            className={`${styles.actionButton} ${styles.editButton}`}
                            title="Edit blog"
                          >
                            <EditIcon />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(blog)}
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            title="Delete blog"
                          >
                            <DeleteIcon />
                            Delete
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
        title="Delete Blog Post"
        message={`Are you sure you want to delete "${confirmDialog.blog?.blogHeading}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Enhanced Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderContent}>
                <h2 className={styles.modalTitle}>
                  {modalMode === 'add' ? '✏️ Create New Blog' : '📝 Edit Blog Post'}
                </h2>
                <p className={styles.modalSubtitle}>
                  {modalMode === 'add' 
                    ? 'Share your thoughts and stories with the world' 
                    : 'Update your blog content and information'
                  }
                </p>
              </div>
              <button 
                onClick={closeModal}
                className={styles.closeButton}
                disabled={submitting}
                title="Close modal"
              >
                <XIcon />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <form onSubmit={handleSubmit} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="blogHeading" className={styles.label}>
                    <span className={styles.labelText}>Blog Title</span>
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="blogHeading"
                    value={formData.blogHeading}
                    onChange={(e) => handleInputChange('blogHeading', e.target.value)}
                    className={styles.input}
                    placeholder="Enter an engaging blog title..."
                    required
                    disabled={submitting}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="date" className={styles.label}>
                    <span className={styles.labelText}>Publication Date</span>
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <CalendarIcon />
                    <input
                      type="date"
                      id="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className={styles.input}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="description" className={styles.label}>
                    <span className={styles.labelText}>Blog Content</span>
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.textareaWrapper}>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className={styles.textarea}
                      rows={12}
                      placeholder="Write your blog content here... Share your insights, experiences, and stories."
                      required
                      disabled={submitting}
                    />
                    <div className={styles.characterCount}>
                      {formData.description.length} characters
                    </div>
                  </div>
                </div>

                {error && (
                  <div className={styles.errorMessage}>
                    <WarningIcon />
                    <span>{error}</span>
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
                    disabled={submitting || !formData.blogHeading.trim() || !formData.description.trim() || !formData.date}
                  >
                    {submitting ? (
                      <span className={styles.submittingText}>
                        <span className={styles.submittingSpinner}></span>
                        {modalMode === 'add' ? 'Creating Blog...' : 'Updating Blog...'}
                      </span>
                    ) : (
                      <>
                        {modalMode === 'add' ? <AddIcon /> : <EditIcon />}
                        {modalMode === 'add' ? 'Create Blog Post' : 'Update Blog Post'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogManagement;