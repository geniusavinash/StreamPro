import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Recording } from './recording.entity';

export enum StreamStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CONNECTING = 'connecting',
  READY = 'ready',
  ERROR = 'error',
}

@Entity('cameras')
export class Camera {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  company: string;

  @Column({ length: 255 })
  model: string;

  @Column({ unique: true, length: 255 })
  serialNumber: string;

  @Column({ length: 500 })
  location: string;

  @Column({ length: 500 })
  place: string;

  @Column({ length: 1000 })
  rtmpUrl: string;

  @Column({ length: 255 })
  rtmpKey: string;

  @Column({ nullable: true, length: 255 })
  streamKey: string;

  @Column({ nullable: true, length: 255 })
  assignedNode: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isRecording: boolean;

  @Column({
    type: 'text',
    default: StreamStatus.OFFLINE,
  })
  streamStatus: StreamStatus;

  @Column({ nullable: true })
  lastSeenAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // @OneToMany(() => Recording, (recording) => recording.camera)
  // recordings: Recording[]; // Disabled for now
}