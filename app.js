const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const session = require('express-session');
const path = require('path');
const app = express();

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'melocontix_ca2'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'Public/images')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// Set up view engine
app.set('view engine', 'ejs');

// Enable static files
app.use(express.static('Public'));

// Enable form processing
app.use(express.urlencoded({
    extended: false
}));

// Enable session handling
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

//--------------------------------------------------
// L08 AM - Read

//R - get all items
app.get("/", (req, res) => {
    const sql = "SELECT * FROM product";
    connection.query(sql, (error, results) => {
        if (error) {
            console.log("Database error", error);
            return res.status(500).send("Database error");
        }
        res.render('index', { product: results, user: req.session.user });
    });
});

//R - get item by id
app.get("/products/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM product WHERE productId = ?";
    connection.query(sql, [id], (error, results) => {
        if (error) {
            console.log("Database error", error);
            return res.status(500).send("Database error");
        }
        res.render('products', { products: results[0], user: req.session.user });
    });
});

//--------------------------------------------------
// L08 PM - Create, Update, Delete

// C - display form
app.get("/addProduct", (req, res) => {
    res.render("addProduct", { user: req.session.user });
});

  
//C - process form
app.post("/addProduct", upload.single('image'), (req, res) => {
    const { concert} = req.body;
    let image = req.file ? req.file.filename : null;

    console.log("concert: " + concert);
   

    const sql = "INSERT INTO cart (concert) VALUES (?)";
    connection.query(sql, [concert], (error, results) => {
        if (error) {
            console.log("Database error", error);
            return res.status(500).send("Database error");
        }
        res.redirect("/");
    });
});

//U
app.get("/editProduct/:id", (req, res) => {
    const productid = req.params.id;
    const sql = "SELECT * FROM product WHERE productId = ?";
    connection.query(sql, [productid], (error, results) => {
        if (error) {
            console.error("Database query error", error.message);
            return res.status(500).send("Error retrieving product by ID");
        }
        if (results.length > 0) {
            res.render('editProduct', { products: results[0], user: req.session.user });
        } else {
            res.status(404).send("Product not found");
        }
    });
});

app.post("/editProduct/:id", upload.single('image'), (req, res) => {
    const productid = req.params.id;
    const { name, capacity, venue, date, pricelist } = req.body;
    let image = req.body.filename;
    if (req.file) {
        image = req.file.filename;
    }
    const sql = "UPDATE product SET productName = ?, capacity = ?, venue = ?, date = ?, pricelist = ?, image = ? WHERE productId = ?";
    connection.query(sql, [name, capacity, venue, date, pricelist, image, productid], (error, results) => {
        if (error) {
            console.error("Error updating product:", error);
            res.status(500).send("Error updating product");
        } else {
            res.redirect("/");
        }
    });
});

//D
app.get("/deleteProduct/:id", (req, res) => {
    const productid = req.params.id;
    const sql = "DELETE FROM product WHERE productId = ?";
    connection.query(sql, [productid], (error, results) => {
        if (error) {
            console.error("Error deleting products", error);
            res.status(500).send("Error deleting product");
        } else {
            res.redirect("/");
        }
    });
});

// Simple login route
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    connection.query('SELECT * FROM admin WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const user = results[0];
            req.session.user = {
                id: user.id,
                username: user.username,
                role: user.role
            };

            if (user.role === 'admin') {
                res.redirect('/admin');
            } else {
                res.redirect('/');
            }
        } else {
            res.status(401).send('Invalid username or password');
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Logout error');
        }
        res.redirect('/');
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));




