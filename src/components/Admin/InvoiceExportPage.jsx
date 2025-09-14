import React, { useState, useEffect } from 'react';
import { FileText, Download, Loader, AlertCircle, CheckCircle, FileSpreadsheet, Filter, CreditCard, Truck, Package, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import styles from './InvoiceExportPage.module.css';
import { INVOICE_ADMIN_FETCH_URL,UPDATE_PAYMENT_URL,UPDATE_ORDER_STATUS_URL } from '../../constants/apiConstants';

// Remark Modal Component
const RemarkModal = ({ isOpen, onClose, onSubmit, title, actionType, invoiceId, isLoading }) => {
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!remark.trim()) {
      setError('Remark is required');
      return;
    }
    onSubmit(remark.trim());
    setRemark('');
    setError('');
  };

  const handleClose = () => {
    setRemark('');
    setError('');
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setRemark('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button 
            className={styles.modalCloseButton} 
            onClick={handleClose}
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Invoice ID: <span className={styles.invoiceIdLabel}>#{invoiceId}</span>
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="remark" className={styles.formLabel}>
                Remark <span className={styles.required}>*</span>
              </label>
              <textarea
                id="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder={`Enter remark for ${actionType.toLowerCase()} action...`}
                className={styles.formTextarea}
                rows="4"
                disabled={isLoading}
                required
              />
              {error && <span className={styles.formError}>{error}</span>}
            </div>
          </div>
          
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={handleClose}
              className={`${styles.modalButton} ${styles.modalButtonSecondary}`}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.modalButton} ${styles.modalButtonPrimary}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className={styles.modalButtonSpinner} />
                  Processing...
                </>
              ) : (
                `Confirm ${actionType}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InvoiceExportPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  
  // Modal states
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    actionType: '',
    invoiceId: null,
    onSubmit: null
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    paymentStatus: 'All',
    orderStatus: 'All'
  });

  // Filter options based on enums
  const paymentStatusOptions = ['All', 'DUE', 'PAID'];
  const orderStatusOptions = ['All', 'PENDING', 'DISPATCHED', 'CANCELLED', 'DELIVERED'];

  // Get user data from session storage
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

  // Clear messages after a timeout
  const clearMessages = () => {
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
  };

  // Close modal
  const closeModal = () => {
    setModalState({
      isOpen: false,
      title: '',
      actionType: '',
      invoiceId: null,
      onSubmit: null
    });
  };

  // Open modal with specific configuration
  const openModal = (title, actionType, invoiceId, onSubmitCallback) => {
    setModalState({
      isOpen: true,
      title,
      actionType,
      invoiceId,
      onSubmit: onSubmitCallback
    });
  };

  // Update payment status to PAID
  const handleMarkPaymentComplete = async (invoiceId) => {
    const actionKey = `payment-${invoiceId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    setError('');
    setSuccess('');
    
    const userData = getUserData();
    
    if (!userData.user || !userData.token) {
      setError('User authentication data not found. Please login again.');
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
      clearMessages();
      return;
    }

    try {
      const response = await axios.post(UPDATE_PAYMENT_URL, {
        invoiceId: invoiceId,
        user: userData.user,
        token: userData.token
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = response.data;
      
      if (data.status === 'SUCCESS') {
        setSuccess(`Payment status updated successfully for invoice #${invoiceId}`);
        // Refresh invoices to get updated data
        await fetchInvoices();
      } else if (data.status === 'UNAUTHORIZED') {
        setError('Unauthorized access. Please login again.');
      } else {
        setError(data.message || `Failed to update payment status for invoice #${invoiceId}`);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Unauthorized access. Please login again.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(`Network error. Please check your connection and try again.`);
      }
      console.error('Error updating payment status:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
      clearMessages();
    }
  };

  // Generic function to update order status
  const updateOrderStatus = async (invoiceId, orderStatus, remark = '') => {
    const userData = getUserData();
    
    if (!userData.user || !userData.token) {
      setError('User authentication data not found. Please login again.');
      return false;
    }

    try {
      const response = await axios.post(UPDATE_ORDER_STATUS_URL, {
        invoiceId: invoiceId,
        orderStatus: orderStatus,
        remark: remark,
        user: userData.user,
        token: userData.token
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = response.data;
      
      if (data.status === 'SUCCESS') {
        setSuccess(`Order status updated to ${orderStatus.toLowerCase()} for invoice #${invoiceId}`);
        // Refresh invoices to get updated data
        await fetchInvoices();
        return true;
      } else if (data.status === 'UNAUTHORIZED') {
        setError('Unauthorized access. Please login again.');
        return false;
      } else {
        setError(data.message || `Failed to update order status for invoice #${invoiceId}`);
        return false;
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Unauthorized access. Please login again.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(`Network error. Please check your connection and try again.`);
      }
      console.error('Error updating order status:', err);
      return false;
    }
  };

  // Handle dispatch action with modal
  const handleDispatch = async (invoiceId) => {
    const handleModalSubmit = async (remark) => {
      const actionKey = `dispatch-${invoiceId}`;
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      setError('');
      setSuccess('');
      
      const success = await updateOrderStatus(invoiceId, 'DISPATCHED', remark);
      
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
      if (success) {
        closeModal();
      }
      clearMessages();
    };

    openModal(
      'Dispatch Order',
      'Dispatch',
      invoiceId,
      handleModalSubmit
    );
  };

  // Handle delivered action with modal
  const handleDelivered = async (invoiceId) => {
    const handleModalSubmit = async (remark) => {
      const actionKey = `delivered-${invoiceId}`;
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      setError('');
      setSuccess('');
      
      const success = await updateOrderStatus(invoiceId, 'DELIVERED', remark);
      
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
      if (success) {
        closeModal();
      }
      clearMessages();
    };

    openModal(
      'Mark as Delivered',
      'Delivered',
      invoiceId,
      handleModalSubmit
    );
  };

  // Handle cancel action with modal
  const handleCancel = async (invoiceId) => {
    const handleModalSubmit = async (remark) => {
      const actionKey = `cancel-${invoiceId}`;
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      setError('');
      setSuccess('');
      
      const success = await updateOrderStatus(invoiceId, 'CANCELLED', remark);
      
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
      if (success) {
        closeModal();
      }
      clearMessages();
    };

    openModal(
      'Cancel Order',
      'Cancel',
      invoiceId,
      handleModalSubmit
    );
  };

  // Get available actions for an invoice based on business rules
  const getAvailableActions = (invoice) => {
    const actions = [];
    
    // If invoice is not cancelled and payment is due, show mark as complete
    if (invoice.orderStatus !== 'CANCELLED' && invoice.paymentStatus === 'DUE') {
      actions.push({
        type: 'payment',
        label: 'Mark Paid',
        icon: CreditCard,
        handler: () => handleMarkPaymentComplete(invoice.invoiceId),
        variant: 'success'
      });
    }
    
    // If pending - show dispatch and cancel button
    if (invoice.orderStatus === 'PENDING') {
      actions.push({
        type: 'dispatch',
        label: 'Dispatch',
        icon: Truck,
        handler: () => handleDispatch(invoice.invoiceId),
        variant: 'primary'
      });
      actions.push({
        type: 'cancel',
        label: 'Cancel',
        icon: X,
        handler: () => handleCancel(invoice.invoiceId),
        variant: 'danger'
      });
    }
    
    // If dispatched - show delivered and cancel button
    if (invoice.orderStatus === 'DISPATCHED') {
      actions.push({
        type: 'delivered',
        label: 'Delivered',
        icon: Package,
        handler: () => handleDelivered(invoice.invoiceId),
        variant: 'success'
      });
      actions.push({
        type: 'cancel',
        label: 'Cancel',
        icon: X,
        handler: () => handleCancel(invoice.invoiceId),
        variant: 'danger'
      });
    }
    
    // If delivered or cancelled - no action buttons
    
    return actions;
  };

  // Fetch all invoices using axios
  const fetchInvoices = async () => {
    setLoading(true);
    setError('');
    
    try {
      const userData = getUserData();
      
      if (!userData.user || !userData.token) {
        setError('User authentication data not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${INVOICE_ADMIN_FETCH_URL}`, {
        user: userData.user,
        token: userData.token
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = response.data;
      
      if (data.status === 'SUCCESS') {
        setInvoices(data.payload || []);
        if (!success) { // Only show this message if there's no other success message
          setSuccess(`Successfully loaded ${data.payload?.length || 0} invoices`);
          setTimeout(() => setSuccess(''), 3000); // Clear after 3 seconds
        }
      } else if (data.status === 'UNAUTHORIZED') {
        setError('Unauthorized access. Please login again.');
      } else {
        setError(data.message || 'Failed to fetch invoices');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Unauthorized access. Please login again.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to invoices
  const applyFilters = () => {
    let filtered = invoices;

    // Filter by payment status
    if (filters.paymentStatus !== 'All') {
      filtered = filtered.filter(invoice => invoice.paymentStatus === filters.paymentStatus);
    }

    // Filter by order status
    if (filters.orderStatus !== 'All') {
      filtered = filtered.filter(invoice => invoice.orderStatus === filters.orderStatus);
    }

    setFilteredInvoices(filtered);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      paymentStatus: 'All',
      orderStatus: 'All'
    });
  };

  // Prepare data for Excel export (using filtered data)
  const prepareExcelData = () => {
    const excelData = [];
    
    filteredInvoices.forEach(invoice => {
      // Combine book names and quantities for single column
      const bookDetails = invoice.orderList?.map(order => 
        `${order.bookName} (Qty: ${order.quantity})`
      ).join('; ') || 'N/A';
      
      // Create row with all invoice details
      const row = {
        'Invoice ID': invoice.invoiceId,
        'Customer Name': invoice.customerName,
        'Mobile No': invoice.mobileNo,
        'Registered Mobile': invoice.customerRegisteredMobileNo,
        'Delivery Address': invoice.deliveryAddress,
        'City': invoice.city,
        'State': invoice.state,
        'Pincode': invoice.pincode,
        'Creation Date': new Date(invoice.creationDate).toLocaleDateString('en-IN'),
        'Books & Quantities': bookDetails,
        'Total Amount': `₹${invoice.totalAmount?.toFixed(2) || '0.00'}`,
        'Payment Status': invoice.paymentStatus,
        'Order Status': invoice.orderStatus,
        'User ID': invoice.userId,
        'Remark': invoice.remark || 'N/A',
        'Total Items': invoice.orderList?.length || 0,
        'Total Quantity': invoice.orderList?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0
      };
      
      excelData.push(row);
    });
    
    return excelData;
  };

  // Export to Excel (filtered data only)
  const exportToExcel = () => {
    if (filteredInvoices.length === 0) {
      setError('No invoices to export based on current filters');
      clearMessages();
      return;
    }

    setExporting(true);
    setError('');

    try {
      const excelData = prepareExcelData();
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 12 }, // Invoice ID
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Mobile No
        { wch: 15 }, // Registered Mobile
        { wch: 30 }, // Delivery Address
        { wch: 15 }, // City
        { wch: 15 }, // State
        { wch: 10 }, // Pincode
        { wch: 12 }, // Creation Date
        { wch: 40 }, // Books & Quantities
        { wch: 15 }, // Total Amount
        { wch: 12 }, // Payment Status
        { wch: 12 }, // Order Status
        { wch: 12 }, // User ID
        { wch: 25 }, // Remark
        { wch: 12 }, // Total Items
        { wch: 15 }  // Total Quantity
      ];
      
      worksheet['!cols'] = columnWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
      
      // Generate filename with current date and filter info
      const currentDate = new Date().toISOString().split('T')[0];
      let filterSuffix = '';
      if (filters.paymentStatus !== 'All' || filters.orderStatus !== 'All') {
        const filterParts = [];
        if (filters.paymentStatus !== 'All') filterParts.push(`payment_${filters.paymentStatus.toLowerCase()}`);
        if (filters.orderStatus !== 'All') filterParts.push(`order_${filters.orderStatus.toLowerCase()}`);
        filterSuffix = `_${filterParts.join('_')}`;
      }
      
      const filename = `invoices_export_${currentDate}${filterSuffix}.xlsx`;
      
      // Save the file
      XLSX.writeFile(workbook, filename);
      
      setSuccess(`Excel file "${filename}" has been downloaded successfully! (${filteredInvoices.length} invoices exported)`);
      clearMessages();
    } catch (err) {
      setError('Failed to export Excel file. Please try again.');
      console.error('Export error:', err);
      clearMessages();
    } finally {
      setExporting(false);
    }
  };

  // Load invoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Apply filters when invoices or filters change
  useEffect(() => {
    applyFilters();
  }, [invoices, filters]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const getStatusBadgeClass = (status, type) => {
    if (type === 'payment') {
      return status === 'PAID' ? styles.statusPaid : styles.statusDue;
    } else {
      switch (status) {
        case 'DELIVERED':
          return styles.statusDelivered;
        case 'DISPATCHED':
          return styles.statusDispatched;
        case 'CANCELLED':
          return styles.statusCancelled;
        default:
          return styles.statusPending;
      }
    }
  };


  // Check if any action for this invoice is loading
const isActionLoading = (invoiceId) => {
  // Add null check to prevent toString() error
  if (!invoiceId) {
    return false;
  }
  
  return Object.keys(actionLoading).some(key => 
    key.includes(invoiceId.toString()) && actionLoading[key]
  );
};

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.title}>
                <FileSpreadsheet className={styles.titleIcon} />
                Invoice Export Manager
              </h1>
              <p className={styles.subtitle}>Export all invoices to Excel with complete details</p>
            </div>
            
            <div className={styles.headerActions}>
              <button
                onClick={fetchInvoices}
                disabled={loading}
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                {loading ? <Loader className={styles.spinner} /> : <FileText className={styles.buttonIcon} />}
                {loading ? 'Loading...' : 'Refresh Invoices'}
              </button>
              
              <button
                onClick={exportToExcel}
                disabled={exporting || filteredInvoices.length === 0}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                {exporting ? <Loader className={styles.spinner} /> : <Download className={styles.buttonIcon} />}
                {exporting ? 'Exporting...' : 'Export to Excel'}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className={styles.errorMessage}>
              <AlertCircle className={styles.messageIcon} />
              {error}
            </div>
          )}
          
          {success && (
            <div className={styles.successMessage}>
              <CheckCircle className={styles.messageIcon} />
              {success}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className={styles.filtersContainer}>
          <div className={styles.filtersHeader}>
            <h3 className={styles.filtersTitle}>
              <Filter className={styles.filterIcon} />
              Filters
            </h3>
            <button
              onClick={resetFilters}
              className={styles.resetButton}
            >
              Reset Filters
            </button>
          </div>
          
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Payment Status:</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                className={styles.filterSelect}
              >
                {paymentStatusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Order Status:</label>
              <select
                value={filters.orderStatus}
                onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
                className={styles.filterSelect}
              >
                {orderStatusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={styles.filterSummary}>
            Showing {filteredInvoices.length} of {invoices.length} invoices
            {(filters.paymentStatus !== 'All' || filters.orderStatus !== 'All') && (
              <span className={styles.filterActive}>
                {' '}(Filtered: {filters.paymentStatus !== 'All' ? `Payment: ${filters.paymentStatus}` : ''}
                {filters.paymentStatus !== 'All' && filters.orderStatus !== 'All' ? ', ' : ''}
                {filters.orderStatus !== 'All' ? `Order: ${filters.orderStatus}` : ''})
              </span>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statContent}>
              <div>
                <p className={styles.statLabel}>Total Invoices</p>
                <p className={styles.statValue}>{filteredInvoices.length}</p>
              </div>
              <FileText className={styles.statIcon} />
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statContent}>
              <div>
                <p className={styles.statLabel}>Total Revenue</p>
                <p className={styles.statValueCurrency}>
                  {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0))}
                </p>
              </div>
              <div className={styles.currencySymbol}>₹</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statContent}>
              <div>
                <p className={styles.statLabel}>Total Items</p>
                <p className={styles.statValuePurple}>
                  {filteredInvoices.reduce((sum, inv) => sum + (inv.orderList?.reduce((s, order) => s + (order.quantity || 0), 0) || 0), 0)}
                </p>
              </div>
              <div className={styles.itemSymbol}>#</div>
            </div>
          </div>
        </div>

        {/* Invoice Preview Table */}
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Invoice Preview</h2>
            <p className={styles.tableSubtitle}>Preview of filtered invoices that will be exported</p>
          </div>
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <Loader className={styles.loadingSpinner} />
              <p className={styles.loadingText}>Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className={styles.emptyContainer}>
              <FileText className={styles.emptyIcon} />
              <p className={styles.emptyText}>
                {invoices.length === 0 ? 'No invoices found' : 'No invoices match the current filters'}
              </p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.th}>Invoice ID</th>
                    <th className={styles.th}>Customer</th>
                    <th className={styles.th}>Books & Quantities</th>
                    <th className={styles.th}>Amount</th>
                    <th className={styles.th}>Payment Status</th>
                    <th className={styles.th}>Order Status</th>
                    <th className={styles.th}>Address</th>
                    <th className={styles.th}>Date</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {filteredInvoices.slice(0, 10).map((invoice) => {
                    const availableActions = getAvailableActions(invoice);
                    
                    return (
                      <tr key={invoice.invoiceId} className={styles.tableRow}>
                        <td className={styles.td}>#{invoice.invoiceId}</td>
                        <td className={styles.td}>
                          <div>
                            <div className={styles.customerName}>{invoice.customerName}</div>
                            <div className={styles.customerLocation}>{invoice.city}, {invoice.state}</div>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.booksColumn}>
                            {invoice.orderList?.map(order => (
                              <div key={order.orderId} className={styles.bookItem}>
                                {order.bookName} (Qty: {order.quantity})
                              </div>
                            )) || 'N/A'}
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.amount}>{formatCurrency(invoice.totalAmount)}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.statusBadge} ${getStatusBadgeClass(invoice.paymentStatus, 'payment')}`}>
                            {invoice.paymentStatus}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.statusBadge} ${getStatusBadgeClass(invoice.orderStatus, 'order')}`}>
                            {invoice.orderStatus}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.addressColumn}>
                            <div className={styles.addressLine}>{invoice.deliveryAddress || 'N/A'}</div>
                            <div className={styles.addressLocation}>{invoice.city}, {invoice.state}</div>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.date}>
                            {new Date(invoice.creationDate).toLocaleDateString('en-IN')}
                          </span>
                        </td>
                        <td className={styles.td}>
                          {availableActions.length > 0 ? (
                            <div className={styles.actionButtons}>
                              {availableActions.map(action => {
                                const Icon = action.icon;
                                const isLoading = actionLoading[`${action.type}-${invoice.invoiceId}`];
                                
                                return (
                                  <button
                                    key={action.type}
                                    onClick={action.handler}
                                    disabled={isLoading}
                                    className={`${styles.actionButton} ${styles[`actionButton${action.variant.charAt(0).toUpperCase() + action.variant.slice(1)}`]}`}
                                    title={action.label}
                                  >
                                    {isLoading ? (
                                      <Loader className={styles.actionButtonSpinner} />
                                    ) : (
                                      <Icon className={styles.actionButtonIcon} />
                                    )}
                                    <span className={styles.actionButtonLabel}>{action.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <span className={styles.noActions}>No actions available</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredInvoices.length > 10 && (
                <div className={styles.tableFooter}>
                  ... and {filteredInvoices.length - 10} more invoices (showing first 10)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export Information */}
        <div className={styles.exportInfo}>
          <h3 className={styles.exportInfoTitle}>Excel Export Information</h3>
          <div className={styles.exportInfoList}>
            <p>• Exports only the currently filtered invoices ({filteredInvoices.length} invoices)</p>
            <p>• All invoice details including customer information, delivery address, and payment status</p>
            <p>• Book names and quantities combined in a single column format: "Book Name (Qty: X)"</p>
            <p>• Multiple books separated by semicolons for easy reading</p>
            <p>• Financial data formatted in Indian Rupees</p>
            <p>• Dates formatted in Indian format (DD/MM/YYYY)</p>
            <p>• File name includes applied filters for easy identification</p>
          </div>
        </div>
      </div>

      {/* Remark Modal */}
      <RemarkModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSubmit={modalState.onSubmit}
        title={modalState.title}
        actionType={modalState.actionType}
        invoiceId={modalState.invoiceId}
        isLoading={isActionLoading(modalState.invoiceId)}
      />
    </div>
  );
};

export default InvoiceExportPage;