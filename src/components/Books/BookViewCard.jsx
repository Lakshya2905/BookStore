import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./BookViewCard.module.css";

const BookViewCard = ({ books = [], loading, error, showPagination = true }) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search");
  const categoryFilter = searchParams.get("category");
  const tagFilter = searchParams.get("tag");
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 12;

  // 🔹 Load stored books from sessionStorage if no props given
  const storedBooks = useMemo(() => {
    try {
      const saved = sessionStorage.getItem("allBooks");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading books from sessionStorage:", e);
      return [];
    }
  }, []);

  // Decide which set of books to use
  const sourceBooks = books.length > 0 ? books : storedBooks;

  // 🔍 Apply search + filters
  const filteredBooks = useMemo(() => {
    let filtered = sourceBooks || [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.bookName?.toLowerCase().includes(query) ||
          book.authorName?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(
        (book) => book.bookCategory?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (tagFilter) {
      filtered = filtered.filter((book) =>
        book.bookTags?.some(
          (tag) => tag.toLowerCase() === tagFilter.toLowerCase()
        )
      );
    }

    return filtered;
  }, [sourceBooks, searchQuery, categoryFilter, tagFilter]);

  // Pagination logic
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = showPagination
    ? filteredBooks.slice(indexOfFirstBook, indexOfLastBook)
    : filteredBooks;
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  if (loading) return <p>Loading books...</p>;
  if (error) return <p>Error loading books.</p>;

  return (
    <div className={styles.container}>
      {filteredBooks.length === 0 ? (
        <p>No books found.</p>
      ) : (
        <>
          <div className={styles.grid}>
            {currentBooks.map((book) => (
              <div key={book.bookId} className={styles.card}>
                <div className={styles.imageWrapper}>
                  <img
                    src={book.coverImageUrl || "/default-book.png"}
                    alt={book.bookName}
                    className={styles.image}
                  />
                </div>
                <div className={styles.details}>
                  <h3 className={styles.title}>{book.bookName}</h3>
                  <p className={styles.author}>by {book.authorName}</p>
                  <p className={styles.price}>₹{book.price}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {showPagination && totalPages > 1 && (
            <div className={styles.pagination}>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  className={`${styles.pageButton} ${
                    currentPage === index + 1 ? styles.active : ""
                  }`}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BookViewCard;
