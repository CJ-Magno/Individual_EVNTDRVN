import bcrypt from "bcrypt";
import { User } from "../models/userModel.js";

export const adminUsers = async (req, res) => {
  const users = await User.findAll({
    attributes: ["id", "name", "email", "role", "createdAt"],
    order: [["createdAt", "DESC"]],
  });
  res.render("admin-users", {
    title: "User Management",
    users: users.map(u => u.toJSON()),
    isAdmin: true,
    currentUserId: req.session.userId,
    userName: req.session.userName,
  });
};

export const createUser = async (req, res) => {
  const name  = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const role = ["admin", "staff", "customer"].includes(req.body.role) ? req.body.role : "customer";

  if (!name || !email || !password || password.length < 6) {
    req.flash("error_msg", "Name, email, and a password of at least 6 characters are required.");
    return res.redirect("/admin/users");
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    req.flash("error_msg", "An account with that email already exists.");
    return res.redirect("/admin/users");
  }

  await User.create({ name, email, password: await bcrypt.hash(password, 10), role });
  req.flash("success_msg", "User created successfully.");
  res.redirect("/admin/users");
};

export const updateUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) { req.flash("error_msg", "User not found."); return res.redirect("/admin/users"); }

  const name  = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  if (!name || !email) { req.flash("error_msg", "Name and email are required."); return res.redirect("/admin/users"); }

  const dup = await User.findOne({ where: { email } });
  if (dup && dup.id !== user.id) { req.flash("error_msg", "That email is already in use."); return res.redirect("/admin/users"); }

  user.name  = name;
  user.email = email;
  user.role  = ["admin", "staff", "customer"].includes(req.body.role) ? req.body.role : "customer";

  if (password) {
    if (password.length < 6) { req.flash("error_msg", "New password must be at least 6 characters."); return res.redirect("/admin/users"); }
    user.password = await bcrypt.hash(password, 10);
  }
  await user.save();
  req.flash("success_msg", "User updated successfully.");
  res.redirect("/admin/users");
};

export const deleteUser = async (req, res) => {
  if (String(req.params.id) === String(req.session.userId)) {
    req.flash("error_msg", "You cannot delete your own account.");
    return res.redirect("/admin/users");
  }
  const user = await User.findByPk(req.params.id);
  if (!user) { req.flash("error_msg", "User not found."); return res.redirect("/admin/users"); }
  await user.destroy();
  req.flash("error_msg", "User deleted.");
  res.redirect("/admin/users");
};
