const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
const PORT = 3001;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

// MySQL connection configuration
// const connection = mysql.createConnection({
//   host: '34.192.31.89',
//   user: 'root',
//   password: 'My$ecureP@ssw0rd!',
//   database: 'restaurantae',
//   connectTimeout: 10000 
// });

const pool = mysql.createPool({
  connectionLimit : 10, // Adjust the limit as per your application's needs
  // host: '34.192.31.89',
  host: 'localhost',
  user: 'root',
  password: 'My$ecureP@ssw0rd!',
  database: 'restaurantae',
  connectTimeout: 10000 
});

// Connect to MySQL
// connection.connect((err) => {
//   if (err) throw err;
//   console.log('Connected to MySQL database');
// });

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// CRUD operations for 'users' table
app.get('/users', (req, res) => {
  pool.query('SELECT * FROM users', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// CRUD operations for 'branches' table
app.get('/branches', (req, res) => {
  pool.query('SELECT * FROM branches', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post('/cartitems', (req, res) => {
  const { username, branchname } = req.body;
  console.log('username',username, 'branchname',branchname);
  pool.query('SELECT * FROM cart where username = ? AND branchname = ? ',[username,branchname], (err, results) => {
    if (err){
      throw err;
    } 
    res.json(results);
    console.log(results);
  });
});

// CRUD operations for 'menu' table
app.post('/menu', (req, res) => {
  const { branchname } = req.body;
  console.log(branchname);
  pool.query('SELECT itemname, itemprice FROM menu WHERE branchname = ?', [branchname], (err, results) => {
      if (err) {
          console.error('Error fetching menu:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }
      res.json(results);
  });
});

// CRUD operations for 'tabl' table
app.post('/tabl', (req, res) => {
  const { branchname } = req.body;
  console.log(branchname);
  pool.query('SELECT tabletype, count FROM tabl WHERE branchname = ?', [branchname], (err, results) => {
      if (err) {
          console.error('Error fetching tables:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }
      res.json(results);
  });
});

// Signup (Create) operation
app.post('/signup', (req, res) => {
    const { username, pswrd, email, phone } = req.body;
    // Check if the username already exists
    pool.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
      if (err) {
        console.error('Error querying user:', err);
        res.status(500).json({ error: 'Failed to create user' });
      } else if (results.length > 0) {
        res.status(409).json({ error: 'Username already exists' });
      } else {
        // Username is available, proceed with signup
        const sql = 'INSERT INTO users (username, pswrd, email, phone) VALUES (?, ?, ?, ?)';
        pool.query(sql, [username, pswrd, email, phone], (err, results) => {
          if (err) {
            console.error('Error creating user:', err);
            res.status(500).json({ error: 'Failed to create user' });
          } else {
            res.json({ message: 'Registration success' });
          }
        });
      }
    });
  });
  

// Login (Read) operation
app.post('/login', (req, res) => {
    const  username = req.body.username;
    const  pswrd = req.body.pswrd;
     
    console.log(req.body.username);
    pool.query('SELECT * FROM users WHERE username = ? AND pswrd = ?', [username, pswrd], (err, results) => {
      if (err) {
        console.error('Error querying user:', err);
        res.status(500).json({ error: 'Failed to login' });
      } else if (results.length === 0) {
        res.status(401).json({ error: 'Invalid username or password' });
      } else {
        res.json({ message: 'Login successful', user: results[0] });
      }
    });
  });

  app.post('/reservations',(req,res)=>{
    const {username,branchname,res_date,timeslot,tabletype,tab_count} = req.body ;
    const sql = 'INSERT INTO reservations(username,branchname,res_date,timeslot,tabletype,tab_count) VALUES (?,?,?,?,?,?)';
    pool.query(sql,[username,branchname,res_date,timeslot,tabletype,tab_count], (err,results)=>{
      if(err){
        console.log('error creating reservation',err);
        err.status(500).json({error : 'Failed creating Reservation'});
      }
      else{
        res.json({message :'Reservation successful'});
      }
    })
  })

  app.post('/cancelreservations',(req,res)=>{
    const {username,branchname,res_date,timeslot,tabletype} = req.body ;
    const sql = ' DELETE FROM reservations where username = ? AND branchname = ? AND res_date = ? AND timeslot = ? AND tabletype =? ';
    pool.query(sql,[username,branchname,res_date,timeslot,tabletype], (err,results)=>{
      if(err){
        console.log('error cancelling reservation',err);
        err.status(500).json({error : 'Failed cancelling Reservation'});
      }
      else{
        res.json({message :'Reservation Cancelled'});
      }
    })
  })

  app.post('/getreservations',(req,res)=>{
    const {username,branchname} = req.body ;
    const sql = 'SELECT res_date,timeslot,tabletype,tab_count from  reservations where username = ? AND branchname = ?';
    pool.query(sql,[username,branchname], (err,results)=>{
      if(err){
        console.log('error fetching reservations',err);
        err.status(500).json({error : 'Failed fetching Reservations'});
      }
      else{
        res.json(results);
      }
    })
  })

  app.post('/favourites',(req,res)=>{
    const {username,branchname,itemname} = req.body ;
    const sql = 'INSERT INTO favourites(username,branchname,itemname) VALUES (?,?,?)';
    pool.query(sql,[username,branchname,itemname], (err,results)=>{
      if(err){
        console.log('error adding to favourites',err);
        err.status(500).json({error : 'Failed creating Favourites'});
      }
      else{
        res.json({message :'Reservation successful'});
      }
    })
  })

  app.post('/getfavourites', (req, res) => {
    const {username,branchname} = req.body ;
    const sql = 'SELECT itemname FROM favourites where username = ?';
    pool.query(sql,[username], (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });

  app.post('/removefavourites', (req, res) => {
    const {username,itemname} = req.body ;
    const sql = 'DELETE  FROM favourites where username = ? AND itemname = ?';
    pool.query(sql,[username,itemname], (err, results) => {
      if(err){
        console.log('error removing favourite',err);
        err.status(500).json({error : 'Failed removing favourite'});
      }
      else{
        res.json({message :'Removed from Favourites successfully'});
      }
    });
  });


  app.post('/cart', (req, res) => {
    const { username, branchname, itemname, itemcount } = req.body;
    console.log('itemcount',itemcount);
    const sql = 'INSERT INTO cart(username, branchname, itemname, itemcount) VALUES (?, ?, ?, ?)';
    pool.query('SELECT * FROM cart WHERE username = ? AND branchname = ? AND itemname = ?', [username, branchname, itemname], (err, results) => {
      if (err) {
        console.error('Error querying cart:', err);
        res.status(500).json({ error: 'Cart Failed' });
      } else if (results.length === 0) {
        console.log('itemcount',itemcount);
        pool.query(sql, [username, branchname, itemname, itemcount], (err, results) => {
          if (err) {
            console.log('Error in adding items to cart', err);
            res.status(500).json({ error: 'Failed creating cart' });
          } else {
            console.log('Cart insertion successful');
            res.json({ message: 'Cart insertion successful' });
          }
        });
      } else {
        pool.query('UPDATE cart SET itemcount = ? WHERE username = ? AND branchname = ? AND itemname = ?', [itemcount, username, branchname, itemname], (err, results) => {
          if (err) {
            console.log('Error in updating cart', err);
            res.status(500).json({ error: 'Failed updating cart' });
          } else {
            console.log('Cart update successful');
            res.json({ message: 'Cart update successful' });
          }
        });
      }
    });
  });

  app.post('/removecart', (req, res) => {
    const {username,branchname,itemname} = req.body ;
    const sql = 'DELETE FROM cart where username = ? AND branchname = ? AND itemname = ?';
    pool.query(sql,[username, branchname, itemname], (err, results) => {
      if(err){
        console.log('error removing cart',err);
        err.status(500).json({error : 'Failed removing cart items'});
      }
      else{
        res.json({message :'Removed from cart successfully'});
      }
    });
  });
  

// Similarly, write CRUD operations for other tables like 'branches', 'menu', 'tables', 'reservations', 'favourites', 'orders'

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
