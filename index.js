import express from "express";
import path from "path";
import session from "express-session";
import flash from "connect-flash";
import router from "./routes/index.js";
import fs from "fs";
import hbs from "hbs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

hbs.registerHelper("eq",  (a, b) => a === b);
hbs.registerHelper("ne",  (a, b) => a !== b);
hbs.registerHelper("lt",  (a, b) => a < b);
hbs.registerHelper("lte", (a, b) => a <= b);
hbs.registerHelper("and", (a, b) => a && b);
hbs.registerHelper("or",  (a, b) => a || b);
hbs.registerHelper("abs", (n) => Math.abs(n));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));

app.use(session({
  secret: "dalicheck-secret-key",
  resave: false,
  saveUninitialized: false,
}));
app.use(flash());

app.engine("xian", async (filePath, options, callback) => {
  try {
    hbs.partialsDir = path.join(__dirname, "views", "partials");
    const result = await new Promise((resolve, reject) => {
      hbs.__express(filePath, options, (err, html) => err ? reject(err) : resolve(html));
    });
    callback(null, result);
  } catch (err) {
    callback(err);
  }
});

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg   = req.flash("error_msg");
  next();
});

app.set("views",       path.join(__dirname, "views"));
app.set("view engine", "xian");

const partialsDir = path.join(__dirname, "views/partials");
try {
  fs.readdirSync(partialsDir)
    .filter(f => f.endsWith(".xian"))
    .forEach(f => {
      const name = f.replace(/\.xian$/, "");
      hbs.registerPartial(name, fs.readFileSync(path.join(partialsDir, f), "utf8"));
    });
} catch (err) {
  console.error("Could not register view partials:", err);
  throw err;
}

app.use("/", router);

export default app;

export const startServer = (port = PORT) => new Promise((resolve, reject) => {
  const server = app.listen(port, () => {
    console.log(`🛒 DALICheck running at http://localhost:${port}`);
    resolve(server);
  });
  server.on("error", reject);
});

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) startServer();
