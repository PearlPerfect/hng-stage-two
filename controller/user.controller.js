const express = require("express");
const Sequelize = require("sequelize");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { User, Organisation } = require("../models/user.model");
const { generateToken } = require("../midleware/jwt.auth");

const userRegistration = async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

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
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: "Bad request",
      message: "Registration unsuccessful",
      error,
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
      return res.status(401).json({
        status: "Bad request",
        message: "Authentication failed",
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
    res.status(500).json({
      status: "Error",
      message: "Internal server error",
    });
  }
};

const createOrganisation = async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.userId;
  console.log(userId);
  try {
    const organisation = await Organisation.create({
      name,
      description,
      userId,
    });
   
    const user = await User.findByPk(userId);
    await user.addOrganisation(organisation)
  

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
    console.error(error);
    res.status(400).json({
      status: "Bad Request",
      message: "Client error",
    });
  }
};
const getUser = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: "Not found",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User details retrieved successfully",
      data: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "Error",
      message: "Internal server error",
    });
  }
};

const getOrganisations = async (req, res) => {
  const userId = req.user.userId; // Assuming you have user data from middleware or auth
  console.log(userId);
  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Organisation,
          as: "Organisations",
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const organisations = user.Organisations;
    const response = {
      orgId: organisations.orgId,
      name: organisations.name,
      description: organisations.description,
    };
    console.log(response);
    return res.status(200).json({
      status: "success",
      message: "Your organizations details retrieved successfully",
      data: {
        organisations: organisations,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// const getOrganisations = async (req, res) => {
//   const userId = req.user.userId; // Get user ID from authenticated user

//   try {
//     const organisations = await Organisation.findAll({
//       where: {
//         [Sequelize.Op.or]: [
//           { userId },
//           {
//             // Organisations where the user is a member (through User-Organisation association)
//             "$user.userId$": userId,
//           },
//         ],
//       },
//       include: [
//         {
//           model: User,
//           as: "user",
//           attributes: ["firstName", "lastName"], // Only include specific user attributes
//         },
//       ],
//     });

//     res.status(200).json({
//       status: "success",
//       message: "Organisations retrieved successfully",
//       data: {
//         organisations: organisations.map((organisation) => ({
//           orgId: organisation.orgId,
//           name: organisation.name,
//           description: organisation.description,
//           user: organisation.user, // Include user details
//         })),
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       status: "Error",
//       message: "Internal server error",
//     });
//   }
// };



const addUserToOrganization = async (req, res) => {
  const orgId = req.params.orgId;
  const userId = req.user.userId;
  const userToBeRegistered = req.body.userId; // Assuming user ID is in request body

  try {
    // Validate input data (optional)
    if (!orgId || !userId || !userToBeRegistered) {
      return res.status(400).json({
        status: "Bad Request",
        message: "Missing required fields",
      });
    }
    const organisationData = await Organisation.findByPk(orgId)
    if (!organisationData) {
      return res.status(404).json({
        status: "Not found",
        message: "Organisation not found",
      });
    }
    
    const userToBeAdded = await User.findByPk(userToBeRegistered)
    const isMember = await (userToBeAdded.hasOrganisation(orgId))
    console.log(isMember)
    if (isMember) {
      return res.status(400).json({
        status: "Bad Request",
        message: "User already belongs to this organisation",
      });
    }

    
   
   const organisation = await Organisation.create({
      name: organisationData.name,
      description: organisationData.description,
      userId : userToBeRegistered
    })

    const user = await User.findByPk(userToBeRegistered);
    await user.addOrganisation(organisation)

    res.status(200).json({
      status: "success",
      message: "User added to organisation successfully",
      data: organisation
    });
  } catch (error) {
    console.error(error);
    if (error instanceof SequelizeValidationError) {
      return res.status(400).json({
        status: "Bad Request",
        message: error.errors[0].message, 
      });
    } else {
      return res.status(500).json({
        status: "Error",
        message: "Internal server error", 
      });
    }
  }
};




// const addUserToOrganization = async (req, res) => {
//   const orgId = req.params.orgId;
//   const owner = req.user.userId;
//   const userId = req.body.userId;

//   try {
//     const organisationData = await Organisation.findByPk(orgId);
//     if (!organisationData) {
//       return res.status(404).json({
//         status: "Not found",
//         message: "Organisation not found",
//       });
//     }

//     const isAuthourizedOwner = organisationData.userId;
//     if (owner !== isAuthourizedOwner) {
//       return res.status(401).json({
//         status: "unauthorized",
//         message: "You are not authorized to perform this action",
//       });
//     }

//     // Check if user is already a member
//     const isMember = await Organisation.findOne({where:{ userId}});

//     if (isMember) {
//       return res.status(400).json({
//         status: "Bad Request",
//         message: "User already belongs to this organisation",
//       });
//     }

//     // User is not a member, proceed with adding
//     await Organisation.create({
//       name: organisationData.name,
//       description: organisationData.description,
//       userId: userToBeRegistered,
//     });

//     res.status(200).json({
//       status: "success",
//       message: "User added to organisation successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       status: "Error",
//       message: "Internal server error",
//     });
//   }
// };


module.exports = {
  userRegistration,
  login,
  createOrganisation,
  getUser,
  getOrganisations,
  addUserToOrganization,
};
