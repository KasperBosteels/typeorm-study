import { IsEmail, IsOptional, IsPhoneNumber, Length } from "class-validator";
import {
  Entity,
  Column,
  BaseEntity,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
  BeforeUpdate,
  BeforeInsert,
} from "typeorm";
import { Crypt } from "../crypt";
import { Device } from "./Device";
export enum Colors {
  RED="red",
  GREEN="green",
  BLUE="blue"
}
@Entity()
export class Users extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "userid" })
  userId: number;

  @Column("varchar", {
    unique: false,
    nullable: false,
    name: "firstname",
    length: 50,
  })
  @Length(3, 50)
  firstname: string;

  @Column("varchar", {
    unique: false,
    nullable: false,
    name: "lastname",
    length: 50,
  })
  @Length(3, 50)
  lastname: string;

  @Column("varchar", {
    length: 50,
    nullable: false,
    unique: true,
    name: "email",
  })
  @IsEmail()
  email!: string;

  @Column("varchar", {
    nullable: true,
    unique: true,
    name: "number",
    length: 12,
  })
  @Length(12, 12)
  @IsPhoneNumber("BE")
  phone!: string;

  @OneToMany(() => Device, (device) => device.deviceId, {
    nullable: true,
    cascade: ["insert", "update", "remove"],
  })
  @JoinColumn({ name: "device" })
  device: Device[];

  @Column("text", { nullable: false, unique: false, name: "hashedPassword" })
  @Length(5)
  password!: string;

  @Column("enum",{enum:Colors,default:Colors.RED, name:"colorDay",nullable:true})
  @IsOptional()
  colorDay:Colors;

  @Column("enum",{enum:Colors,default:Colors.BLUE,name:"colorNight",nullable:true})
  @IsOptional()
  colorNight:Colors;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    return (
      this.password &&
      (await new Promise((resolve, reject) => {
        let hashedPassword = Crypt.encrypt(this.password);
        hashedPassword
          ? resolve((this.password = hashedPassword))
          : reject(
              console.log("hashing the password failed: " + hashedPassword)
            );
      }))
    );
  }
}
