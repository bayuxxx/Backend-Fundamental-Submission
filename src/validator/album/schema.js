const Joi = require('joi');

const AlbumPayloadSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().integer().required(),
});

// --- [TAMBAHKAN INI] ---
// Skema untuk memvalidasi header file gambar
const ImageHeadersSchema = Joi.object({
  'content-type': Joi.string().valid('image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp').required(),
}).unknown(); // .unknown() memperbolehkan header lain yang tidak divalidasi

module.exports = {
  AlbumPayloadSchema,
  ImageHeadersSchema, // Ekspor skema baru
};