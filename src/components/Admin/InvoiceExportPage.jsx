import React, { useState, useEffect } from 'react';
import { FileText, Download, Loader, AlertCircle, CheckCircle, FileSpreadsheet, Filter, CreditCard, Truck, Package, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import styles from './InvoiceExportPage.module.css';
import { INVOICE_ADMIN_FETCH_URL, UPDATE_PAYMENT_URL, UPDATE_ORDER_STATUS_URL } from '../../constants/apiConstants';

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
        if (!success) {
          setSuccess(`Successfully loaded ${data.payload?.length || 0} invoices`);
          setTimeout(() => setSuccess(''), 3000);
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

    if (filters.paymentStatus !== 'All') {
      filtered = filtered.filter(invoice => invoice.paymentStatus === filters.paymentStatus);
    }

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

  // Prepare data for Excel export (enhanced with new DTO fields)
  const prepareExcelData = () => {
    const excelData = [];
    
    filteredInvoices.forEach(invoice => {
      // Enhanced book details with more information from OrderDTO
      const bookDetails = invoice.orderList?.map(order => 
        `${order.bookName} by ${order.authorName || 'Unknown'} (Qty: ${order.quantity}, MRP: ₹${order.mrp || 0}, Price: ₹${order.price || 0})`
      ).join('; ') || 'N/A';
      
      // Calculate totals
      const totalQuantity = invoice.orderList?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;
      const totalItems = invoice.orderList?.length || 0;
      const totalGstAmount = invoice.totalGstPaid || 0;
      const baseAmount = invoice.baseAmount || 0;
      
      // Create enhanced row with all available fields
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
        'Books & Details': bookDetails,
        'Base Amount': `₹${baseAmount.toFixed(2)}`,
        'Total GST': `₹${totalGstAmount.toFixed(2)}`,
        'Total Amount': `₹${invoice.totalAmount?.toFixed(2) || '0.00'}`,
        'Payment Status': invoice.paymentStatus,
        'Order Status': invoice.orderStatus,
        'User ID': invoice.userId,
        'Remark': invoice.remark || 'N/A',
        'Total Items': totalItems,
        'Total Quantity': totalQuantity,
        // Individual book breakdown
        ...invoice.orderList?.reduce((bookFields, order, index) => {
          const bookPrefix = `Book_${index + 1}`;
          return {
            ...bookFields,
            [`${bookPrefix}_Name`]: order.bookName || 'N/A',
            [`${bookPrefix}_Author`]: order.authorName || 'N/A',
            [`${bookPrefix}_MRP`]: `₹${order.mrp || 0}`,
            [`${bookPrefix}_Price`]: `₹${order.price || 0}`,
            [`${bookPrefix}_Quantity`]: order.quantity || 0,
            [`${bookPrefix}_Discount`]: `₹${order.discount || 0}`,
            [`${bookPrefix}_GST_Percentage`]: `${order.gstPercentage || 0}%`,
            [`${bookPrefix}_GST_Amount`]: `₹${order.gstPaid || 0}`,
            [`${bookPrefix}_Amount_Before_Tax`]: `₹${order.amountBeforeTax || 0}`,
            [`${bookPrefix}_Total_Amount`]: `₹${order.totalAmount || 0}`
          };
        }, {}) || {}
      };
      
      excelData.push(row);
    });
    
    return excelData;
  };

  // Export to Excel with enhanced data
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
      
      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet
      const summarySheet = XLSX.utils.json_to_sheet(excelData.map(row => ({
        'Invoice ID': row['Invoice ID'],
        'Customer Name': row['Customer Name'],
        'Mobile No': row['Mobile No'],
        'City': row['City'],
        'State': row['State'],
        'Creation Date': row['Creation Date'],
        'Books & Details': row['Books & Details'],
        'Base Amount': row['Base Amount'],
        'Total GST': row['Total GST'],
        'Total Amount': row['Total Amount'],
        'Payment Status': row['Payment Status'],
        'Order Status': row['Order Status'],
        'Total Items': row['Total Items'],
        'Total Quantity': row['Total Quantity'],
        'Remark': row['Remark']
      })));
      
      // Set column widths for summary sheet
      summarySheet['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, 
        { wch: 15 }, { wch: 12 }, { wch: 40 }, { wch: 15 }, 
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, 
        { wch: 12 }, { wch: 15 }, { wch: 25 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Invoice Summary');
      
      // Detailed sheet with individual book data
      const detailedSheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Data');
      
      // Statistics sheet
      const stats = [{
        'Total Invoices': filteredInvoices.length,
        'Total Revenue': `₹${filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toFixed(2)}`,
        'Total GST Collected': `₹${filteredInvoices.reduce((sum, inv) => sum + (inv.totalGstPaid || 0), 0).toFixed(2)}`,
        'Total Items Sold': filteredInvoices.reduce((sum, inv) => sum + (inv.orderList?.length || 0), 0),
        'Total Quantity Sold': filteredInvoices.reduce((sum, inv) => sum + (inv.orderList?.reduce((s, order) => s + (order.quantity || 0), 0) || 0), 0),
        'Paid Invoices': filteredInvoices.filter(inv => inv.paymentStatus === 'PAID').length,
        'Due Invoices': filteredInvoices.filter(inv => inv.paymentStatus === 'DUE').length,
        'Pending Orders': filteredInvoices.filter(inv => inv.orderStatus === 'PENDING').length,
        'Dispatched Orders': filteredInvoices.filter(inv => inv.orderStatus === 'DISPATCHED').length,
        'Delivered Orders': filteredInvoices.filter(inv => inv.orderStatus === 'DELIVERED').length,
        'Cancelled Orders': filteredInvoices.filter(inv => inv.orderStatus === 'CANCELLED').length,
        'Export Date': new Date().toLocaleString('en-IN')
      }];
      
      const statsSheet = XLSX.utils.json_to_sheet(stats);
      statsSheet['!cols'] = [{ wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');
      
      // Generate filename
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
      
      setSuccess(`Excel file "${filename}" has been downloaded successfully! (${filteredInvoices.length} invoices exported with enhanced data)`);
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
              <p className={styles.subtitle}>Export invoices with comprehensive book details, GST breakdown, and enhanced analytics</p>
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
                {exporting ? 'Exporting...' : 'Export Enhanced Excel'}
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

        {/* Enhanced Statistics Cards */}
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
                <p className={styles.statLabel}>Total GST Collected</p>
                <p className={styles.statValuePurple}>
                  {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + (inv.totalGstPaid || 0), 0))}
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
            <p className={styles.tableSubtitle}>Preview of filtered invoices with enhanced book details and GST information</p>
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
                    <th className={styles.th}>Books & Details</th>
                    <th className={styles.th}>Amount Breakdown</th>
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
                    const totalGst = invoice.totalGstPaid || 0;
                    const baseAmount = invoice.baseAmount || 0;
                    
                    return (
                      <tr key={invoice.invoiceId} className={styles.tableRow}>
                        <td className={styles.td}>#{invoice.invoiceId}</td>
                        <td className={styles.td}>
                          <div>
                            <div className={styles.customerName}>{invoice.customerName}</div>
                            <div className={styles.customerMobile}>{invoice.mobileNo}</div>
                            <div className={styles.customerLocation}>{invoice.city}, {invoice.state}</div>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.booksColumn}>
                            {invoice.orderList?.map(order => (
                              <div key={order.orderId} className={styles.bookItem}>
                                <div className={styles.bookName}>{order.bookName}</div>
                                <div className={styles.bookAuthor}>by {order.authorName || 'Unknown'}</div>
                                <div className={styles.bookDetails}>
                                  Qty: {order.quantity} | MRP: ₹{order.mrp || 0} | Price: ₹{order.price || 0}
                                  {order.discount > 0 && <span className={styles.discount}> (₹{order.discount} off)</span>}
                                </div>
                                {order.gstPercentage > 0 && (
                                  <div className={styles.gstInfo}>
                                    GST: {order.gstPercentage}% (₹{order.gstPaid || 0})
                                  </div>
                                )}
                              </div>
                            )) || 'N/A'}
                          </div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.amountBreakdown}>
                            <div className={styles.amountLine}>Base: {formatCurrency(baseAmount)}</div>
                            <div className={styles.amountLine}>GST: {formatCurrency(totalGst)}</div>
                            <div className={styles.amountTotal}>Total: {formatCurrency(invoice.totalAmount)}</div>
                          </div>
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
                            <div className={styles.addressLocation}>{invoice.city}, {invoice.state} - {invoice.pincode}</div>
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
                                    disabled={isLoading || isActionLoading(invoice.invoiceId)}
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

        {/* Enhanced Export Information */}
        <div className={styles.exportInfo}>
          <h3 className={styles.exportInfoTitle}>Enhanced Excel Export Information</h3>
          <div className={styles.exportInfoList}>
            <p>• <strong>Multiple Sheets:</strong> Summary, Detailed Data, and Statistics sheets for comprehensive analysis</p>
            <p>• <strong>Enhanced Book Details:</strong> Includes author names, MRP, selling price, discounts, and individual GST calculations</p>
            <p>• <strong>Financial Breakdown:</strong> Base amount, total GST collected, and detailed tax information per book</p>
            <p>• <strong>Individual Book Data:</strong> Separate columns for each book with complete pricing and tax details</p>
            <p>• <strong>GST Analytics:</strong> GST percentage, amount per item, and total tax collection summary</p>
            <p>• <strong>Comprehensive Statistics:</strong> Revenue analysis, tax collection, order status distribution</p>
            <p>• <strong>Smart Filtering:</strong> Export only filtered data with filter information in filename</p>
            <p>• <strong>Indian Format:</strong> Currency in INR format, dates in DD/MM/YYYY, optimized for Indian business needs</p>
          </div>
          
          <div className={styles.exportSample}>
            <h4 className={styles.exportSampleTitle}>Sample Export Columns Include:</h4>
            <div className={styles.exportColumnsList}>
              <div className={styles.exportColumn}>
                <strong>Basic Info:</strong> Invoice ID, Customer Details, Address, Mobile Numbers
              </div>
              <div className={styles.exportColumn}>
                <strong>Financial:</strong> Base Amount, Total GST, Total Amount, Payment Status
              </div>
              <div className={styles.exportColumn}>
                <strong>Book Details:</strong> Name, Author, MRP, Price, Quantity, Discount, GST %
              </div>
              <div className={styles.exportColumn}>
                <strong>Analytics:</strong> Total Items, Quantities, Order Status, Creation Date, Remarks
              </div>
            </div>
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