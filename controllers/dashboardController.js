import { Op } from "sequelize";
import { Product } from "../models/Product.js";

const getExpiryBoundaries = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const warn = new Date(now);
  warn.setDate(warn.getDate() + 7);
  return { now, warn };
};

export const dashboardPage = async (req, res) => {
  const { now, warn } = getExpiryBoundaries();

  const [total, expired, warning, good] = await Promise.all([
    Product.count(),
    Product.count({ where: { expirationDate: { [Op.lt]: now } } }),
    Product.count({ where: { expirationDate: { [Op.between]: [now, warn] } } }),
    Product.count({ where: { expirationDate: { [Op.gt]: warn } } }),
  ]);

  const nearExpiry = await Product.findAll({
    where: { expirationDate: { [Op.between]: [now, warn] } },
    order: [["expirationDate", "ASC"]],
    limit: 6,
  });

  const recentExpired = await Product.findAll({
    where: { expirationDate: { [Op.lt]: now } },
    order: [["expirationDate", "DESC"]],
    limit: 6,
  });

  res.render("dashboard", {
    title: "Dashboard",
    total, expired, warning, good,
    nearExpiry:     nearExpiry.map(p => ({ ...p.toJSON(), daysLeft: daysBetween(now, p.expirationDate) })),
    recentExpired:  recentExpired.map(p => ({ ...p.toJSON(), daysAgo: daysBetween(p.expirationDate, now) })),
    isAdmin:   req.session.userRole === "admin",
    isStaff:   req.session.userRole === "staff",
    userName:  req.session.userName,
    userRole:  req.session.userRole,
  });
};

const daysBetween = (from, to) => {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0,0,0,0);
  b.setHours(0,0,0,0);
  return Math.round(Math.abs(b - a) / 86400000);
};
