require("dotenv").config();

const Hapi = require("@hapi/hapi");

// plugins
const albumsPlugin = require("./api/album");
const songsPlugin = require("./api/song");

// services
const AlbumsService = require("./services/postgres/AlbumsService");
const SongsService = require("./services/postgres/SongsService");

// validator
const AlbumsValidator = require("./validator/album");
const SongsValidator = require("./validator/song");

// Impor custom error
const ClientError = require("./exceptions/ClientError");

const init = async () => {
  const albumsService = new AlbumsService();
  const songsService = new SongsService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  await server.register({
    plugin: albumsPlugin,
    options: {
      service: albumsService,
      validator: AlbumsValidator,
    },
  });

  await server.register({
    plugin: songsPlugin,
    options: {
      service: songsService,
      validator: SongsValidator,
    },
  });

  // Menerapkan extension untuk penanganan error global
  server.ext("onPreResponse", (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: "fail",
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      if (!response.isServer) {
        return h.continue;
      }

      console.error(response);
      const newResponse = h.response({
        status: "error",
        message: "Maaf, terjadi kegagalan pada server kami.",
      });
      newResponse.code(500);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
