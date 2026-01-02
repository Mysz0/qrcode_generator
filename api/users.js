const userController = require('../controllers/userController');
const userModel = require('../models/userModel');

module.exports = async (req, res) => {
  if (req.method === 'POST' && req.url === '/register') {
    return userController.register(req, res);
  }
  if (req.method === 'POST' && req.url === '/login') {
    return userController.login(req, res);
  }
  // Add more endpoints as needed
  res.status(404).json({ message: 'Not found' });
};
