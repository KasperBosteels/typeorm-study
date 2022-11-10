import { IsEmail, Length } from "class-validator";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class ContactForm extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: "contactId",
  })
  contactId: number;

  @Column("varchar", { name: "email" })
  @IsEmail()
  email: string;

  @Column("varchar", {
    nullable: false,
    unique: false,
    length: 100,
    name: "topic",
  })
  @Length(4, 100)
  message_topic: string;

  @Column("varchar", {
    nullable: false,
    unique: false,
    name: "message",
  })
  @Length(5, 255)
  message: string;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;
}
