import React from "react";
import styles from './CodegramHomePage.module.css';
import src from './fullLogo.png';

export default function CodegramHomePage() {
  const handleFormRedirect = () => {
    // Replace this URL with your actual Google Form URL
    window.open('https://forms.gle/jFBzvb2aCsDmswk58', '_blank');
  };

  return (
    <>
      {/* Bootstrap CSS CDN */}
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css"
        rel="stylesheet"
      />
      
      <div className={styles.container}>
        <div className={styles.maxWidth}>
          {/* Header Section */}
          <div className={styles.header}>
            <div className={styles.logoContainer}>
              <div className={styles.logoInner}>
                <img
                  src={src}
                  alt="CodeGram Logo"
                  className={styles.logoImage}
                />
              </div>
            </div>
            <h1 className={styles.mainTitle}>CODEGRAM</h1>
            <p className={styles.subtitle}>Project-Oriented Corporate Training</p>
            <div className={styles.divider}></div>
          </div>

          {/* Hook Section */}
          <div className={styles.hookSection}>
            {/* Refund Strip with 3D Folded Effect */}
            <div className={styles.refundStrip}>
              <span>Enjoy 100% Refund</span>
            </div>
            
            <div className={styles.hookDecoration}>🎯</div>
            <div className={styles.hookBadge}>Self-paced IT courses</div>
            <h2 className={styles.hookTitle}>
              Invest <span className={styles.hookHighlight}>₹799</span> for upskilling
            </h2>
            
            <div className={styles.joinBtn} onClick={handleFormRedirect}>💥 Join the Waiting List Now</div>

            
            <p className={styles.hookDescription}>
              Students who sign up early will get priority access and an exclusive discount when we launch as they will learn from industry experts, get a 100% refund on course completion, build real-world projects and crack top IT interviews
            </p>
            <h4 className={styles.hookSubtitle}>
              Don't miss your chance to be part of the Codegram Early Access Club.
            </h4>
            <div className={styles.hookFeatures}>
              <div className={styles.hookFeature}>
                <div className={styles.hookFeatureIcon}>🎯</div>
                <div className={styles.hookFeatureText}>Quality<br/>Assured</div>
              </div>
              <div className={styles.hookFeature}>
                <div className={styles.hookFeatureIcon}>💼</div>
                <div className={styles.hookFeatureText}>Career<br/>Focused</div>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className={styles.heroSection}>
            <h2 className={styles.heroTitle}>
              Master the Skills That <span className={styles.heroHighlight}>Matter</span>
            </h2>
            <p className={styles.heroText}>
              Learn all the courses with real-world projects designed to boost your career. 
              CODEGRAM offers focused training for software professionals and students.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className={styles.mainGrid}>
            {/* Courses Section */}
            <div className={styles.coursesContainer}>
              {/* Java Course */}
              <div className={styles.courseCard}>
                <div className={styles.courseHeader}>
                  <div className={`${styles.courseIcon} ${styles.javaIcon}`}>
                    <span>J</span>
                  </div>
                  <h3 className={styles.courseTitle}>Java Development</h3>
                </div>
                <p className={styles.courseText}>
                  Master Core Java, OOPs, JDBC, Servlets, JSP, and Spring Framework. Build enterprise applications with hands-on projects.
                </p>
                <div className={styles.tagContainer}>
                  <span className={`${styles.tag} ${styles.tagOrange}`}>Core Java</span>
                  <span className={`${styles.tag} ${styles.tagBlue}`}>Advance Java</span>
                  <span className={`${styles.tag} ${styles.tagRed}`}>Java Framework</span>
             
                </div>
              </div>

              {/* React Course */}
              <div className={styles.courseCard}>
                <div className={styles.courseHeader}>
                  <div className={`${styles.courseIcon} ${styles.reactIcon}`}>
                    <span>R</span>
                  </div>
                  <h3 className={styles.courseTitle}>React Redux Frontend</h3>
                </div>
                <p className={styles.courseText}>
                  Master modern frontend development with React.js. Learn components, Hooks, State Management, and API integration.
                </p>
                <div className={styles.tagContainer}>
                  <span className={`${styles.tag} ${styles.tagBlue}`}>React.js</span>
                  <span className={`${styles.tag} ${styles.tagCyan}`}>Hooks</span>
                  <span className={`${styles.tag} ${styles.tagGreen}`}>APIs</span>
                </div>
              </div>
            </div>

            {/* Why Choose Us Sidebar */}
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>Why CODEGRAM?</h3>
              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <div className={`${styles.featureIcon} ${styles.greenIcon}`}>
                    <span>✓</span>
                  </div>
                  <span className={styles.featureText}>Project-Based Learning</span>
                </div>
                <div className={styles.featureItem}>
                  <div className={`${styles.featureIcon} ${styles.blueIcon}`}>
                    <span>✓</span>
                  </div>
                  <span className={styles.featureText}>Expert Trainers</span>
                </div>
                <div className={styles.featureItem}>
                  <div className={`${styles.featureIcon} ${styles.purpleIcon}`}>
                    <span>✓</span>
                  </div>
                  <span className={styles.featureText}>Certification</span>
                </div>
                <div className={styles.featureItem}>
                  <div className={`${styles.featureIcon} ${styles.orangeIcon}`}>
                    <span>✓</span>
                  </div>
                  <span className={styles.featureText}>Interview Assistance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className={styles.bottomGrid}>
            {/* Testimonials */}
            <div className={styles.testimonialCard}>
              <h4 className={styles.testimonialTitle}>Student Success</h4>
              <div>
                <p className={styles.testimonialText}>
                  "The Java training helped me land my first developer job!"
                </p>
                <p className={styles.testimonialText}>
                  "CODEGRAM made technical learning fun and job-focused."
                </p>
              </div>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={styles.star}>★</span>
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <div className={styles.contactCard}>
              <h4 className={styles.contactTitle}>Ready to Start?</h4>
              <button 
                className={styles.enrollButton}
                onClick={handleFormRedirect}
              >
                Join wait list 📝
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              © 2025 CODEGRAM. Empowering careers through quality education.
            </p>
          </div>
        </div>
      </div>

      {/* Bootstrap JS CDN */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js"></script>
    </>
  );
}