import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class PinataUpload {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  contentType: string;

  @Column()
  cid: string;

  @Column()
  url: string; // ✅ important: used by EJS to show image

  @Column({ type: 'text', nullable: true })
  fullResponse: string;

  @CreateDateColumn()
  createdAt: Date;
}
