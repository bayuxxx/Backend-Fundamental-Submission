const AlbumHandler = require("./handlers");
const routes = require("./routes");

module.exports = {
  name: "albums",
  version: "1.0.0",
  register: async (server, { service, storageService, validator }) => {
    const albumHandler = new AlbumHandler(service, storageService, validator);
    server.route(routes(albumHandler));
  },
};
