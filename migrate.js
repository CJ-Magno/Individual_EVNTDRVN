import { Sequelize } from "sequelize";
import { sequelize } from "./models/db.js";
import { User } from "./models/userModel.js";
import { Product } from "./models/Product.js";
import inquirer from "inquirer";

const rootSequelize = new Sequelize("mysql://root:@localhost:3306/");

const { createDb } = await inquirer.prompt([{
  type: "confirm",
  name: "createDb",
  message: "Database 'DALICheck' may not exist. Create it?",
  default: true,
}]);

if (createDb) {
  await rootSequelize.query("CREATE DATABASE IF NOT EXISTS DALICheck;");
  console.log("✅ Database 'DALICheck' created (if it did not exist).");
}

try {
  await sequelize.authenticate();
  console.log("✅ Connected to MySQL.");
  await sequelize.sync({ force: true });
  console.log("✅ Tables created for User and Product.");
} catch (err) {
  console.error("❌ Migration failed:", err);
} finally {
  await rootSequelize.close();
  process.exit();
}
