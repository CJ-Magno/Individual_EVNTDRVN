import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Product = sequelize.define("Product", {
  name:            { type: DataTypes.STRING(200), allowNull: false },
  category:        { type: DataTypes.STRING(100), allowNull: false, defaultValue: "General" },
  description:     { type: DataTypes.TEXT, allowNull: true, defaultValue: "" },
  price:           { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  stock:           { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  image:           { type: DataTypes.STRING, allowNull: true },
  barcode:         { type: DataTypes.STRING(100), allowNull: true },
  supplier:        { type: DataTypes.STRING(200), allowNull: true },
  manufacturedDate:{ type: DataTypes.DATEONLY, allowNull: true },
  expirationDate:  { type: DataTypes.DATEONLY, allowNull: false },
  qualityStatus:   {
    type: DataTypes.ENUM("good", "warning", "expired", "recalled"),
    allowNull: false,
    defaultValue: "good",
  },
});

export { sequelize };
