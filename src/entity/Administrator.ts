import {
  Entity,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  BaseEntity,
} from "typeorm";
import { Users } from "./User";
@Entity()
export class Administrator extends BaseEntity {
  @PrimaryGeneratedColumn()
  adminId!: number;

  @OneToOne((type) => Users, { nullable: false })
  @JoinColumn({ name: "user" })
  user!: Users;
}
