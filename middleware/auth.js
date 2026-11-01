export const requireLogin = (req, res, next) => {
  if (!req.session.userId) return res.redirect("/login");
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.session.userId) return res.redirect("/login");
  if (req.session.userRole !== "admin") return res.status(403).send("Administrator access required.");
  next();
};

export const requireStaff = (req, res, next) => {
  if (!req.session.userId) return res.redirect("/login");
  if (!["admin", "staff"].includes(req.session.userRole)) return res.status(403).send("Staff access required.");
  next();
};
