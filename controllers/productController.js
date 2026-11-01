import { Op } from "sequelize";
import { Product, sequelize } from "../models/Product.js";
import fs from "node:fs/promises";
import path from "node:path";

await sequelize.sync();

const removeImage = async (image) => {
  if (!image?.startsWith("/uploads/")) return;
  try { await fs.unlink(path.join(process.cwd(), "public", image)); } catch (e) { if (e.code !== "ENOENT") throw e; }
};

const computeStatus = (expirationDate) => {
  const now = new Date(); now.setHours(0,0,0,0);
  const exp = new Date(expirationDate); exp.setHours(0,0,0,0);
  const days = Math.ceil((exp - now) / 86400000);
  if (days < 0)  return "expired";
  if (days <= 7) return "warning";
  return "good";
};

const enrichProduct = (p) => {
  const obj = p.toJSON();
  const now = new Date(); now.setHours(0,0,0,0);
  const exp = new Date(obj.expirationDate); exp.setHours(0,0,0,0);
  obj.daysLeft = Math.ceil((exp - now) / 86400000);
  obj.status   = computeStatus(obj.expirationDate);
  obj.isExpired = obj.status === "expired";
  obj.isWarning = obj.status === "warning";
  obj.isGood    = obj.status === "good";
  obj.isRecalled = obj.qualityStatus === "recalled";
  return obj;
};

export const monitorPage = async (req, res) => {
  const filter = req.query.filter || "all";
  const now = new Date(); now.setHours(0,0,0,0);
  const warn = new Date(now); warn.setDate(warn.getDate() + 7);

  const where = {};
  if (filter === "expired") where.expirationDate = { [Op.lt]: now };
  else if (filter === "warning") where.expirationDate = { [Op.between]: [now, warn] };
  else if (filter === "good") where.expirationDate = { [Op.gt]: warn };
  else if (filter === "recalled") where.qualityStatus = "recalled";

  const products = await Product.findAll({ where, order: [["expirationDate", "ASC"]] });

  res.render("monitor", {
    title: "Expiry Monitor",
    products: products.map(enrichProduct),
    filter,
    isAdmin:  req.session.userRole === "admin",
    isStaff:  req.session.userRole === "staff",
    userName: req.session.userName,
    userRole: req.session.userRole,
  });
};

export const productList = async (req, res) => {
  const products = await Product.findAll({ order: [["createdAt", "DESC"]] });
  res.render("products", {
    title: "Products",
    products: products.map(enrichProduct),
    isAdmin:   req.session.userRole === "admin",
    isStaff:   req.session.userRole === "staff",
    userName:  req.session.userName,
    userRole:  req.session.userRole,
  });
};

export const adminProducts = async (req, res) => {
  const products = await Product.findAll({ order: [["createdAt", "DESC"]] });
  res.render("admin", {
    title: "Product Management",
    products: products.map(enrichProduct),
    isAdmin: true,
    userName: req.session.userName,
  });
};

export const createProduct = async (req, res) => {
  const name           = req.body.name?.trim();
  const category       = req.body.category?.trim() || "General";
  const description    = req.body.description?.trim() || "";
  const price          = Number(req.body.price);
  const stock          = Number(req.body.stock) || 0;
  const barcode        = req.body.barcode?.trim() || null;
  const supplier       = req.body.supplier?.trim() || null;
  const manufacturedDate = req.body.manufacturedDate || null;
  const expirationDate = req.body.expirationDate;

  if (!name || !Number.isFinite(price) || price < 0 || !expirationDate) {
    req.flash("error_msg", "Product name, a valid price, and expiration date are required.");
    return res.redirect("/admin");
  }

  const qualityStatus = computeStatus(expirationDate);

  await Product.create({
    name, category, description, price, stock, barcode, supplier,
    manufacturedDate, expirationDate, qualityStatus,
    image: req.file ? `/uploads/${req.file.filename}` : null,
  });
  req.flash("success_msg", "Product added successfully.");
  res.redirect("/admin");
};

export const updateProduct = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).send("Product not found.");

  const name           = req.body.name?.trim();
  const category       = req.body.category?.trim() || "General";
  const description    = req.body.description?.trim() || "";
  const price          = Number(req.body.price);
  const stock          = Number(req.body.stock) || 0;
  const barcode        = req.body.barcode?.trim() || null;
  const supplier       = req.body.supplier?.trim() || null;
  const manufacturedDate = req.body.manufacturedDate || null;
  const expirationDate = req.body.expirationDate;

  if (!name || !Number.isFinite(price) || price < 0 || !expirationDate) {
    req.flash("error_msg", "Product name, valid price, and expiration date are required.");
    return res.redirect("/admin");
  }

  const oldImage = product.image;
  product.name           = name;
  product.category       = category;
  product.description    = description;
  product.price          = price;
  product.stock          = stock;
  product.barcode        = barcode;
  product.supplier       = supplier;
  product.manufacturedDate = manufacturedDate;
  product.expirationDate = expirationDate;
  product.qualityStatus  = req.body.qualityStatus || computeStatus(expirationDate);
  if (req.file) product.image = `/uploads/${req.file.filename}`;

  await product.save();
  if (req.file) await removeImage(oldImage);
  req.flash("success_msg", "Product updated successfully.");
  res.redirect("/admin");
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).send("Product not found.");
  const image = product.image;
  await product.destroy();
  await removeImage(image);
  req.flash("error_msg", "Product deleted.");
  res.redirect("/admin");
};

export const updateStatus = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).send("Product not found.");
  const { qualityStatus } = req.body;
  if (!["good", "warning", "expired", "recalled"].includes(qualityStatus)) {
    return res.status(400).send("Invalid status.");
  }
  product.qualityStatus = qualityStatus;
  await product.save();
  req.flash("success_msg", "Product status updated.");
  res.redirect(req.headers.referer || "/monitor");
};
