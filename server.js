const express = require('express');
const bodyParser = require("body-parser")
const cors = require('cors'); // Add CORS for development if needed
const { sequelize } = require('./models/user.model'); // Import Sequelize instance

const controllers = require('./controller/user.controller');
const { verifyToken } = require('./midleware/jwt.auth');
const { validateRegister } = require('./midleware/validation');
const dotenv = require('dotenv').config()
const port = process.env.PORT || 8000

const app = express();

app.use(bodyParser.urlencoded({extended:false}))
app.use(express.json());
app.use(cors());



// User Routes
app.post('/auth/register', controllers.userRegistration);
app.post('/auth/login', controllers.login);
app.post('/api/organisations', verifyToken, controllers.createOrganisation);
app.post('/api/organisations/:orgId/users', verifyToken, controllers.addUserToOrganisation)
app.get('/api/users/:id', verifyToken, controllers.getUser); // Protected route
app.get('/api/organisations', verifyToken, controllers.getUserOrganisations); // Protected route

// Connect to database and start server

(async () => {
    try {
      await sequelize.sync({ force: false }); // Synchronize models (create tables if needed)
      console.log('Database connection successful');
  
   
      app.listen(port, () => console.log(`Server listening on port ${port}`));
    } catch (error) {
      console.error('Error connecting to database:', error);
      process.exit(1);
    }
  })();
  
  module.exports = app;






