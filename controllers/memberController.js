const db = require('../database');

exports.getAllMembers = (req, res) => {
    const search = req.query.q || '';
    const query = search 
        ? "SELECT * FROM members WHERE name LIKE ? OR email LIKE ?" 
        : "SELECT * FROM members";
    const params = search ? [`%${search}%`, `%${search}%`] : [];

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).send("Database error");
        }
        res.render('members', { user: req.user, members: rows, search, error: null });
    });
};

exports.addMember = (req, res) => {
    const { name, email, phone } = req.body;
    db.run("INSERT INTO members (name, email, phone) VALUES (?, ?, ?)",
        [name, email, phone],
        (err) => {
            if (err) {
                return res.status(500).send("Error adding member");
            }
            res.redirect('/members');
        }
    );
};

exports.deleteMember = (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM members WHERE id = ?", [id], (err) => {
        if (err) {
            return res.status(500).send("Error deleting member");
        }
        res.redirect('/members');
    });
};

exports.updateMember = (req, res) => {
    const id = req.params.id;
    const { name, email, phone } = req.body;
    db.run("UPDATE members SET name = ?, email = ?, phone = ? WHERE id = ?",
        [name, email, phone, id],
        (err) => {
            if (err) {
                return res.status(500).send("Error updating member");
            }
            res.redirect('/members');
        }
    );
};
