import React from 'react';
import styles from './Privacy.module.css';

const Privacy = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Last updated: September 16, 2025</p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Introduction</h2>
          <p className={styles.text}>
            Welcome to ShahKart ("we," "our," or "us"). We are committed to protecting your privacy and ensuring 
            the security of your personal information. This Privacy Policy explains how we collect, use, disclose, 
            and safeguard your information when you visit our website and use our services.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Information We Collect</h2>
          
          <h3 className={styles.subTitle}>Personal Information</h3>
          <p className={styles.text}>
            When you create an account, make a purchase, or contact us, we may collect:
          </p>
          <ul className={styles.list}>
            <li>Name and contact information (email address, phone number, mailing address)</li>
            <li>Payment information (credit card details, billing address)</li>
            <li>Account credentials (username, password)</li>
            <li>Purchase history and preferences</li>
          </ul>

          <h3 className={styles.subTitle}>Automatically Collected Information</h3>
          <ul className={styles.list}>
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage data (pages visited, time spent, search queries)</li>
            <li>Cookies and similar tracking technologies</li>
            <li>Location information (if you enable location services)</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How We Use Your Information</h2>
          <p className={styles.text}>We use your information to:</p>
          <ul className={styles.list}>
            <li>Process and fulfill your orders</li>
            <li>Provide customer support and respond to inquiries</li>
            <li>Send you important updates about your account and orders</li>
            <li>Personalize your shopping experience and recommend books</li>
            <li>Improve our website and services</li>
            <li>Send marketing communications (with your consent)</li>
            <li>Prevent fraud and ensure security</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Information Sharing</h2>
          <p className={styles.text}>
            We do not sell or rent your personal information to third parties. We may share your information with:
          </p>
          <ul className={styles.list}>
            <li><strong>Service Providers:</strong> Third-party companies that help us operate our business</li>
            <li><strong>Payment Processors:</strong> To process your transactions securely</li>
            <li><strong>Shipping Partners:</strong> To deliver your orders</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Data Security</h2>
          <p className={styles.text}>
            We implement appropriate technical and organizational measures to protect your personal information 
            against unauthorized access, alteration, disclosure, or destruction. This includes:
          </p>
          <ul className={styles.list}>
            <li>SSL encryption for data transmission</li>
            <li>Secure payment processing systems</li>
            <li>Regular security audits and updates</li>
            <li>Limited access to personal information by authorized personnel</li>
            <li>Data backup and recovery procedures</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Rights and Choices</h2>
          <p className={styles.text}>You have the right to:</p>
          <ul className={styles.list}>
            <li><strong>Access:</strong> Request a copy of your personal information</li>
            <li><strong>Update:</strong> Correct or update your personal information</li>
            <li><strong>Delete:</strong> Request deletion of your personal information</li>
            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            <li><strong>Portability:</strong> Request transfer of your data to another service</li>
            <li><strong>Object:</strong> Object to certain types of data processing</li>
          </ul>
          <p className={styles.text}>
            To exercise these rights, please contact us at privacy@shahkart.com or use the account settings 
            in your user dashboard.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Cookies and Tracking</h2>
          <p className={styles.text}>
            We use cookies and similar technologies to enhance your browsing experience. You can control 
            cookies through your browser settings, but disabling them may affect website functionality.
          </p>
          <div className={styles.cookieTypes}>
            <h4 className={styles.cookieTitle}>Essential Cookies</h4>
            <p className={styles.cookieDesc}>Required for basic website functionality</p>
            
            <h4 className={styles.cookieTitle}>Analytics Cookies</h4>
            <p className={styles.cookieDesc}>Help us understand how visitors use our website</p>
            
            <h4 className={styles.cookieTitle}>Marketing Cookies</h4>
            <p className={styles.cookieDesc}>Used to deliver relevant advertisements</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Children's Privacy</h2>
          <p className={styles.text}>
            Our services are not directed to children under 13. We do not knowingly collect personal 
            information from children under 13. If we become aware that we have collected such information, 
            we will take steps to delete it promptly.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Data Retention</h2>
          <p className={styles.text}>
            We retain your personal information for as long as necessary to fulfill the purposes outlined 
            in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. 
            Account information is typically retained for 7 years after account closure.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Changes to This Policy</h2>
          <p className={styles.text}>
            We may update this Privacy Policy from time to time. We will notify you of any material 
            changes by posting the new policy on this page and updating the "Last updated" date. 
            We encourage you to review this policy periodically.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact Us</h2>
          <p className={styles.text}>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <div className={styles.contact}>
            <p><strong>Email:</strong> privacy@shahkart.com</p>
            <p><strong>Address:</strong> ShahKart Privacy Team, Indore, Madhya Pradesh, India</p>
            <p><strong>Phone:</strong> +91-XXX-XXXXXXX</p>
          </div>
        </section>

        <footer className={styles.footer}>
          <p className={styles.footerText}>
            By using our website and services, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Privacy;