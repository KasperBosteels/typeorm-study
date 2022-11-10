import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { Users } from "./User";

@Entity()
export class Password_Reset extends BaseEntity {
  @PrimaryColumn("varchar", {
    name: "token",
    unique: true,
    nullable: false,
  })
  Token: string;

  @OneToOne(() => Users, { nullable: false, cascade: false })
  @JoinColumn({ name: "user" })
  user: Users;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;
}
