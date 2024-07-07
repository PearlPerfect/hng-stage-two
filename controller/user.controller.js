const express = require('express');
const { User, Organisation } = require('../models/user.model');
const { generateToken, authenticate } = require('../midleware/jwt.auth');

const userRegistration = async(req, res) =>{
    const {email, firstName, userData} = req.body; 
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(422).json({
        errors: [{ field: 'email', message: 'Email already in use. Try another email' }],
      });
    }
    try{
        const user = await User.create(userData)
        const orgName = `${firstName}'s Organisation`;
        const organisation = await Organisation.create({ name: orgName, userId: user.userId })
        const token = generateToken(user);
        res.status(201).json({
            status: 'success',
      message: 'Registration successful',
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
        })
    }
    catch(error){
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => ({
              field: err.path,
              message: err.message,
            }));
            res.status(422).json({
              errors,
            });
          } 
          else if (error) {
            res.status(400).json({
              status: 'Bad request',
              message: 'Registration unsuccessful',
              error 
            }); 
          }
          else {
          
            console.error(error);
            res.status(500).json({
              status: 'Error',
              message: 'Internal server error',
            });
          }
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          status: 'Bad request',
          message: 'Authentication failed',
        });
      }
  
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          status: 'Bad request',
          message: 'Authentication failed',
        });
      }
  
      const token = generateToken(user);
      res.status(200).json({
        status: 'success',
        message: 'Login successful',
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
        status: 'Error',
        message: 'Internal server error',
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
  
      res.status(201).json({
        status: 'success',
        message: 'Organisation created successfully',
        data: {
          orgId: organisation.orgId,
          name: organisation.name,
          description: organisation.description,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        status: 'Bad Request',
        message: 'Client error',
      });
    }
  };
  const getUser = async (req, res) => {
    const userId = req.user.userId; // Get user ID from authenticated user
  
    try {
      const user = await User.findByPk(userId);
  
      if (!user) {
        return res.status(404).json({
          status: 'Not found',
          message: 'User not found',
        });
      }
  
      res.status(200).json({
        status: 'success',
        message: 'User details retrieved successfully',
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
        status: 'Error',
        message: 'Internal server error',
      });
    }
  };
  
  const getOrganisations = async (req, res) => {
    const userId = req.user.userId; // Get user ID from authenticated user
  
    try {
      const organisations = await Organisation.findAll({
        where: {
          [Sequelize.Op.or]: [
            { userId }, // Organisations created by the user
            {
              // Organisations where the user is a member (through User-Organisation association)
              '$user.userId$': userId,
            },
          ],
        },
        include: [
          {
            model: User,
            as: 'user', // Alias for the User model in the association
            attributes: ['firstName', 'lastName'], // Only include specific user attributes
          },
        ],
      });
  
      res.status(200).json({
        status: 'success',
        message: 'Organisations retrieved successfully',
        data: {
          organisations: organisations.map((organisation) => ({
            orgId: organisation.orgId,
            name: organisation.name,
            description: organisation.description,
            user: organisation.user, // Include user details
          })),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: 'Error',
        message: 'Internal server error',
      });
    }
  };
  
  
  

module.exports = {userRegistration, login, createOrganisation, getUser, getOrganisations}