import React, { useState, useEffect } from 'react';
import { FileText, Download, Loader, AlertCircle, CheckCircle, FileSpreadsheet, Filter, CreditCard, Truck, Package, X, Eye, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import styles from './InvoiceExportPage.module.css';
import { INVOICE_ADMIN_FETCH_URL, UPDATE_PAYMENT_URL, UPDATE_ORDER_STATUS_URL } from '../../constants/apiConstants';

// Invoice Detail Modal Component
const InvoiceDetailModal = ({ isOpen, onClose, invoice, onMarkPaid, onDispatch, onDelivered, onCancel, actionLoading }) => {
  if (!isOpen || !invoice) return null;

  const getAvailableActions = (invoice) => {
    const actions = [];
    
    if (invoice.orderStatus !== 'CANCELLED' && invoice.paymentStatus === 'DUE') {
      actions.push({
        type: 'payment',
        label: 'Mark Paid',
        icon: CreditCard,
        handler: () => onMarkPaid(invoice.invoiceId),
        variant: 'success'
      });
    }
    
    if (invoice.orderStatus === 'PENDING') {
      actions.push({
        type: 'dispatch',
        label: 'Dispatch',
        icon: Truck,
        handler: () => onDispatch(invoice.invoiceId),
        variant: 'primary'
      });
      actions.push({
        type: 'cancel',
        label: 'Cancel',
        icon: X,
        handler: () => onCancel(invoice.invoiceId),
        variant: 'danger'
      });
    }
    
    if (invoice.orderStatus === 'DISPATCHED') {
      actions.push({
        type: 'delivered',
        label: 'Delivered',
        icon: Package,
        handler: () => onDelivered(invoice.invoiceId),
        variant: 'success'
      });
      actions.push({
        type: 'cancel',
        label: 'Cancel',
        icon: X,
        handler: () => onCancel(invoice.invoiceId),
        variant: 'danger'
      });
    }
    
    return actions;
  };

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

  const isActionLoading = (invoiceId) => {
    if (!invoiceId) return false;
    return Object.keys(actionLoading).some(key => 
      key.includes(invoiceId.toString()) && actionLoading[key]
    );
  };

  const availableActions = getAvailableActions(invoice);

  return (
    <div className={styles.detailModalOverlay} onClick={onClose}>
      <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.detailModalHeader}>
          <div>
            <h2 className={styles.detailModalTitle}>Invoice Details #{invoice.invoiceId}</h2>
            <p className={styles.detailModalSubtitle}>
              Created on {new Date(invoice.creationDate).toLocaleDateString('en-IN')}
            </p>
          </div>
          <button className={styles.detailModalCloseButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.detailModalBody}>
          {/* Customer Information */}
          <div className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>Customer Information</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Name:</span>
                <span className={styles.detailValue}>{invoice.customerName}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Mobile:</span>
                <span className={styles.detailValue}>{invoice.mobileNo}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>City:</span>
                <span className={styles.detailValue}>{invoice.city}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>State:</span>
                <span className={styles.detailValue}>{invoice.state}</span>
              </div>
              <div className={styles.detailItemRow}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Pincode:</span>
                  <span className={styles.detailValue}>{invoice.pincode}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Delivery Address:</span>
                  <span className={styles.detailValue}>{invoice.deliveryAddress || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status & Payment */}
          <div className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>Status & Payment</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Payment Status:</span>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(invoice.paymentStatus, 'payment')}`}>
                  {invoice.paymentStatus}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Order Status:</span>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(invoice.orderStatus, 'order')}`}>
                  {invoice.orderStatus}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Base Amount:</span>
                <span className={styles.detailValue}>{formatCurrency(invoice.baseAmount)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Total GST:</span>
                <span className={styles.detailValue}>{formatCurrency(invoice.totalGstPaid)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Total Amount:</span>
                <span className={styles.detailValueHighlight}>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              {invoice.remark && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Remark:</span>
                  <span className={styles.detailValue}>{invoice.remark}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>
              Books Ordered ({invoice.orderList?.length || 0} items)
            </h3>
            <div className={styles.orderItemsContainer}>
              {invoice.orderList && invoice.orderList.length > 0 ? (
                <div className={styles.orderItemsTable}>
                  <table className={styles.orderTable}>
                    <thead>
                      <tr>
                        <th>Book Name</th>
                        <th>Author</th>
                        <th>Qty</th>
                        <th>MRP</th>
                        <th>Discount</th>
                        <th>Base Price</th>
                        <th>GST%</th>
                        <th>Price</th>
                        <th>Amount Before Tax</th>
                        <th>GST Amount</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.orderList.map((order, index) => (
                        <tr key={order.orderId || index}>
                          <td>{order.bookName || 'N/A'}</td>
                          <td>{order.authorName || 'Unknown'}</td>
                          <td>{order.quantity || 0}</td>
                          <td>₹{order.mrp || 0}</td>
                          <td>{order.discount > 0 ? `${order.discount}%` : '-'}</td>
                          <td>₹{order.basePrice || 0}</td>
                          <td>{order.gstPercentage || 0}%</td>
                          <td>₹{order.price || 0}</td>
                          <td>₹{order.amountBeforeTax || 0}</td>
                          <td>₹{order.gstPaid || 0}</td>
                          <td><strong>₹{order.totalAmount || 0}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.noOrderItems}>
                  No order details available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons Footer */}
        {availableActions.length > 0 && (
          <div className={styles.detailModalFooter}>
            <h3 className={styles.detailActionTitle}>Available Actions</h3>
            <div className={styles.detailActionButtons}>
              {availableActions.map(action => {
                const Icon = action.icon;
                const isLoading = actionLoading[`${action.type}-${invoice.invoiceId}`];
                
                return (
                  <button
                    key={action.type}
                    onClick={action.handler}
                    disabled={isLoading || isActionLoading(invoice.invoiceId)}
                    className={`${styles.detailActionButton} ${styles[`detailActionButton${action.variant.charAt(0).toUpperCase() + action.variant.slice(1)}`]}`}
                  >
                    {isLoading ? (
                      <Loader className={styles.detailActionButtonSpinner} />
                    ) : (
                      <Icon className={styles.detailActionButtonIcon} />
                    )}
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Remark Modal Component (unchanged)
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

  // Detail modal state
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    invoice: null
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    paymentStatus: 'All',
    orderStatus: 'All',
    startDate: '',
    endDate: ''
  });

  const paymentStatusOptions = ['All', 'DUE', 'PAID'];
  const orderStatusOptions = ['All', 'PENDING', 'DISPATCHED', 'CANCELLED', 'DELIVERED'];

  // Open detail modal
  const openDetailModal = (invoice) => {
    setDetailModal({ isOpen: true, invoice });
  };

  // Close detail modal
  const closeDetailModal = () => {
    setDetailModal({ isOpen: false, invoice: null });
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
        closeDetailModal(); // Close detail modal on success
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
        closeDetailModal(); // Close detail modal on success
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

    // Date range filter
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.creationDate);
        invoiceDate.setHours(0, 0, 0, 0);
        return invoiceDate >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.creationDate);
        return invoiceDate <= endDate;
      });
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
      orderStatus: 'All',
      startDate: '',
      endDate: ''
    });
  };

  // Calculate revenue and GST excluding cancelled orders
  const getRevenueStats = () => {
    const nonCancelledInvoices = filteredInvoices.filter(inv => inv.orderStatus !== 'CANCELLED');
    const totalRevenue = nonCancelledInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalGST = nonCancelledInvoices.reduce((sum, inv) => sum + (inv.totalGstPaid || 0), 0);
    
    return { totalRevenue, totalGST, nonCancelledInvoices };
  };

  // Prepare data for Excel export - ONLY SUMMARY
  const prepareSummaryExcelData = () => {
    const excelData = [];
    const { nonCancelledInvoices } = getRevenueStats();
    
    filteredInvoices.forEach(invoice => {
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
    
    // Add Revenue and GST Collection summary
    const { totalRevenue, totalGST } = getRevenueStats();
    excelData.push({});
    excelData.push({
      'Invoice ID': 'SUMMARY',
      'Customer Name': 'Revenue & GST Collection',
      'Mobile No': '(Excluding Cancelled Orders)',
      'Delivery Address': '',
      'City': '',
      'State': '',
      'Pincode': '',
      'Creation Date': '',
      'Base Amount': '',
      'Total GST': `₹${totalGST.toFixed(2)}`,
      'Total Amount': `₹${totalRevenue.toFixed(2)}`,
      'Payment Status': '',
      'Order Status': '',
      'Total Items': '',
      'Total Quantity': '',
      'Remark': `Active Orders: ${nonCancelledInvoices.length}`
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
      
      const workbook = XLSX.utils.book_new();
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      
      summarySheet['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, 
        { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, 
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, 
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Invoice Summary');
      
      const currentDate = new Date().toISOString().split('T')[0];
      let filterSuffix = '';
      if (filters.paymentStatus !== 'All' || filters.orderStatus !== 'All' || filters.startDate || filters.endDate) {
        const filterParts = [];
        if (filters.paymentStatus !== 'All') filterParts.push(`payment_${filters.paymentStatus.toLowerCase()}`);
        if (filters.orderStatus !== 'All') filterParts.push(`order_${filters.orderStatus.toLowerCase()}`);
        if (filters.startDate || filters.endDate) {
          filterParts.push(`date_${filters.startDate || 'start'}_to_${filters.endDate || 'end'}`);
        }
        filterSuffix = `_${filterParts.join('_')}`;
      }
      
      const filename = `invoice_summary_${currentDate}${filterSuffix}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      
      const { totalRevenue, totalGST } = getRevenueStats();
      setSuccess(`Excel file "${filename}" downloaded! Revenue: ${formatCurrency(totalRevenue)}, GST: ${formatCurrency(totalGST)} (${filteredInvoices.length} invoices)`);
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

  const { totalRevenue, totalGST } = getRevenueStats();

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
              <p className={styles.subtitle}>Export invoice summary and manage orders with detailed modal view</p>
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

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <Calendar className={styles.dateIcon} />
                Start Date:
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className={styles.filterDateInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <Calendar className={styles.dateIcon} />
                End Date:
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className={styles.filterDateInput}
                min={filters.startDate}
              />
            </div>
          </div>
          
          <div className={styles.filterSummary}>
            Showing {filteredInvoices.length} of {invoices.length} invoices
            {(filters.paymentStatus !== 'All' || filters.orderStatus !== 'All' || filters.startDate || filters.endDate) && (
              <span className={styles.filterActive}>
                {' '}(Filtered: {[
                  filters.paymentStatus !== 'All' ? `Payment: ${filters.paymentStatus}` : '',
                  filters.orderStatus !== 'All' ? `Order: ${filters.orderStatus}` : '',
                  filters.startDate ? `From: ${new Date(filters.startDate).toLocaleDateString('en-IN')}` : '',
                  filters.endDate ? `To: ${new Date(filters.endDate).toLocaleDateString('en-IN')}` : ''
                ].filter(Boolean).join(', ')})
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
                <p className={styles.statLabel}>Active Revenue</p>
                <p className={styles.statValueCurrency}>
                  {formatCurrency(totalRevenue)}
                </p>
                <p className={styles.statNote}>Excluding cancelled orders</p>
              </div>
              <div className={styles.currencySymbol}>₹</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statContent}>
              <div>
                <p className={styles.statLabel}>Active GST Collected</p>
                <p className={styles.statValuePurple}>
                  {formatCurrency(totalGST)}
                </p>
                <p className={styles.statNote}>Excluding cancelled orders</p>
              </div>
              <div className={styles.itemSymbol}>#</div>
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>Invoice Overview</h2>
            <p className={styles.tableSubtitle}>Click "View Details" to see complete invoice information and perform actions</p>
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
                    <th className={styles.th}>Total Amount</th>
                    <th className={styles.th}>Payment Status</th>
                    <th className={styles.th}>Order Status</th>
                    <th className={styles.th}>Date</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {filteredInvoices.slice(0, 20).map((invoice) => (
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
                        <div className={styles.amountBreakdown}>
                          <div className={styles.amountTotal}>{formatCurrency(invoice.totalAmount)}</div>
                          <div className={styles.amountSubtext}>
                            Base: {formatCurrency(invoice.baseAmount)} + GST: {formatCurrency(invoice.totalGstPaid)}
                          </div>
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
                        <span className={styles.date}>
                          {new Date(invoice.creationDate).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <button
                          onClick={() => openDetailModal(invoice)}
                          className={styles.viewDetailsButton}
                        >
                          <Eye className={styles.viewDetailsIcon} />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredInvoices.length > 20 && (
                <div className={styles.tableFooter}>
                  ... and {filteredInvoices.length - 20} more invoices (showing first 20)
                </div>
              )}
            </div>
          )}
        </div>


      </div>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetailModal}
        invoice={detailModal.invoice}
        onMarkPaid={handleMarkPaymentComplete}
        onDispatch={handleDispatch}
        onDelivered={handleDelivered}
        onCancel={handleCancel}
        actionLoading={actionLoading}
      />

      {/* Remark Modal */}
      <RemarkModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSubmit={modalState.onSubmit}
        title={modalState.title}
        actionType={modalState.actionType}
        invoiceId={modalState.invoiceId}
        isLoading={Object.values(actionLoading).some(loading => loading)}
      />
    </div>
  );
};

export default InvoiceExportPage;