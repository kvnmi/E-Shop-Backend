const jwtAuth = require("express-jwt");

const authAPiCalls = () => {
  const secret = process.env.secret;
  return jwtAuth({
    secret,
    algorithms: ["HS256"],
    isRevoked: async (req, payload, done) => {
      if (!payload.isAdmin) done(null, true); // For non admins // First parameter could also be error message
      done(); // Else return done without parameters. (Hover to see properties of done method)
    },
  }).unless({
    path: [
      {
        url: /\/api\/v1\/products(.*)/,
        method: ["GET", "OPTIONS"],
      },
      {
        url: /\/api\/v1\/categories(.*)/,
        method: ["GET", "OPTIONS"],
      },
      "/api/v1/users/login",
    ],
  });
};

module.exports = authAPiCalls;
