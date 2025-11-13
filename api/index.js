const { createNestServer } = require("../dist/main");

let cachedServer;

module.exports = async (req, res) => {
  if (!cachedServer) {
    cachedServer = await createNestServer();
  }
  return cachedServer(req, res);
};
