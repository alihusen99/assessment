const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// middlewares
const logTimestampAndMethod = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  console.log(`[${timestamp}] ${method} ${req.originalUrl}`);
  next();
};

app.use(bodyParser.json());
// use middleware
app.use(logTimestampAndMethod);

//DB SETUP
// Connect to the MongoDB database
mongoose.connect('mongodb://localhost:27017/assessment', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB database');
});

// Create a schema for the book model
const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  genre: String,
});

const Book = mongoose.model('Book', bookSchema);

const returnResult = (status, msg, data) => {
  return {
    status: status,
    msg: msg,
    book: data,
  };
};

async function createBook(title, author, genre) {
  try {
    const response = await axios.post('http://localhost:3000/book', {
      title: title,
      author: author,
      genre: genre,
    });
    return response.data;
  } catch (error) {
    console.log(error.message)
    throw new Error('Error creating book: ' + error.message);
  }
}

// Fungsi untuk menghapus record buku berdasarkan id
async function deleteBookById(bookId) {
  try {
    const response = await axios.post(`http://localhost:3000/book/delete/${bookId}`);
    return response.data;
  } catch (error) {
    console.log(error.message)
    throw new Error('Error deleting book: ' + error.message);
  }
}


// routes
app.get('/', (req, res) => {
  res.send('Home Root Route');
});

app.get('/about', (req, res) => {
  res.send('About Us');
});

app.get('/contact', (req, res) => {
  res.send('Contact Us');
});

// Routes for CRUD operations
//get
app.get('/book', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(returnResult(200, 'books get Successfully', books));
  } catch (error) {
    res.status(500).json(returnResult(500, 'Error retrieving books.', null));
  }
});

//create
app.post('/book', async (req, res) => {
  const { title, author, genre } = req.body;
  if (!title || !author || !genre) {
    return res.status(400).json(returnResult(400, 'Title, author, and genre are required.', null));
  }

  try {
    const newBook = new Book({ title, author, genre });
    await newBook.save();
    res.status(201).json(returnResult(201, 'Book created successfully.', newBook));
  } catch (error) {
    res.status(500).json(returnResult(500, 'Error adding a new book.', null));
  }
});

//edit
app.post('/book/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, genre } = req.body;
  if (!title || !author || !genre) {
    return res.status(400).json(returnResult(400, 'Title, author, and genre are required.', null));
  }

  try {
    const updatedBook = await Book.findByIdAndUpdate(id, { title, author, genre }, { new: true });
    if (!updatedBook) {
      return res.status(404).json(returnResult(404, 'Book not found.', null));
    }
    res.json(returnResult(200, 'Book updated successfully.', updatedBook));
  } catch (error) {
    res.status(500).json(returnResult(500, 'Error updating the book.', null));
  }
});

//delete
app.post('/book/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBook = await Book.findByIdAndRemove(id);
    if (!deletedBook) {
      return res.status(404).json(returnResult(404, 'Book not found.', null));
    }
    res.json(returnResult(200, 'Book deleted successfully.', deletedBook));
  } catch (error) {
    res.status(500).json(returnResult(500, 'Error deleting the book.', null));
  }
});

app.post('/book/add/then/delete/:id', async(req, res) => {
  try {
    const funcPromises = []
    const { title, author, genre } = req.body;
    const { id } = req.params;

    if (!title || !author || !genre) {
      return res.status(400).json(returnResult(400, 'Title, author, and genre are required.', null));
    }
    funcPromises.push(createBook(title, author, genre))
    funcPromises.push(deleteBookById(id))
    await Promise.all(funcPromises);
    res.json(returnResult(200, 'Book add then delete successfully.', {}));
    
  } catch (error) {
    res.status(500).json(returnResult(500, 'Error create and delete process.', error));
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});




