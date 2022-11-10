import { IsNumberString, IsInt } from "class-validator";
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
export class TemporaryData extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "dataid" })
  index: number;

  @ManyToOne((type) => Device, (device) => device.temporary_data, {
    nullable: false,
  })
  device!: Device;

  @Column("numeric", {
    nullable: true,
    unique: false,
    unsigned: true,
    name: "day",
  })
  @IsInt()
  day!: number;

  @Column("numeric", {
    nullable: true,
    unique: false,
    unsigned: true,
    name: "night",
  })
  @IsInt()
  night!: number;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;
}
