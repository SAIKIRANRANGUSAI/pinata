const { createNestServer } = require('../dist/main');

module.exports = async (req, res) => {
  const server = await createNestServer();
  return server(req, res);
};
