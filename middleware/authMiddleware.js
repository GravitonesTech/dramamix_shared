const lib = require("./tokenLib");

class AuthMiddleware {

  static async validateToken(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];

      if (userId) {
        req.requestContext = {
          authorizer: { id: userId }
        };
        return next();
      }

      const authHeader = req.headers.authorization === undefined
        ? req.headers.Authorization
        : req.headers.authorization;

      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).send({ message: "Unauthorized" });
      }

      const decodedToken = await lib.validateToken(token);

      if (decodedToken) {
        req.requestContext = {
          authorizer: decodedToken?.userdata
        };
        return next();
      }

      return res.status(401).send({ message: "Unauthorized" });

    } catch (err) {
      return res.status(403).json({ message: err.message });
    }
  }

}

module.exports = AuthMiddleware;
