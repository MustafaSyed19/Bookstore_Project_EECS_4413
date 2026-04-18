-- ============================================================
-- BookNest Database Schema
-- Run this file to set up your MySQL database
-- ============================================================

CREATE DATABASE IF NOT EXISTS bookstore;
USE bookstore;

-- ── Users ──
CREATE TABLE IF NOT EXISTS User (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  role ENUM('customer', 'admin') DEFAULT 'customer',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Addresses ──
CREATE TABLE IF NOT EXISTS Address (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  street VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(100),
  country VARCHAR(100),
  zip VARCHAR(20),
  phone VARCHAR(30),
  isDefault BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- ── Books (Product catalog) ──
CREATE TABLE IF NOT EXISTS BOOK (
  id INT AUTO_INCREMENT PRIMARY KEY,
  isbn VARCHAR(20),
  price DECIMAL(10,2) NOT NULL,
  title VARCHAR(255) NOT NULL,
  language VARCHAR(50) DEFAULT 'English',
  pages INT DEFAULT 0,
  description TEXT,
  category VARCHAR(100),
  publisher VARCHAR(100),
  brand VARCHAR(100),
  quantity INT DEFAULT 0,
  imageUrl VARCHAR(500)
);

-- ── Shopping Cart ──
CREATE TABLE IF NOT EXISTS CartItem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  bookId INT NOT NULL,
  quantity INT DEFAULT 1,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (bookId) REFERENCES BOOK(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_item (userId, bookId)
);

-- ── Orders ──
CREATE TABLE IF NOT EXISTS Orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  totalAmount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shippingAddressId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (shippingAddressId) REFERENCES Address(id) ON DELETE SET NULL
);

-- ── Order Items ──
CREATE TABLE IF NOT EXISTS OrderItem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  bookId INT NOT NULL,
  quantity INT NOT NULL,
  priceAtPurchase DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE,
  FOREIGN KEY (bookId) REFERENCES BOOK(id) ON DELETE CASCADE
);


-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin user (password: admin123)
INSERT INTO User (email, passwordHash, firstName, lastName, role) VALUES
('admin@bookstore.com', '$2b$10$ylhTtNoFtCB70hkRE4sEXOKKfkYPMooHrFJCcAPnVwse0ciZTApWG', 'Admin', 'User', 'admin');

-- Sample customer (password: customer123)
INSERT INTO User (email, passwordHash, firstName, lastName, role) VALUES
('jane@example.com', '$2b$10$LzWoWneyof2U5YfYWuUsQ.mWaOCfG/AI9.m9TbjzELaCEYbk0lY9.', 'Jane', 'Smith', 'admin');

-- Sample address for Jane
INSERT INTO Address (userId, street, city, province, country, zip, phone, isDefault) VALUES
(2, '456 Queen St W', 'Toronto', 'Ontario', 'Canada', 'M5V 2A4', '416-555-0102', TRUE);

-- ── Books catalog ──
INSERT INTO BOOK (isbn, price, title, language, pages, description, category, publisher, brand, quantity, imageUrl) VALUES

