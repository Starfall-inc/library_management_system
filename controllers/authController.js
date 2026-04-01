const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

exports.getLogin = (req, res) => {
    res.render('login', { error: null });
};

exports.postLogin = (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user) {
            return res.render('login', { error: 'Invalid username or password' });
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/');
    });
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
};

exports.getSettings = (req, res) => {
    res.render('settings', { user: req.user, error: null, success: null });
};

exports.postUpdatePassword = (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
        return res.render('settings', { user: req.user, error: "Passwords do not match", success: null });
    }

    db.get("SELECT password FROM users WHERE username = ?", [req.user.username], (err, user) => {
        if (err || !user) return res.status(500).send("Database error");

        bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
            if (!isMatch) {
                return res.render('settings', { user: req.user, error: "Incorrect current password", success: null });
            }

            bcrypt.hash(newPassword, 10, (err, hash) => {
                db.run("UPDATE users SET password = ? WHERE username = ?", [hash, req.user.username], (err) => {
                    if (err) return res.status(500).send("Error updating password");
                    res.render('settings', { user: req.user, error: null, success: "Password updated successfully!" });
                });
            });
        });
    });
};
