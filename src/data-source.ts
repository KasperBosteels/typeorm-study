import "reflect-metadata";
import { DataSource } from "typeorm";
import { Users } from "./entity/User";
import { Data } from "./entity/Data";
import { Device } from "./entity/Device";
import { Administrator } from "./entity/Administrator";
import { Translations } from "./entity/translations";
import { ContactForm } from "./entity/contact";
import { TemporaryData } from "./entity/TemporaryData";
import { Password_Reset } from "./entity/Password_Reset";
export const AppDataSource = new DataSource({
  type: "mysql",
  host: "192.168.1.46",
  port: 3306,
  username: "Cooker",
  password: "ITisathingofgloriousL0ve",
  database: "ITCASETest",
  synchronize: true,
  logging: false,
  entities: [
    Users,
    Data,
    Device,
    Administrator,
    Translations,
    TemporaryData,
    ContactForm,
    Password_Reset,
  ],
  migrations: [],
  subscribers: [],
});
