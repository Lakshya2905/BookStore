import React, { useState, useEffect } from 'react';
import { FileText, Download, Loader, AlertCircle, CheckCircle, FileSpreadsheet, Filter, CreditCard, Truck, Package, X, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [expandedRows, setExpandedRows] = useState({});
  
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

  // Toggle expanded row
  const toggleRowExpansion = (invoiceId) => {
    setExpandedRows(prev => ({
      ...prev,
      [invoiceId]: !prev[invoiceId]
    }));
  };

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

  // Prepare data for Excel export - ONLY SUMMARY
  const prepareSummaryExcelData = () => {
    const excelData = [];
    
    filteredInvoices.forEach(invoice => {
      // Create simplified summary row
      const row = {
        'Invoice ID': invoice.invoiceId,
        'Customer Name': invoice.customerName,
        'Mobile No': invoice.mobileNo,
        'Delivery Address': invoice.deliveryAddress || 'N/A',
        'City': invoice.city,
        'State': invoice.state,
        'Pincode': invoice.pincode,
        'Creation Date': new Date(invoice.creationDate).toLocaleDateString('en-IN'),
        'Base Amount': `₹${(invoice.baseAmount || 0).toFixed(2)}`,
        'Total GST': `₹${(invoice.totalGstPaid || 0).toFixed(2)}`,
        'Total Amount': `₹${(invoice.totalAmount || 0).toFixed(2)}`,
        'Payment Status': invoice.paymentStatus,
        'Order Status': invoice.orderStatus,
        'Total Items': invoice.orderList?.length || 0,
        'Total Quantity': invoice.orderList?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0,
        'Remark': invoice.remark || 'N/A'
      };
      
      excelData.push(row);
    });
    
    return excelData;
  };

  // Export to Excel - ONLY SUMMARY
  const exportToExcel = () => {
    if (filteredInvoices.length === 0) {
      setError('No invoices to export based on current filters');
      clearMessages();
      return;
    }

    setExporting(true);
    setError('');

    try {
      const summaryData = prepareSummaryExcelData();
      
      // Create workbook with only summary sheet
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet only
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      
      // Set column widths for summary sheet
      summarySheet['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, 
        { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, 
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, 
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Invoice Summary');
      
      // Generate filename
      const currentDate = new Date().toISOString().split('T')[0];
      let filterSuffix = '';
      if (filters.paymentStatus !== 'All' || filters.orderStatus !== 'All') {
        const filterParts = [];
        if (filters.paymentStatus !== 'All') filterParts.push(`payment_${filters.paymentStatus.toLowerCase()}`);
        if (filters.orderStatus !== 'All') filterParts.push(`order_${filters.orderStatus.toLowerCase()}`);
        filterSuffix = `_${filterParts.join('_')}`;
      }
      
      const filename = `invoice_summary_${currentDate}${filterSuffix}.xlsx`;
      
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
              <p className={styles.subtitle}>Export invoice summary and manage orders with expandable details</p>
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
                {exporting ? 'Exporting...' : 'Export Summary'}
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
            <p className={styles.tableSubtitle}>Preview of filtered invoices with expandable order details</p>
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
                    <th className={styles.th} style={{ width: '50px' }}>Details</th>
                    <th className={styles.th}>Invoice ID</th>
                    <th className={styles.th}>Customer</th>
                    <th className={styles.th}>Base Amount</th>
                    <th className={styles.th}>GST</th>
                    <th className={styles.th}>Total Amount</th>
                    
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
                    const isExpanded = expandedRows[invoice.invoiceId];
                    
                    return (
                      <React.Fragment key={invoice.invoiceId}>
                        {/* Main Row */}
                        <tr className={styles.tableRow}>
                          <td className={styles.td}>
                            <button
                              onClick={() => toggleRowExpansion(invoice.invoiceId)}
                              className={styles.expandButton}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          </td>
                          <td className={styles.td}>#{invoice.invoiceId}</td>
                          <td className={styles.td}>
                            <div>
                              <div className={styles.customerName}>{invoice.customerName}</div>
                              <div className={styles.customerMobile}>{invoice.mobileNo}</div>
                              <div className={styles.customerLocation}>{invoice.city}, {invoice.state}</div>
                            </div>
                          </td>
                  
                          
                          <td className={styles.td}>
                            <div className={styles.amountBreakdown}>
                              <div className={styles.amountTotal}>{formatCurrency(invoice.baseAmount)}</div>
                            </div>
                          </td>

                          <td className={styles.td}>
                            <div className={styles.amountBreakdown}>
                              <div className={styles.amountTotal}>{formatCurrency(invoice.totalGstPaid)}</div>
                            </div>
                          </td>

                            <td className={styles.td}>
                            <div className={styles.amountBreakdown}>
                              <div className={styles.amountTotal}>{formatCurrency(invoice.totalAmount)}</div>
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
                        
                        {/* Expanded Row with Order Details */}
                        {isExpanded && (
                          <tr className={styles.expandedRow}>
                            <td colSpan="10" className={styles.expandedContent}>
                              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                                <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                                  Order Details for Invoice #{invoice.invoiceId}
                                </h4>
                                
                                <div style={{ marginBottom: '1rem' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                      <span style={{ fontWeight: '500', color: '#6b7280' }}>Base Amount: </span>
                                      <span style={{ color: '#111827' }}>{formatCurrency(invoice.baseAmount || 0)}</span>
                                    </div>
                                    <div>
                                      <span style={{ fontWeight: '500', color: '#6b7280' }}>Total GST: </span>
                                      <span style={{ color: '#111827' }}>{formatCurrency(invoice.totalGstPaid || 0)}</span>
                                    </div>
                                    <div>
                                      <span style={{ fontWeight: '500', color: '#6b7280' }}>Total Amount: </span>
                                      <span style={{ color: '#059669', fontWeight: '600' }}>{formatCurrency(invoice.totalAmount || 0)}</span>
                                    </div>
                                    {invoice.remark && (
                                      <div>
                                        <span style={{ fontWeight: '500', color: '#6b7280' }}>Remark: </span>
                                        <span style={{ color: '#111827' }}>{invoice.remark}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h5 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                                    Books Ordered ({invoice.orderList?.length || 0} items):
                                  </h5>
                                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                                      <thead>
                                        <tr style={{ backgroundColor: '#e5e7eb' }}>
                                          <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #d1d5db', fontWeight: '500', color: '#374151' }}>Book Name</th>
                                          <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #d1d5db', fontWeight: '500', color: '#374151' }}>Author</th>
                                          <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #d1d5db', fontWeight: '500', color: '#374151' }}>Qty</th>
                                          <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #d1d5db', fontWeight: '500', color: '#374151' }}>MRP</th>
                                          <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #d1d5db', fontWeight: '500', color: '#374151' }}>Discount</th>
                                          <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #d1d5db', fontWeight: '500', color: '#374151' }}>Base Price</th>
                                          <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #d1d5db', fontWeight: '500', color: '#374151' }}>GST%</th>
                                    
                        
                                          <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #d1d5db', fontWeight: '500', color: '#374151' }}>Price</th>
                                          <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #d1d5db', fontWeight: '500', color: '#374151' }}>Amount Before Tax</th>
                                          
                                          <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #d1d5db', fontWeight: '500', color: '#374151' }}>GST Amt</th>
                                          <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #d1d5db', fontWeight: '500', color: '#374151' }}>Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {invoice.orderList?.map((order, index) => (
                                          <tr key={order.orderId || index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '0.5rem', color: '#111827' }}>{order.bookName || 'N/A'}</td>
                                            <td style={{ padding: '0.5rem', color: '#6b7280' }}>{order.authorName || 'Unknown'}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center', color: '#111827' }}>{order.quantity || 0}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right', color: '#6b7280' }}>₹{order.mrp || 0}</td>
                                         
                                            <td style={{ padding: '0.5rem', textAlign: 'right', color: order.discount > 0 ? '#059669' : '#6b7280' }}>
                                              {order.discount > 0 ? `${order.discount}%` : '-'}
                                            </td>

                                            <td style={{ padding: '0.5rem', textAlign: 'right', color: '#111827' }}>₹{order.basePrice || 0}</td>

                                            <td style={{ padding: '0.5rem', textAlign: 'center', color: '#6b7280' }}>{order.gstPercentage || 0}%</td>
                                       
                                       

                                            <td style={{ padding: '0.5rem', textAlign: 'right', color: '#111827' }}>₹{order.price || 0}</td>
                                            
                                            <td style={{ padding: '0.5rem', textAlign: 'right', color: '#111827' }}>₹{order.amountBeforeTax || 0}</td>
                                       
                                            <td style={{ padding: '0.5rem', textAlign: 'right', color: '#7c3aed' }}>₹{order.gstPaid || 0}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right', color: '#111827', fontWeight: '500' }}>₹{order.totalAmount || 0}</td>
                                          </tr>
                                        )) || (
                                          <tr>
                                            <td colSpan="9" style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                                              No order details available
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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

        {/* Updated Export Information */}
        <div className={styles.exportInfo}>
          <h3 className={styles.exportInfoTitle}>Invoice Summary Export Information</h3>
          <div className={styles.exportInfoList}>
            <p>• <strong>Summary Export:</strong> Exports only invoice summary data without detailed book information</p>
            <p>• <strong>Key Fields Included:</strong> Invoice ID, Customer details, Address, Total amounts, Payment & Order status</p>
            <p>• <strong>Financial Summary:</strong> Base amount, Total GST, and Total amount for each invoice</p>
            <p>• <strong>Aggregate Information:</strong> Total items count and total quantity per invoice</p>
            <p>• <strong>Smart Filtering:</strong> Export only filtered data with filter information in filename</p>
            <p>• <strong>Expandable Details:</strong> Click the arrow button in the table to view detailed book information</p>
            <p>• <strong>Indian Format:</strong> Currency in INR format, dates in DD/MM/YYYY format</p>
            <p>• <strong>Optimized Size:</strong> Smaller file size with essential summary information only</p>
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