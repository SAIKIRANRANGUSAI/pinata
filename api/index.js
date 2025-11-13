const { createNestServer } = require("../dist/main");

let server;

module.exports = async (req, res) => {
  if (!server) {
    server = await createNestServer();
  }
  server(req, res);
};
