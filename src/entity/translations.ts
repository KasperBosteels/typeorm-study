import { Length } from "class-validator/";
import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity()
export class Translations {
  @PrimaryColumn("varchar", {
    length: 2,
    nullable: false,
    unique: true,
    name: "lang_key",
  })
  @Index()
  @Length(2, 2)
  language: string;

  @Column("varchar", { length: 15 })
  nativeName: string;

  @Column("longtext")
  text: string;
}
