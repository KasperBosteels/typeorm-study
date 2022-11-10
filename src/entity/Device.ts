import { Length, IsOptional } from "class-validator";
import {
  Entity,
  OneToMany,
  BaseEntity,
  Column,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Data } from "./Data";
import { TemporaryData } from "./TemporaryData";
import { Users } from "./User";
@Entity()
export class Device extends BaseEntity {
  @PrimaryGeneratedColumn()
  device_index: number;

  @Column("varchar", {
    nullable: false,
    name: "deviceId",
    unique: true,
    length: 64,
  })
  @Length(64, 64)
  deviceId!: string;

  @OneToMany((type) => Data, (data) => data.device, {
    nullable: true,
    cascade: true,
  })
  @JoinColumn({ name: "data" })
  data: Data[];

  @OneToMany(() => TemporaryData, (TemData) => TemData.device, {
    nullable: true,
    cascade: true,
  })
  @JoinColumn({ name: "temporary_data" })
  temporary_data: TemporaryData[];

  @Column("varchar", {
    nullable: true,
    length: 50,
    unique: false,
    name: "deviceAlias",
  })
  @IsOptional()
  @Length(1, 50)
  friendlyName: string;

  @ManyToOne(() => Users, (users) => users.device, {
    nullable: true,
  })
  @JoinColumn({ name: "userId" })
  user!: Users;
}
