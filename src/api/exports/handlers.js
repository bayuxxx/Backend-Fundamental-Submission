class ExportsHandler {
  constructor(playlistsService, producerService, validator) {
    this._playlistsService = playlistsService;
    this._producerService = producerService;
    this._validator = validator;

    this.postExportPlaylistsHandler =
      this.postExportPlaylistsHandler.bind(this);
  }

  async postExportPlaylistsHandler(request, h) {
    // 1. Validasi body request
    this._validator.validateExportPlaylistsPayload(request.payload);

    const { playlistId } = request.params;
    const { targetEmail } = request.payload;
    // Asumsi id user didapat dari autentikasi
    const { id: userId } = request.auth.credentials;

    // 2. Verifikasi kepemilikan playlist
    await this._playlistsService.verifyPlaylistOwner(playlistId, userId);

    // 3. Buat pesan untuk dikirim ke RabbitMQ
    const message = {
      playlistId,
      targetEmail,
    };

    // 4. Kirim pesan ke queue 'export:playlists'
    await this._producerService.sendMessage(
      "export:playlists",
      JSON.stringify(message),
    );

    const response = h.response({
      status: "success",
      message: "Permintaan Anda sedang kami proses",
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
