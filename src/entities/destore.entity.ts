import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class DeStoreFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  remote_path: string;

  @Column()
  url: string;

  @Column('bigint')
  size: number;

  @Column({ type: 'tinyint', default: 0 })
  chunked: number;

  @CreateDateColumn()
  created_at: Date;
}
