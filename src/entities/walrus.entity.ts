import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('walrus_uploads')
export class WalrusUpload {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column({ nullable: true })
  contentType: string;

  @Column({ nullable: true })
  walrusId: string;

  @Column({ nullable: true })
  remoteUrl: string;

  @Column({ nullable: true, type: 'text' })
  fullResponse: string; // stores entire Walrus response JSON

  @CreateDateColumn()
  createdAt: Date;
}
