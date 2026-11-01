import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("DALICheck", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});
