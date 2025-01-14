const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, 'your-secret-key');
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (err) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
};
// Configure session middleware
app.use(session({
  secret: 'your-secret-key', // Replace with a secure key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Serve static files from the current directory (LearnZy)
app.use(express.static(path.join(__dirname)));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/LearnZy');

// Define the schema for the user collection
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  standards: String,
  previousPercentage: Number,
});

// Create a model for the user collection
const User = mongoose.model('students', userSchema);

// Use body-parser to parse the request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Define a route for the root URL
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/signup.html');
});
app.get('/getStudentName', (req, res) => {
    const studentName = req.session.studentName || 'Student';
    res.send({ name: studentName });
  });
// Define a route for the signup form submission
app.post('/signup', async (req, res) => {
    try {
      const { name, email, password, standards, previousPercentage } = req.body;
  
      // Hash the password
      const hashedPassword = bcrypt.hashSync(password, 10);
  
      // Create a new user document
      const user = new User({
        name,
        email,
        password: hashedPassword,
        standards,
        previousPercentage,
      });
  
      // Save the user document to the database
      await user.save();
  
      // Store the student's name in the session
      req.session.studentName = name;
  
      // Redirect to dashboard.html
      res.redirect('/dashboard.html');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error saving user data');
    }
});

app.post('/update-profile', authenticate, async (req, res) => {
    try {
        const { name, email, password, grade, previousPercentage } = req.body;

        console.log('Updating user data for user ID:', req.user._id);

        // Find the user in the database and update their information
        const user = await User.findOneAndUpdate(
            { _id: req.user._id }, // Use the authenticated user's ID
            { name, email, password: bcrypt.hashSync(password, 10), grade, previousPercentage },
            { new: true } // Return the updated document
        );

        console.log('Updated user data:', user);

        // Send the updated user data back to the client
        res.json({
            name: user.name,
            email: user.email,
            grade: user.grade,
            previousPercentage: user.previousPercentage,
        });
    } catch (err) {
        console.error('Error updating user data:', err);
        res.status(500).send('Error updating user data');
    }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});