const qrController = require('../controllers/qrController');
const authMiddleware = require('../middlewares/authMiddleware');

module.exports = async (req, res) => {
  if (req.method === 'POST' && req.url === '/save_qr') {
    await authMiddleware(req, res, async () => {
      await qrController.saveQRCode(req, res);
    });
    return;
  }
  // Add more endpoints as needed
  res.status(404).json({ message: 'Not found' });
};
