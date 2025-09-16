import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./CustomerOrderView.module.css";
import { CUSTOMER_ORDER_VIEW_URL } from "../../constants/apiConstants";


const CustomerOrderView = () => {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    
    const {user,token}=getUserData();

    try {
      const response = await axios.post(`${CUSTOMER_ORDER_VIEW_URL}`,
        {
          user,
          token
        }
      );
      if (response.data.status === "SUCCESS") {
        setInvoices(response.data.payload);
      } else {
        setError(response.data.message || "Failed to fetch invoices");
      }
    } catch (e) {
      setError("Network error, please try again later.");
    }
    setLoading(false);
  };

  return (
    <div className={styles.orderViewContainer}>
      <h2 className={styles.heading}>My Orders</h2>
      {loading && <div className={styles.loading}>Loading...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {invoices.length === 0 && !loading && !error && (
        <div className={styles.empty}>No orders found.</div>
      )}

      {invoices.map((invoice) => (
        <div className={styles.invoiceCard} key={invoice.invoiceId}>
          <div className={styles.invoiceHeader}>
            <div>
              <strong>Invoice ID:</strong> {invoice.invoiceId}<br/>
              <strong>Date:</strong> {new Date(invoice.creationDate).toLocaleDateString()}
            </div>
            <div className={`${styles.status} ${styles[invoice.paymentStatus.toLowerCase()]}`}>
              {invoice.paymentStatus}
            </div>
          </div>
          <div className={styles.customerDetails}>
            <strong>Name:</strong> {invoice.customerName}<br/>
            <strong>Address:</strong> {invoice.deliveryAddress}, {invoice.city}, {invoice.state}-{invoice.pincode}<br/>
            <strong>Mobile:</strong> {invoice.mobileNo || invoice.customerRegisteredMobileNo}
          </div>
          <div>
            <strong>Order Status:</strong> <span className={styles[invoice.orderStatus.toLowerCase()]}>{invoice.orderStatus}</span>
          </div>
          <div className={styles.ordersTableWrapper}>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Book</th>
                  <th>Author</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.orderList.map(order => (
                  <tr key={order.orderId}>
                    <td>{order.orderId}</td>
                    <td>{order.bookName}</td>
                    <td>{order.authorName}</td>
                    <td>{order.quantity}</td>
                    <td>₹{order.price.toFixed(2)}</td>
                    <td>₹{order.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.invoiceFooter}>
            <span><strong>Total Amount:</strong> ₹{invoice.totalAmount.toFixed(2)}</span>
            {invoice.remark && <span className={styles.remark}>{invoice.remark}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomerOrderView;
