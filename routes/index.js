import express from "express";
import { upload } from "../middleware/upload.js";
import { requireAdmin, requireLogin, requireStaff } from "../middleware/auth.js";

import {
  loginPage, registerPage, forgotPasswordPage, resetPassword,
  loginUser, registerUser, logoutUser,
} from "../controllers/authController.js";

import { dashboardPage } from "../controllers/dashboardController.js";

import {
  productList, adminProducts, monitorPage,
  createProduct, updateProduct, deleteProduct, updateStatus,
} from "../controllers/productController.js";

import { adminUsers, createUser, updateUser, deleteUser } from "../controllers/userController.js";

const router = express.Router();

router.get("/", (req, res) => res.redirect("/login"));

// Auth
router.get("/login",           loginPage);
router.post("/login",          loginUser);
router.get("/register",        registerPage);
router.post("/register",       registerUser);
router.get("/forgot-password", forgotPasswordPage);
router.post("/forgot-password", resetPassword);
router.get("/logout",          logoutUser);

// Shared (login required)
router.get("/dashboard", requireLogin, dashboardPage);
router.get("/products",  requireLogin, productList);
router.get("/monitor",   requireLogin, monitorPage);

// Admin – product management
router.get("/admin",                       requireAdmin, adminProducts);
router.post("/admin/products",             requireAdmin, upload.single("image"), createProduct);
router.post("/admin/products/:id/update",  requireAdmin, upload.single("image"), updateProduct);
router.post("/admin/products/:id/delete",  requireAdmin, deleteProduct);
router.post("/admin/products/:id/status",  requireStaff, updateStatus);

// Admin – user management
router.get("/admin/users",              requireAdmin, adminUsers);
router.post("/admin/users",             requireAdmin, createUser);
router.post("/admin/users/:id/update",  requireAdmin, updateUser);
router.post("/admin/users/:id/delete",  requireAdmin, deleteUser);

export default router;
