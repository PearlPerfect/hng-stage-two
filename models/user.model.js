const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize("../config/database.config.js");

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
      customValidator(value) {
        if (typeof value !== "string") {
          throw new Error("firstName must be a string");
        }
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
      customValidator(value) {
        if (typeof value !== "string") {
          throw new Error("lastName must be a string");
        }
      },
    },
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      checkEmail: function (value) {
        if (!this.email.isEmail) {
          throw new Error("Invalid email format");
        }
      },
    },
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: {
        args: [8, 13],
        msg: "Password must be between 8 and 13 characters",
      },
    },
  },
  phone: {
    type: Sequelize.STRING,
    validate:{
      isPhoneNum: {
        msg: "Invalid phone number format",
      },
    }
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

