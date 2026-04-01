const db = require('../database');

exports.getAllBorrows = (req, res) => {
    const query = `
        SELECT b.id, bk.title as book_title, m.name as member_name, 
               b.borrow_date, b.return_date, b.status 
        FROM borrowing b
        JOIN books bk ON b.book_id = bk.id
        JOIN members m ON b.member_id = m.id
        ORDER BY b.borrow_date DESC
    `;
    db.all(query, [], (err, borrows) => {
        if (err) return res.status(500).send("Database error");
        
        // Also need books and members for the "New Borrow" form
        db.all("SELECT id, title, available_copies FROM books WHERE available_copies > 0", [], (err, books) => {
            db.all("SELECT id, name FROM members", [], (err, members) => {
                res.render('borrowing', { user: req.user, borrows, books, members });
            });
        });
    });
};

exports.borrowBook = (req, res) => {
    const { book_id, member_id } = req.body;
    
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        
        db.run("INSERT INTO borrowing (book_id, member_id) VALUES (?, ?)", [book_id, member_id], (err) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).send("Error recording borrow");
            }
            
            db.run("UPDATE books SET available_copies = available_copies - 1 WHERE id = ?", [book_id], (err) => {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).send("Error updating book count");
                }
                
                db.run("COMMIT");
                res.redirect('/borrowing');
            });
        });
    });
};

exports.returnBook = (req, res) => {
    const borrowId = req.params.id;
    
    db.get("SELECT book_id FROM borrowing WHERE id = ?", [borrowId], (err, borrow) => {
        if (err || !borrow) return res.status(500).send("Borrow record not found");
        
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            
            db.run("UPDATE borrowing SET return_date = CURRENT_DATE, status = 'returned' WHERE id = ?", [borrowId], (err) => {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).send("Error updating borrow record");
                }
                
                db.run("UPDATE books SET available_copies = available_copies + 1 WHERE id = ?", [borrow.book_id], (err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).send("Error updating book count");
                    }
                    
                    db.run("COMMIT");
                    res.redirect('/borrowing');
                });
            });
        });
    });
};
