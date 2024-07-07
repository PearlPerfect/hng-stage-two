const cors = require('cors'); // Add CORS for development if needed
const { sequelize } = require('./models/user.model'); // Import Sequelize instance

const controllers = require('./controller/user.controller');
const { verifyToken } = require('./midleware/jwt.auth');
const port = process.env.PORT || 8000

const app = express();


app.use(express.json());


app.use(cors());



// User Routes
app.post('/auth/register', controllers.register);
app.post('/auth/login', controller.login);
app.get('/api/users/:id', verifyToken, userController.getUser); // Protected route
app.get('/api/organisations', verifyToken, organisationController.getOrganisation); // Protected route

// Connect to database and start server


module.exports = app;





app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

