import { IsDecimal, IsInt, IsNumberString, IsOptional } from "class-validator";

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  BaseEntity,
  CreateDateColumn,
} from "typeorm";
import { Device } from "./Device";
@Entity()
export class Data extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "dataid" })
  dataId: number;

  @ManyToOne((type) => Device, (device) => device.data, { nullable: false })
  device!: Device;

  @Column("numeric", {
    nullable: true,
    unique: false,
    unsigned: false,
    name: "day",
  })
  @IsOptional()
  @IsInt()
  day!: number;

  @Column("numeric", {
    nullable: true,
    unique: false,
    unsigned: false,
    name: "night",
  })
  @IsOptional()
  @IsInt()
  night!: number;

  @CreateDateColumn()
  created_at: Date;
}
