import React from "react";
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import logo from "../images/logo.jpg";
import styles from "./Footer.module.css";
import  Logo  from "../images/logo.jpg";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <img src={Logo} alt="ShaahKart Logo" className={styles.logo} />
          <p className={styles.tagline}>India’s Trusted Online Shopping Store</p>
        </div>

        {/* Company Links */}
        <div>
          <h3 className={styles.title}>Company</h3>
          <ul className={styles.list}>
            <li><a href="/about">About Us</a></li>
            <li><a href="/shop">Shop</a></li>
            <li><a href="/signin">Sign In</a></li>
            <li><a href="/signup">Sign Up</a></li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h3 className={styles.title}>Policies</h3>
          <ul className={styles.list}>
            <li><a href="/terms">Terms and Condition</a></li>
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
    </footer>
  );
};

export default Footer;
