import React from "react";
import styles from "./BookDescription.module.css";

const BookDescription = () => {
  return (
    <div className={styles.postFooter}>
      <div className={styles.container}>
        
        {/* Bestseller Books */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Bestseller Books</h3>
          <div className={styles.content}>
            <span>Engineering Books</span> | <span>Medical Books</span> | <span>NCERT Books</span> | <span>CBSE Books</span> | <span>ICSE Books</span> | <span>State Board Books</span> | <span>Competitive Exam Books</span> | <span>JEE Mains Books</span> | <span>NEET Books</span> | <span>UPSC Books</span> | <span>SSC Books</span> | <span>Banking Exam Books</span> | <span>Railway Exam Books</span> | <span>Defense Exam Books</span> | <span>Teaching Exam Books</span> | <span>Law Books</span> | <span>MBA Books</span> | <span>CA Books</span> | <span>CS Books</span> | <span>CMA Books</span> | <span>Literature Books</span> | <span>Fiction Books</span> | <span>Self Help Books</span> | <span>Biography Books</span> | <span>History Books</span> | <span>Science Books</span> | <span>Mathematics Books</span> | <span>Physics Books</span> | <span>Chemistry Books</span> | <span>Biology Books</span>
          </div>
        </div>

        {/* Popular Categories */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Popular Categories</h3>
          <div className={styles.content}>
            <span>Class 1st Books</span> | <span>Class 2nd Books</span> | <span>Class 3rd Books</span> | <span>Class 4th Books</span> | <span>Class 5th Books</span> | <span>Class 6th Books</span> | <span>Class 7th Books</span> | <span>Class 8th Books</span> | <span>Class 9th Books</span> | <span>Class 10th Books</span> | <span>Class 11th Books</span> | <span>Class 12th Books</span> | <span>Graduation Books</span> | <span>Post Graduation Books</span> | <span>Professional Books</span> | <span>Technical Books</span> | <span>Reference Books</span> | <span>Dictionary</span> | <span>Atlas</span> | <span>Encyclopedia</span> | <span>Children Books</span> | <span>Comic Books</span> | <span>Story Books</span> | <span>Novel Books</span> | <span>Poetry Books</span> | <span>Religious Books</span> | <span>Philosophy Books</span> | <span>Psychology Books</span> | <span>Sociology Books</span>
          </div>
        </div>

        {/* Top Searches */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Top Searches on ShaahKart</h3>
          <div className={styles.content}>
            <span>buy books online</span> | <span>best books online</span> | <span>cheap books online</span> | <span>discount books</span> | <span>textbooks online</span> | <span>ncert books online</span> | <span>cbse books online</span> | <span>icse books online</span> | <span>competitive books online</span> | <span>jee books online</span> | <span>neet books online</span> | <span>upsc books online</span> | <span>ssc books online</span> | <span>banking books online</span> | <span>railway books online</span> | <span>engineering books online</span> | <span>medical books online</span> | <span>law books online</span> | <span>mba books online</span> | <span>ca books online</span> | <span>cs books online</span> | <span>fiction books online</span> | <span>novel books online</span> | <span>self help books online</span> | <span>children books online</span> | <span>comic books online</span> | <span>story books online</span> | <span>religious books online</span> | <span>philosophy books online</span> | <span>books with free delivery</span>
          </div>
        </div>

        {/* About ShaahKart */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>ShaahKart - The Bestseller of Books Online</h3>
          <div className={styles.aboutContent}>
            <p>
              ShaahKart is one of the best and only online store dedicated to books of all genres. Are you looking for books at affordable prices then you are at the exact spot. ShaahKart is in the field of distribution of books from 5+ years. Today, E-commerce platform changing the shopping experiences of people by providing them easy access to their choices on the fingertips. Here you can buy all kinds of books online. So, go ahead to explore and buy a wide range of books at the most exciting deals. We believe in the best customer experience so we also have all command on flexible home deliveries all over India. You can grab special offers on all kinds of academic and competitive books. All the books you will buy are 100% original editions. ShaahKart provides you access to more than 50 thousand+ books at the lowest prices.
            </p>
          </div>
        </div>

        {/* Online Books Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Online Books - Get special offers on all books. Pick your choices according to your requirements and course demands. We provide categorized recommendations of your course book requirements.</h3>
        </div>

        {/* Trending Books */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Trending books on high demand</h3>
          <div className={styles.content}>
            These are popular textbooks for academic studies, competitive exam books for various government exams, professional course books, fiction and non-fiction books, self-help books, children's books, religious books, technical books for engineering and medical students.
          </div>
        </div>

      </div>
    </div>
  );
};

export default BookDescription;