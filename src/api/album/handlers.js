class AlbumsHandler {
  constructor(service, storageService, validator) {
    this._service = service;
    this._storageService = storageService;
    this._validator = validator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAllAlbumHandler = this.getAllAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.postUploadCoverHandler = this.postUploadCoverHandler.bind(this);
    this.postAlbumLikeHandler = this.postAlbumLikeHandler.bind(this);
    this.deleteAlbumLikeHandler = this.deleteAlbumLikeHandler.bind(this);
    this.getAlbumLikesHandler = this.getAlbumLikesHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;
    const albumId = await this._service.addAlbum({ name, year });

    return h
      .response({
        status: "success",
        data: { albumId },
      })
      .code(201);
  }

  async getAllAlbumHandler() {
    const albums = await this._service.getAllAlbums();
    return {
      status: "success",
      data: { albums },
    };
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    return {
      status: "success",
      data: { album },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    const { name, year } = request.payload;
    await this._service.editAlbumById(id, { name, year });

    return {
      status: "success",
      message: "Album berhasil diperbarui",
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: "success",
      message: "Album berhasil dihapus",
    };
  }

  async postUploadCoverHandler(request, h) {
    const { cover } = request.payload;
    const { id } = request.params;
  
    this._validator.validateImageHeaders(cover.hapi.headers);
  
    const filename = await this._storageService.writeFile(cover, cover.hapi);
  
    const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/covers/${filename}`;
  
    await this._service.addAlbumCoverById(id, coverUrl);
  
    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }
  

  async postAlbumLikeHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.addAlbumLike(albumId, userId);

    const response = h.response({
      status: "success",
      message: "Album berhasil disukai",
    });
    response.code(201);
    return response;
  }

  async deleteAlbumLikeHandler(request, _h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.deleteAlbumLike(albumId, userId);

    return {
      status: "success",
      message: "Batal menyukai album berhasil",
    };
  }

  async getAlbumLikesHandler(request, h) {
    const { id: albumId } = request.params;

    const { likes, source } = await this._service.getAlbumLikes(albumId);

    const response = h.response({
      status: "success",
      data: {
        likes,
      },
    });

    response.header("X-Data-Source", source);
    return response;
  }
}

module.exports = AlbumsHandler;