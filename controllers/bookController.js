const db = require('../database');

exports.getAllBooks = (req, res) => {
    const search = req.query.q || '';
    const query = search 
        ? "SELECT * FROM books WHERE title LIKE ? OR author LIKE ?" 
        : "SELECT * FROM books";
    const params = search ? [`%${search}%`, `%${search}%`] : [];

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).send("Database error");
        }
        res.render('books', { user: req.user, books: rows, search, error: null });
    });
};

exports.addBook = (req, res) => {
    const { title, author, isbn, available_copies } = req.body;
    db.run("INSERT INTO books (title, author, isbn, available_copies) VALUES (?, ?, ?, ?)",
        [title, author, isbn, available_copies],
        (err) => {
            if (err) {
                return res.status(500).send("Error adding book");
            }
            res.redirect('/books');
        }
    );
};

exports.deleteBook = (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM books WHERE id = ?", [id], (err) => {
        if (err) {
            return res.status(500).send("Error deleting book");
        }
        res.redirect('/books');
    });
};

exports.updateBook = (req, res) => {
    const { id } = req.params;
    const { title, author, isbn, available_copies } = req.body;
    db.run("UPDATE books SET title = ?, author = ?, isbn = ?, available_copies = ? WHERE id = ?",
        [title, author, isbn, available_copies, id],
        (err) => {
            if (err) {
                return res.status(500).send("Error updating book");
            }
            res.redirect('/books');
        }
    );
};
