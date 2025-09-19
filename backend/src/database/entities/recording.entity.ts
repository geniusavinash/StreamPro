import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Camera } from './camera.entity';
import { StorageTier } from '../../common/enums/storage-tier.enum';

@Entity('recordings')
export class Recording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cameraId: string;

  @Column({ length: 500 })
  filename: string;

  @Column({ length: 1000 })
  filePath: string;

  @Column({ type: 'bigint', unsigned: true })
  fileSize: number;

  @Column()
  duration: number;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column({
    type: 'text',
    default: StorageTier.HOT,
  })
  storageTier: StorageTier;

  @Column({ default: false })
  isEncrypted: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true, length: 1000 })
  cloudUrl: string;

  @Column({ nullable: true })
  signedUrlExpiresAt: Date;

  @Column({ default: 1 })
  segmentNumber: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Camera)
  @JoinColumn({ name: 'cameraId' })
  camera: Camera;
}