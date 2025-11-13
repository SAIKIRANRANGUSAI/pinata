const createServer = require("../dist/main").default;

module.exports = async (req, res) => {
  const server = await createServer();
  return server(req, res);
};
