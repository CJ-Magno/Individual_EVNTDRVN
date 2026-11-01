import bcrypt from "bcrypt";
import { User, sequelize } from "../models/userModel.js";
await sequelize.sync();

export const loginPage = (req, res) => res.render("login", { title: "Sign In" });
export const registerPage = (req, res) => res.render("register", { title: "Create Account" });
export const forgotPasswordPage = (req, res) => res.render("forgotpassword", { title: "Reset Password" });

export const resetPassword = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  if (!email || !password || password.length < 6) {
    return res.status(400).send("Email and a password of at least 6 characters are required.");
  }
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).send("No account was found with that email.");
  user.password = await bcrypt.hash(password, 10);
  await user.save();
  res.redirect("/login");
};

export const dashboardPage = (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  res.redirect("/dashboard");
};

export const loginUser = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;
  if (!email || !password) return res.status(400).send("Email and password are required.");
  const user = await User.findOne({ where: { email } });
  if (!user) return res.send("User not found.");
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send("Incorrect password.");
  req.session.userId   = user.id;
  req.session.userRole = user.role;
  req.session.userName = user.name;
  res.redirect("/dashboard");
};

export const registerUser = async (req, res) => {
  const name  = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const { password, role } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).send("Name, email, and a password of at least 6 characters are required.");
  }
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) return res.status(409).send("An account with that email already exists.");
  const selectedRole = ["admin", "staff"].includes(role) ? role : "customer";
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role: selectedRole });
  req.session.userId   = user.id;
  req.session.userRole = selectedRole;
  req.session.userName = user.name;
  res.redirect("/dashboard");
};

export const logoutUser = (req, res) => {
  req.session.destroy();
  res.redirect("/login");
};
