const Sequelize = require('sequelize');

const bcrypt = require('bcryptjs');

const sequelize = new Sequelize("postgres://default:GykuY7w5ORVZ@ep-fragrant-brook-a4584x3k.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require");

const User = sequelize.define('User', {
  userId: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  firstName: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      isAlpha: {
        msg: "firstName must contain only letters",
      },
    },
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      isAlpha: {
        msg: "lastName must contain only letters",
      },
    },
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: {
        args: [6, 13],
        msg: "Password must be between 8 and 13 characters",
      },
    },
  },
  phone: {
    type: Sequelize.STRING,
  
  },
}, {
  hooks: {
    beforeCreate: async (user) => {
      const salt = await bcrypt.genSalt(8);
      user.password = await bcrypt.hash(user.password, salt);
    },
  },
});

const Organisation = sequelize.define('Organisation', {
  orgId: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  description: {
    type: Sequelize.STRING,
  },
});

User.hasMany(Organisation, { foreignKey: 'userId' });
Organisation.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  Organisation,
  sequelize,
};

