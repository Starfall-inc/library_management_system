require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const authController = require('./controllers/authController');
const bookController = require('./controllers/bookController');
const memberController = require('./controllers/memberController');
const borrowController = require('./controllers/borrowController');
const authMiddleware = require('./middleware/auth');
const db = require('./database');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/login', authController.getLogin);
app.post('/login', authController.postLogin);
app.get('/logout', authController.logout);
app.get('/settings', authMiddleware, authController.getSettings);
app.post('/settings/password', authMiddleware, authController.postUpdatePassword);

// Library Routes
app.get('/books', authMiddleware, bookController.getAllBooks);
app.post('/books', authMiddleware, bookController.addBook);
app.post('/books/delete/:id', authMiddleware, bookController.deleteBook);
app.post('/books/update/:id', authMiddleware, bookController.updateBook);

// Member Routes
app.get('/members', authMiddleware, memberController.getAllMembers);
app.post('/members', authMiddleware, memberController.addMember);
app.post('/members/delete/:id', authMiddleware, memberController.deleteMember);
app.post('/members/update/:id', authMiddleware, memberController.updateMember);

// Borrowing Routes
app.get('/borrowing', authMiddleware, borrowController.getAllBorrows);
app.post('/borrowing', authMiddleware, borrowController.borrowBook);
app.post('/borrowing/return/:id', authMiddleware, borrowController.returnBook);

app.get('/', authMiddleware, (req, res) => {
    const stats = { totalBooks: 0, totalMembers: 0, totalBorrows: 0 };
    const data = { recentActivity: [], allBooks: [] };

    db.get("SELECT COUNT(*) as count FROM books", [], (err, row) => {
        if (!err && row) stats.totalBooks = row.count;
        
        db.get("SELECT COUNT(*) as count FROM members", [], (err, row) => {
            if (!err && row) stats.totalMembers = row.count;
            
            db.get("SELECT COUNT(*) as count FROM borrowing WHERE status = 'borrowed'", [], (err, row) => {
                if (!err && row) stats.totalBorrows = row.count;
                
                db.all(`
                    SELECT bk.title as book_title, m.name as member_name, b.borrow_date, b.status
                    FROM borrowing b
                    JOIN books bk ON b.book_id = bk.id
                    JOIN members m ON b.member_id = m.id
                    ORDER BY b.id DESC LIMIT 5
                `, [], (err, activity) => {
                    data.recentActivity = activity || [];
                    
                    db.all("SELECT title, author, isbn, available_copies FROM books", [], (err, books) => {
                        data.allBooks = books || [];
                        res.render('index', { 
                            user: req.user, 
                            stats, 
                            recentActivity: data.recentActivity,
                            allBooks: data.allBooks
                        });
                    });
                });
            });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
