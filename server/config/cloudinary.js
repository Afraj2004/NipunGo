// server/config/cloudinary.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── Config check ──────────────────────────────────────────
console.log('Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
  api_key:    process.env.CLOUDINARY_API_KEY    ? '✅ Set' : '❌ Missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder:           'nipungo/workers',
      allowed_formats:  ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        {
          width:   400,
          height:  400,
          crop:    'fill',
          gravity: 'face'
        }
      ],
      // Unique filename
      public_id: `worker_${req.params.workerId}_${Date.now()}`
    };
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Sirf JPG, PNG, WEBP images allowed hain!'),
        false
      );
    }
  }
});

module.exports = { cloudinary, upload };