import React from 'react';
import styles from './ReturnPolicy.module.css';

const ReturnPolicy = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Return Policy</h1>
          <p className={styles.lastUpdated}>Last updated: September 16, 2025</p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Introduction</h2>
          <p className={styles.text}>
            At ShahKart, we want you to be completely satisfied with your book purchase. Our return policy 
            is designed to ensure a fair and transparent process for both our customers and our business. 
            Please read the following terms carefully to understand our return procedures and conditions.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Return Timeframe</h2>
          <div className={styles.highlightBox}>
            <h3 className={styles.highlightTitle}>24-Hour Return Window</h3>
            <p className={styles.highlightText}>
              Return requests must be initiated within <strong>24 hours after delivery</strong> of your order. 
              This timeframe begins from the moment the package is marked as delivered by our shipping partner.
            </p>
          </div>
          <p className={styles.text}>
            We recommend inspecting your books immediately upon delivery to ensure they meet your expectations. 
            If you need to return an item, please contact our customer service team as soon as possible within 
            the 24-hour window.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Return Conditions</h2>
          <p className={styles.text}>
            To be eligible for a return, your books must meet the following conditions:
          </p>
          
          <div className={styles.conditionGrid}>
            <div className={styles.acceptedCondition}>
              <h4 className={styles.conditionTitle}>✓ Acceptable Returns</h4>
              <ul className={styles.conditionList}>
                <li>Books in original, unread condition</li>
                <li>All packaging materials included</li>
                <li>No writing, highlighting, or markings</li>
                <li>No bent or folded pages</li>
                <li>Original invoice or order confirmation</li>
                <li>Books with manufacturing defects</li>
                <li>Wrong item delivered</li>
              </ul>
            </div>

            <div className={styles.rejectedCondition}>
              <h4 className={styles.conditionTitle}>✗ Non-Returnable Items</h4>
              <ul className={styles.conditionList}>
                <li><strong>Books with tampering or damage</strong></li>
                <li><strong>Liquid damage of any kind</strong></li>
                <li>Books with excessive wear</li>
                <li>Missing or damaged packaging</li>
                <li>Books older than 24 hours post-delivery</li>
                <li>Digital downloads or e-books</li>
                <li>Personalized or customized items</li>
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Delivery Charges</h2>
          <div className={styles.importantNotice}>
            <h3 className={styles.noticeTitle}>Important: Customer Responsibility</h3>
            <p className={styles.noticeText}>
              <strong>Delivery charges will be applicable and borne by the customer only.</strong> This includes:
            </p>
            <ul className={styles.chargesList}>
              <li>Original delivery charges (non-refundable)</li>
              <li>Return shipping costs</li>
              <li>Any additional handling fees</li>
            </ul>
            <p className={styles.noticeText}>
              These charges will be deducted from your refund amount or charged separately, 
              depending on the payment method used for your original purchase.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How to Initiate a Return</h2>
          <div className={styles.processSteps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h4 className={styles.stepTitle}>Contact Us</h4>
                <p className={styles.stepText}>
                  Contact our customer service team within 24 hours of delivery via email, phone, or chat.
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h4 className={styles.stepTitle}>Provide Details</h4>
                <p className={styles.stepText}>
                  Share your order number, reason for return, and photos of the item if there's a quality issue.
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h4 className={styles.stepTitle}>Get Approval</h4>
                <p className={styles.stepText}>
                  Our team will review your request and provide a Return Authorization Number (RAN) if approved.
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h4 className={styles.stepTitle}>Pack & Ship</h4>
                <p className={styles.stepText}>
                  Pack the item securely with all original materials and ship using the provided return label.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Refund Process</h2>
          <p className={styles.text}>
            Once we receive and inspect your returned item, we will process your refund according to the following timeline:
          </p>
          <ul className={styles.list}>
            <li><strong>Inspection:</strong> 2-3 business days after we receive the item</li>
            <li><strong>Refund Processing:</strong> 3-5 business days after approval</li>
            <li><strong>Bank Processing:</strong> 5-7 business days (depending on your bank)</li>
          </ul>
          <p className={styles.text}>
            Refunds will be processed to the original payment method. Delivery charges and return shipping costs 
            will be deducted from the refund amount as per our policy.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Exchanges</h2>
          <p className={styles.text}>
            We currently do not offer direct exchanges. If you need a different book, please initiate a return 
            for the original item and place a new order for the desired book. This ensures faster processing 
            and better inventory management.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Damaged or Defective Items</h2>
          <p className={styles.text}>
            If you receive a book that is damaged during shipping or has manufacturing defects:
          </p>
          <ul className={styles.list}>
            <li>Contact us immediately with photos of the damage</li>
            <li>We will expedite the return process</li>
            <li>Return shipping will be covered by ShahKart</li>
            <li>Priority processing for replacement or refund</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact Information</h2>
          <p className={styles.text}>
            For return requests or questions about our return policy, please contact us:
          </p>
          <div className={styles.contact}>
            <div className={styles.contactMethod}>
              <h4 className={styles.contactTitle}>Email</h4>
              <p className={styles.contactDetail}>returns@shahkart.com</p>
              <p className={styles.contactNote}>Response within 4-6 hours</p>
            </div>
            <div className={styles.contactMethod}>
              <h4 className={styles.contactTitle}>Phone</h4>
              <p className={styles.contactDetail}>+91-XXX-XXXXXXX</p>
              <p className={styles.contactNote}>Mon-Sat: 9 AM - 7 PM</p>
            </div>
            <div className={styles.contactMethod}>
              <h4 className={styles.contactTitle}>Live Chat</h4>
              <p className={styles.contactDetail}>Available on website</p>
              <p className={styles.contactNote}>Mon-Sat: 9 AM - 7 PM</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Important Notes</h2>
          <div className={styles.notesList}>
            <div className={styles.note}>
              <strong>Quality Assurance:</strong> All returned books are thoroughly inspected before refund approval.
            </div>
            <div className={styles.note}>
              <strong>Packaging:</strong> Please use adequate packaging to prevent damage during return shipping.
            </div>
            <div className={styles.note}>
              <strong>Tracking:</strong> Always use a trackable shipping method for returns to avoid disputes.
            </div>
            <div className={styles.note}>
              <strong>Policy Changes:</strong> This return policy may be updated periodically. Check our website for the latest version.
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <p className={styles.footerText}>
            By making a purchase on ShahKart, you agree to our Return Policy terms and conditions. 
            We appreciate your understanding and cooperation in following these guidelines.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ReturnPolicy;