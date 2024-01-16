const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const pug = require("pug");
const { v4 } = require("uuid");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
const compression = require("compression");
const { getJWT, addJWT } = require("./common/login");

const app = express();
const expressWs = require("express-ws")(app);
const PORT = process.env.PORT || 3000;

const tweetChannel = expressWs.getWss("/tweet");

const tweets = [];

const addTweet = (message, username) => {
  const tweet = {
    id: v4(),
    message,
    username,
    retweets: 0,
    likes: 0,
    time: dayjs().to(dayjs(new Date().toString())),
    avatar:
      "https://ui-avatars.com/api/?background=random&rounded=true&name=" +
      username,
  };
  tweets.push(tweet);
  const markup = pug.compileFile("views/components/post.pug", {
    globals: ["global"],
  })({ t: tweet });

  tweetChannel.clients.forEach((client) => client.send(markup));
  return markup;
};

dayjs.extend(relativeTime);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "pug");

app.use(express.static(__dirname + "/assets"));
app.use(compression());

app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", (req, res) => {
  addJWT(res);
  res.setHeader("HX-Redirect", "/").sendStatus(302);
});

app.use(function (req, res, next) {
  const jwt = getJWT(req);
  if (!jwt) {
    res.setHeader("HX-Redirect", "/login").redirect("/login");
  } else {
    res.locals.user = jwt
    next();
  }
});

app.get("/", (req, res) => {
  const { username } = res.locals.user;
  res.render("index", { name: username, tweets });
});

app.get("/posts", (req, res) => {
  res.render("components/posts", { tweets });
});

app.ws("/tweet", function (ws, req, res) {
  ws.on("message", function (msg) {
    const username = getJWT(req)?.username;
    if (username) {
      const { message } = JSON.parse(msg);
      addTweet(message, username);
    } else {
      ws.send(JSON.stringify({HEADERS: {'HX-Redirect': '/login'}}))
    }
  });
});

app.post("/like/:id", (req, res) => {
  const { id } = req.params;
  const tweet = tweets.find((t) => t.id === id);
  tweet.likes += 1;

  const likes = pug.compileFile("views/components/likes.pug");
  const markup = likes({ t: tweet });
  tweetChannel.clients.forEach((client) => client.send(markup));
  res.send(markup);
});

app.post("/retweet/:id", (req, res) => {
  const { id } = req.params;
  const tweet = tweets.find((t) => t.id === id);
  tweet.retweets += 1;

  const retweets = pug.compileFile("views/components/retweets.pug");
  const markup = retweets({ t: tweet });
  tweetChannel.clients.forEach((client) => client.send(markup));
  res.send(markup);
});

app.listen(PORT);
console.log("root app listening on port: 3000");
