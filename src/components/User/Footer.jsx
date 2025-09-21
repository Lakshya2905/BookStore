import React from "react";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaLinkedinIn } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FaXTwitter } from "react-icons/fa6";
import Logo from "../images/logo.jpg";
import styles from "./Footer.module.css";
import BookDescription from "./BookDescription";

const Footer = () => {
  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.container}>
          
          {/* Logo Section */}
          <div className={styles.logoSection}>
            <img src={Logo} alt="ShaahKart Logo" className={styles.logo} />
            <p className={styles.tagline}>India's Trusted Online Shopping Store</p>
          </div>

          {/* Company Links */}
          <div>
            <h3 className={styles.title}>Company</h3>
            <ul className={styles.list}>
              <li><a href="/about">About Us</a></li>
              <li><a href="/shop">Shop</a></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className={styles.title}>Policies</h3>
            <ul className={styles.list}>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/return">Return Policy</a></li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className={styles.title}>Follow Us</h3>
            <div className={styles.social}>
              <a href="https://www.facebook.com/share/1B952Jg8uE/" target="_blank" rel="noopener noreferrer">
                <FaFacebookF />
              </a>
              <a href="https://www.instagram.com/shaahkart?igsh=NTRleWtpcXBmOTJ2" target="_blank" rel="noopener noreferrer">
                <FaInstagram />
              </a>
              <a href="https://wa.link/wac1at" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp />
              </a>
              <a href="https://x.com/ShaahKart?t=VhJw-WVEfA2k-dYMdHBdog&s=08" target="_blank" rel="noopener noreferrer">
                <FaXTwitter />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p>Copyright © 2025. ShaahKart.com. All rights reserved.</p>
        </div>

        {/* Developer Credit Section */}
        <div className={styles.developerCredit}>
          <p className={styles.developerText}>Designed & Developed By <strong>Mehul Jain</strong></p>
          <div className={styles.developerContact}>
        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=mehuljain1590@gmail.com" target="_blank" rel="noopener noreferrer" title="Email">
              <MdEmail />
            </a>
            <a href="https://www.linkedin.com/in/mehul-jain-765529227/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
              <FaLinkedinIn />
            </a>
            <a href="https://wa.link/srf9l9" target="_blank" rel="noopener noreferrer" title="WhatsApp">
              <FaWhatsapp />
            </a>
          </div>
          <div className={styles.contactInfo}>
            <p className={styles.phoneNumber}>+919644344129 | mehuljain1590@gmail.com</p>
          
          </div>
        </div>
      </footer>

      <div className={styles.bookDescription}>
        <BookDescription />
      </div>
    </>
   
  );
};

export default Footer;