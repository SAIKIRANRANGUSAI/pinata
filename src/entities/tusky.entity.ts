import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tusky_keys')
export class TuskyKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  accessToken: string;

  @Column({ nullable: true })
  serverUrl: string;

  @Column({ type: 'json', nullable: true })
  apiResponse: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('tusky_images')
export class TuskyImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  mimeType: string;

  @Column({ nullable: true })
  storageType: string; // ✅ used in your service

  @Column({ nullable: true })
  remoteUrl: string;

  @Column({ type: 'json', nullable: true })
  uploadResponse: Record<string, any>; // ✅ saves Walrus/Pinata response

  @CreateDateColumn()
  createdAt: Date;
}
