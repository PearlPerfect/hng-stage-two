const express = require("express");
const Sequelize = require("sequelize");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { User, Organisation } = require("../models/user.model");
const { generateToken } = require("../midleware/jwt.auth");

const userRegistration = async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
if(!email){
  return res.status(422).json({message: "Email is required"})
}
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(422).json({
      errors: [
        { field: "email", message: "Email already in use. Try another email" },
      ],
    });
  }
  try {
    // const errors = validationResult(req);
    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone,
    };

    const user = await User.create(userData);

    const orgName = `${firstName}'s Organisation`;

    const organisation = await Organisation.create({
      name: orgName,
      userId: user.userId,
    });
    await user.addOrganisation(organisation);


    const token = generateToken(user);
    res.status(201).json({
      status: "success",
      message: "Registration successful",
      data: {
        accessToken: token,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        },
      },
    });
  } catch (errors) {
  
    if(errors && errors.name == "SequelizeValidationError"){
      const error = errors.errors.map(error => ({
      message: `${error.path} cannot be empty`
    }));
      return res.status(422).json({
        error
      });
    }

    res.status(400).json({
      status: "Bad request",
      message: "Registration unsuccessful",
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(422).json({
      errors: [
        { field: "email", message: "Email not found, try another email" },
      ],
    });
  }
  try {
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(422).json({
        status: "Bad request",
        message: "Incorrect password",
      });
    }

    const token = generateToken(user);
    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        accessToken: token,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({
      status: "Bad request",
      message: "Authentication failed",
    });
  }
};

const createOrganisation = async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.userId;
 
  try {
    const organisation = await Organisation.create({
      name,
      description,
      userId,
    });

    await organisation.addUser(userId);
   
    res.status(201).json({
      status: "success",
      message: "Organisation created successfully",
      data: {
        orgId: organisation.orgId,
        name: organisation.name,
        description: organisation.description,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "Bad Request",
      message: "Error in creating organisation",
    });
  }
};
const getUser = async (req, res) => {
  
  try{
  const userId = req.params.id;
  const authorizedUser = req.user.userId
  const user = await User.findOne({where: {userId} })
 
  if (!user) {
    return res.status(404).json({
      status: 'Not Found',
      message: 'User not found',
    });
  }


  res.status(200).json({
    status: "success",
    message: "user details retrieved successfully",
    data:{
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user?.phone,
    }
  });
} catch (error) {
  console.error(error);
  res.status(422).json({
    status: 'Unauthorized',
    message: 'Fail to get user Data',
  });
}
};






async function getUserOrganisations(req, res) {
  const userId = req.user.userId; // Assuming user ID is retrieved from request parameters
  console.log(userId)

  try {
    const user = await User.findByPk(userId, {
      include: {
        model: Organisation,
        through: 'user_organisations', // Specify the junction table
        attributes: ['orgId', 'name', 'description']
      },
    });
  

    if (!user) {
      return res.status(404).json({
        status: 'Not Found',
        message: 'User not found',
      });
    }

    const organizations = user.Organisations.map(org => ({
      orgId: org.orgId,
      name: org.name,
      description: org.description,
    })); // Array of organizations the user belongs to

    res.status(200).json({
      status: 'success',
      message: 'User organizations retrieved successfully',
      data: {organizations},
    });
  } catch (error) {
    console.error(error);
    res.status(422).json({
      status: 'Error',
      message: "Could not retrieve user's organisation",
    });
  }
}




async function addUserToOrganisation(req, res) {
  const orgId = req.params.orgId;
const userId = req.user.userId;
 const newUserId = req.body.userId;

  try {
    // Find the organisation the user wants to add to
    const organisation = await Organisation.findByPk(orgId, {
      include: {
        model: User, // Include the creator user
        where: { userId: userId }, // Ensure it's the user's organisation
      },
    });

    if (!organisation) {
      return res.status(404).json({
        status: 'Not Found',
        message: 'Organisation not found or you are not the creator',
      });
    }

    // Find the user to be added
    const newUser = await User.findByPk(newUserId);

    if (!newUser) {
      return res.status(404).json({
        status: 'Not Found',
        message: 'User to be added not found',
      });
    }

    // Add the new user to the organisation through the junction table
    await organisation.addUser(newUser);

    res.status(200).json({
      status: 'success',
      message: 'User added to organisation successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'Error',
      message: 'Internal server error',
    });
  }
}





module.exports = {
  userRegistration,
  login,
  createOrganisation,
  getUser,
  getUserOrganisations,
  addUserToOrganisation,
};
