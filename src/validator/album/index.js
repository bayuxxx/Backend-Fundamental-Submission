const InvariantError = require('../../exceptions/InvariantError');
// --- [MODIFIKASI] --- Impor kedua skema
const { AlbumPayloadSchema, ImageHeadersSchema } = require('./schema');

const AlbumsValidator = {
  validateAlbumPayload: (payload) => {
    const validationResult = AlbumPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  // --- [TAMBAHKAN METHOD INI] ---
  validateImageHeaders: (headers) => {
    const validationResult = ImageHeadersSchema.validate(headers);

    if (validationResult.error) {
      // Ganti pesan error agar lebih spesifik dan mudah dimengerti
      throw new InvariantError('Gagal mengunggah gambar karena tipe file tidak valid');
    }
  },
};

module.exports = AlbumsValidator;