-- Fiction
('978-0-06-112008-4', 18.99, 'To Kill a Mockingbird', 'English', 336,
 'Harper Lee''s Pulitzer Prize-winning masterwork of honor and injustice in the deep South.',
 'Fiction', 'HarperCollins', 'Harper Perennial', 25,
 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop'),

('978-0-7432-7356-5', 16.99, 'The Great Gatsby', 'English', 180,
 'F. Scott Fitzgerald''s third novel, a tale of the Jazz Age and the American Dream.',
 'Fiction', 'Scribner', 'Scribner Classics', 30,
 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop'),

('978-0-452-28423-4', 15.99, '1984', 'English', 328,
 'George Orwell''s dystopian social science fiction novel about totalitarian surveillance.',
 'Fiction', 'Penguin', 'Signet Classics', 20,
 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=600&fit=crop'),

('978-0-14-028329-7', 14.99, 'The Catcher in the Rye', 'English', 234,
 'J.D. Salinger''s coming-of-age classic following Holden Caulfield through New York City.',
 'Fiction', 'Penguin', 'Penguin Books', 15,
 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop'),

('978-0-06-093546-7', 17.99, 'To the Lighthouse', 'English', 209,
 'Virginia Woolf''s modernist novel exploring the passage of time and human consciousness.',
 'Fiction', 'HarperCollins', 'Harvest Books', 12,
 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop'),

-- Science Fiction
('978-0-441-17271-9', 19.99, 'Dune', 'English', 688,
 'Frank Herbert''s epic sci-fi masterpiece set on the desert planet Arrakis.',
 'Science Fiction', 'Ace Books', 'Ace', 18,
 'https://images.unsplash.com/photo-1614544048536-0d28caf77f41?w=400&h=600&fit=crop'),

('978-0-345-39180-3', 16.99, 'The Hitchhiker''s Guide to the Galaxy', 'English', 224,
 'Douglas Adams'' wildly funny and irreverent cosmic adventure.',
 'Science Fiction', 'Del Rey', 'Del Rey Books', 22,
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop'),

('978-0-553-38001-6', 18.99, 'Foundation', 'English', 244,
 'Isaac Asimov''s visionary saga about the fall and rise of a galactic empire.',
 'Science Fiction', 'Bantam', 'Spectra', 14,
 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop'),

-- Non-Fiction
('978-0-06-231609-7', 24.99, 'Sapiens: A Brief History of Humankind', 'English', 498,
 'Yuval Noah Harari explores the history of our species from the Stone Age to the present.',
 'Non-Fiction', 'Harper', 'Harper Perennial', 35,
 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop'),

('978-0-374-53557-1', 22.99, 'Thinking, Fast and Slow', 'English', 499,
 'Daniel Kahneman reveals the two systems that drive the way we think.',
 'Non-Fiction', 'Farrar Straus Giroux', 'FSG', 28,
 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=600&fit=crop'),

('978-1-4767-0816-4', 21.99, 'Educated: A Memoir', 'English', 352,
 'Tara Westover''s account of growing up in a survivalist family and discovering the power of education.',
 'Non-Fiction', 'Random House', 'Random House Trade', 20,
 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=400&h=600&fit=crop'),

-- Technology
('978-0-596-51774-8', 39.99, 'JavaScript: The Good Parts', 'English', 176,
 'Douglas Crockford''s influential guide to the best features of JavaScript.',
 'Technology', 'O''Reilly Media', 'O''Reilly', 40,
 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=600&fit=crop'),

('978-0-13-468599-1', 44.99, 'Clean Code', 'English', 464,
 'Robert C. Martin''s guide to writing readable, maintainable code.',
 'Technology', 'Pearson', 'Prentice Hall', 30,
 'https://images.unsplash.com/photo-1515879218367-8466d910auj4?w=400&h=600&fit=crop'),

('978-0-20-161622-4', 42.99, 'The Pragmatic Programmer', 'English', 352,
 'David Thomas and Andrew Hunt share practical advice for modern software development.',
 'Technology', 'Addison-Wesley', 'Addison-Wesley Professional', 25,
 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=600&fit=crop'),

-- Children
('978-0-06-023548-1', 12.99, 'Where the Wild Things Are', 'English', 48,
 'Maurice Sendak''s beloved picture book about Max''s wild adventure.',
 'Children', 'HarperCollins', 'HarperCollins Children', 50,
 'https://images.unsplash.com/photo-1629992101753-56d196c8adf7?w=400&h=600&fit=crop'),

('978-0-06-440501-0', 11.99, 'Charlotte''s Web', 'English', 184,
 'E.B. White''s heartwarming story of friendship between a pig and a spider.',
 'Children', 'HarperCollins', 'HarperCollins Children', 45,
 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&h=600&fit=crop'),

-- Mystery
('978-0-06-093544-3', 15.99, 'And Then There Were None', 'English', 272,
 'Agatha Christie''s masterful mystery about ten strangers on an isolated island.',
 'Mystery', 'HarperCollins', 'William Morrow', 18,
 'https://images.unsplash.com/photo-1587876931567-564ce588bfbd?w=400&h=600&fit=crop'),

('978-0-316-76948-0', 14.99, 'The Girl with the Dragon Tattoo', 'English', 465,
 'Stieg Larsson''s gripping thriller featuring journalist Mikael Blomkvist and hacker Lisbeth Salander.',
 'Mystery', 'Vintage', 'Vintage Crime', 16,
 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop'),

-- History
('978-0-14-303995-2', 19.99, 'Guns, Germs, and Steel', 'English', 528,
 'Jared Diamond explores why some civilizations advanced faster than others.',
 'History', 'Norton', 'W.W. Norton', 22,
 'https://images.unsplash.com/photo-1461360370896-922624d12a74?w=400&h=600&fit=crop'),

('978-0-06-073132-6', 17.99, 'A People''s History of the United States', 'English', 729,
 'Howard Zinn''s influential retelling of American history from the perspective of ordinary people.',
 'History', 'Harper', 'Harper Perennial', 15,
 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400&h=600&fit=crop');

-- ============================================================
-- Verify
-- ============================================================
SELECT CONCAT('✅ Created ', COUNT(*), ' books') AS status FROM BOOK;
SELECT CONCAT('✅ Created ', COUNT(*), ' users') AS status FROM User;
