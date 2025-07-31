require("dotenv").config();

const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");
const path = require("path");
const Inert = require("@hapi/inert");

// plugin
const albumsPlugin = require("./api/album");
const songsPlugin = require("./api/song");
const usersPlugin = require("./api/users");
const authenticationsPlugin = require("./api/authentications");
const playlistsPlugin = require("./api/playlists");
const collaborationsPlugin = require("./api/collaborations");
const exportsPlugin = require("./api/exports");
// const uploadsPlugin = require("./api/uploads"); 

// services
const AlbumsService = require("./services/postgres/AlbumsService");
const SongsService = require("./services/postgres/SongsService");
const UsersService = require("./services/postgres/UsersService");
const AuthenticationsService = require("./services/postgres/AuthenticationsService");
const PlaylistsService = require("./services/postgres/PlaylistsService");
const CollaborationsService = require("./services/postgres/CollaborationsService");
const StorageService = require("./services/storage/StorageService");
const CacheService = require("./services/redis/CacheService"); 
const ProducerService = require("./services/rabbitmq/ProducerService");


// validator
const AlbumsValidator = require("./validator/album");
const SongsValidator = require("./validator/song");
const UsersValidator = require("./validator/user");
const AuthenticationsValidator = require("./validator/authentication");
const PlaylistsValidator = require("./validator/playlists");
const CollaborationsValidator = require("./validator/collaborations");
const ExportsValidator = require("./validator/exports");
// const UploadsValidator = require("./validator/uploads"); 

// tokenize
const TokenManager = require("./tokenize/TokenManager");

// Impor custom error
const ClientError = require("./exceptions/ClientError");

const init = async () => {
  const cacheService = new CacheService();
  const collaborationsService = new CollaborationsService();
  const playlistsService = new PlaylistsService(collaborationsService);
  const albumsService = new AlbumsService(cacheService);
  const songsService = new SongsService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const storageService = new StorageService(
    path.resolve(__dirname, "uploads/images"),
  );

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);
  
  server.auth.strategy("openmusic_jwt", "jwt", {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: 86400,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  
  await server.register([
    {
      plugin: albumsPlugin,
      options: {
        service: albumsService,
        storageService : storageService,
        validator: AlbumsValidator,
      },
    },
    // {
    //   plugin: uploadsPlugin,
    //   options: {
    //     storageService,
    //     validator: UploadsValidator,
    //   },
    // },
    {
      plugin: songsPlugin,
      options: {
        service: songsService,
        validator: SongsValidator,
      },
    },
    {
      plugin: usersPlugin,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authenticationsPlugin,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlistsPlugin,
      options: {
        service: playlistsService,
        validator: PlaylistsValidator,
      },
    },
    {
      plugin: collaborationsPlugin,
      options: {
        collaborationsService,
        playlistsService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: exportsPlugin,
      options: {
        producerService: ProducerService,
        playlistsService,
        validator: ExportsValidator,
      },
    },
  ]);

  server.route({
    method: "GET",
    path: "/uploads/{param*}",
    handler: {
      directory: {
        path: path.resolve(__dirname, "uploads"),
      },
    },
  });

  server.ext("onPreResponse", (request, h) => {
    const { response } = request;

    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: "fail",
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    if (response.isBoom) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.output.statusCode);
      return newResponse;
    }
    
    if (response instanceof Error) {
        console.error(response);
        const newResponse = h.response({
            status: 'error',
            message: 'Maaf, terjadi kegagalan pada server kami.',
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