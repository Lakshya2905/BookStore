import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BLOG_VIEW_URL, 
  CREATE_BLOG_URL, 
  DELETE_BLOG_URL, 
  EDIT_BLOG_URL 
} from '../../constants/apiConstants';
import styles from './AdminBlogManagement.module.css';

/* ---------------- ICONS ---------------- */
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

/* ---------------- TOAST ---------------- */
const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), toast.duration || 5000);
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
      <div className={styles.toastIcon}>{getToastIcon(toast.type)}</div>
      <div className={styles.toastContent}>
        <p className={styles.toastTitle}>{toast.title}</p>
        {toast.message && <p className={styles.toastMessage}>{toast.message}</p>}
      </div>
      <button onClick={() => onClose(toast.id)} className={styles.toastClose}>
        <XIcon />
      </button>
      <div className={styles.toastProgress}></div>
    </div>
  );
};

/* ---------------- CONFIRM DIALOG ---------------- */
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.confirmDialog}>
      <div className={styles.confirmDialogContent}>
        <div className={styles.confirmDialogIcon}><DeleteIcon /></div>
        <h3 className={styles.confirmDialogTitle}>{title}</h3>
        <p className={styles.confirmDialogMessage}>{message}</p>
        <div className={styles.confirmDialogActions}>
          <button onClick={onCancel} className={`${styles.confirmDialogButton} ${styles.confirmDialogCancel}`}>Cancel</button>
          <button onClick={onConfirm} className={`${styles.confirmDialogButton} ${styles.confirmDialogConfirm}`}>
            <DeleteIcon /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- LOADING SPINNER ---------------- */
const LoadingSpinner = ({ size = 'default', text = 'Loading...' }) => (
  <div className={`${styles.loadingWrapper} ${styles[`loading${size.charAt(0).toUpperCase() + size.slice(1)}`]}`}>
    <div className={styles.spinner}></div>
    <p className={styles.loadingText}>{text}</p>
  </div>
);

/* ---------------- STATS CARD ---------------- */
const StatsCard = ({ title, value, icon, color = 'blue' }) => (
  <div className={`${styles.statsCard} ${styles[`statsCard${color.charAt(0).toUpperCase() + color.slice(1)}`]}`}>
    <div className={styles.statsIcon}>{icon}</div>
    <div className={styles.statsContent}>
      <p className={styles.statsValue}>{value}</p>
      <p className={styles.statsTitle}>{title}</p>
    </div>
  </div>
);

/* ---------------- MAIN COMPONENT ---------------- */
const AdminBlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [formData, setFormData] = useState({
    heading: '',
    description: '',
    date: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, blog: null });

  /* ---------------- UTILS ---------------- */
  const addToast = (type, title, message = '', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const formatDateForInput = (date) => (date ? new Date(date).toISOString().split('T')[0] : '');
  const formatDateForDisplay = (date) =>
    date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No date';
  const truncateText = (text, maxLength = 100) => (text?.length > maxLength ? text.substring(0, maxLength) + '...' : text);

  /* ---------------- FETCH BLOGS ---------------- */
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(BLOG_VIEW_URL);
      if (response.data.status === 'SUCCESS') {
        setBlogs(response.data.payload || []);
      } else {
        setError(response.data.message || 'Failed to fetch blogs');
      }
    } catch (err) {
      setError('Error fetching blogs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  /* ---------------- MODALS ---------------- */
  const openAddModal = () => {
    setModalMode('add');
    setFormData({ heading: '', description: '', date: formatDateForInput(new Date()) });
    setShowModal(true);
  };

  const openEditModal = (blog) => {
    setModalMode('edit');
    setFormData({ heading: blog.heading || '', description: blog.description || '', date: formatDateForInput(blog.date) });
    setSelectedBlog(blog);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ heading: '', description: '', date: '' });
    setSelectedBlog(null);
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.heading.trim() || !formData.description.trim() || !formData.date) {
      setError('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      const requestData = {
        heading: formData.heading.trim(),
        description: formData.description.trim(),
        date: new Date(formData.date)
      };
      if (modalMode === 'edit') requestData.id = selectedBlog.id;

      const url = modalMode === 'add' ? CREATE_BLOG_URL : EDIT_BLOG_URL;
      const response = await axios.post(url, requestData);

      if (response.data.status === 'SUCCESS') {
        closeModal();
        fetchBlogs();
        addToast('success', modalMode === 'add' ? 'Blog created!' : 'Blog updated!');
      } else {
        setError(response.data.message || 'Operation failed');
      }
    } catch {
      setError('Server error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = (blog) => setConfirmDialog({ isOpen: true, blog });
  const confirmDelete = async () => {
    const blog = confirmDialog.blog;
    setConfirmDialog({ isOpen: false, blog: null });
    try {
      const response = await axios.post(DELETE_BLOG_URL, { id: blog.id });
      if (response.data.status === 'SUCCESS') {
        fetchBlogs();
        addToast('success', 'Blog deleted', `Blog #${blog.id} removed.`);
      } else {
        addToast('error', 'Delete failed', response.data.message || 'Failed to delete blog');
      }
    } catch {
      addToast('error', 'Error', 'Failed to delete blog');
    }
  };

  /* ---------------- RENDER ---------------- */
  if (loading) {
    return <LoadingSpinner text="Loading blog management..." />;
  }

  const totalBlogs = blogs.length;
  const recentBlogs = blogs.filter((b) => new Date(b.date) >= new Date(new Date().setDate(new Date().getDate() - 7))).length;

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>📝 Blog Management</h1>
          <div className={styles.headerStats}>
            <StatsCard title="Total Blogs" value={totalBlogs} icon={<InfoIcon />} color="blue" />
            <StatsCard title="Recent Posts" value={recentBlogs} icon={<CalendarIcon />} color="green" />
          </div>
          <button onClick={openAddModal} className={styles.addButton}>
            <AddIcon /> Create New Blog
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className={styles.main}>
        {error && !showModal && (
          <div className={styles.errorBanner}>
            <WarningIcon /> <p>{error}</p>
            <button onClick={() => setError(null)} className={styles.closeError}><XIcon /></button>
          </div>
        )}

        {blogs.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No Blogs Found</h3>
            <button onClick={openAddModal} className={styles.emptyStateButton}><AddIcon /> Create Your First Blog</button>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Content Preview</th>
                <th>Publication Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog.id}>
                  <td>#{blog.id}</td>
                  <td><h4>{blog.heading}</h4></td>
                  <td>{truncateText(blog.description)}</td>
                  <td>{formatDateForDisplay(blog.date)}</td>
                  <td>
                    <button onClick={() => openEditModal(blog)} className={styles.editButton}><EditIcon /> Edit</button>
                    <button onClick={() => handleDelete(blog)} className={styles.deleteButton}><DeleteIcon /> Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {/* TOASTS */}
      <div className={styles.toastContainer}>
        {toasts.map((t) => <Toast key={t.id} toast={t} onClose={removeToast} />)}
      </div>

      {/* CONFIRM DELETE */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Blog Post"
        message={`Are you sure you want to delete "${confirmDialog.blog?.heading}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, blog: null })}
      />

      {/* MODAL */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <label>
                Blog Title *
                <input
                  type="text"
                  value={formData.heading}
                  onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                  required
                />
              </label>
              <label>
                Date *
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </label>
              <label>
                Content *
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={10}
                  required
                />
              </label>
              <button type="submit" disabled={submitting}>
                {modalMode === 'add' ? 'Create Blog' : 'Update Blog'}
              </button>
              <button type="button" onClick={closeModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogManagement;
