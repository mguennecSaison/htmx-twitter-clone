const Chance = require("chance");
const jwt = require("jsonwebtoken");

const secret = "secret";
const cookieName = "loginJWT";

const buildJWT = () =>
  jwt.sign({ username: new Chance().name() }, secret, { expiresIn: "1h" });

const addJWT = (res) => res.cookie(cookieName, buildJWT());

const getJWT = (req) => {
  try {
    return jwt.verify(req.cookies[cookieName], secret, {});
  } catch {}
};

module.exports = { buildJWT, addJWT, getJWT };
