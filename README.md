# Login Project with MongoDB

A simple login system built using **Node.js**, **Express.js**, and **MongoDB**. The project allows users to register and log in securely using their email and password.

## Features

* User registration
* User login
* MongoDB database integration
* Password authentication
* Basic error handling

## Technologies Used

* Node.js
* Express.js
* MongoDB
* Mongoose
* HTML/CSS/JavaScript

## Installation

1. Clone the project:

   ```bash
   git clone <repository-url>
   ```

2. Go to the project folder:

   ```bash
   cd <project-folder>
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file and add your MongoDB connection string:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   ```

5. Start the application:

   ```bash
   npm start
   ```

6. Open the application in your browser:

   ```
   http://localhost:3000
   ```

## MongoDB

The application uses MongoDB to store user account information. Mongoose is used to connect the application to MongoDB and manage user data.

## Security Note

Do not commit your `.env` file or expose your MongoDB connection string. Passwords should be stored using secure hashing such as **bcrypt**, rather than plain text.


This project is for learning and development purposes.
