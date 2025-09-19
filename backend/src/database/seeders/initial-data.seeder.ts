import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

export class InitialDataSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { username: 'admin' },
    });

    if (!existingAdmin) {
      // Create default admin user
      const adminUser = new User();
      adminUser.username = 'admin';
      adminUser.passwordHash = await bcrypt.hash('admin123', 10);
      adminUser.role = UserRole.ADMIN;
      adminUser.isActive = true;

      await userRepository.save(adminUser);
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    }

    // Create demo viewer user
    const existingViewer = await userRepository.findOne({
      where: { username: 'viewer' },
    });

    if (!existingViewer) {
      const viewerUser = new User();
      viewerUser.username = 'viewer';
      viewerUser.passwordHash = await bcrypt.hash('viewer123', 10);
      viewerUser.role = UserRole.VIEWER;
      viewerUser.isActive = true;

      await userRepository.save(viewerUser);
      console.log('✅ Demo viewer user created (username: viewer, password: viewer123)');
    }

    // Create demo operator user
    const existingOperator = await userRepository.findOne({
      where: { username: 'operator' },
    });

    if (!existingOperator) {
      const operatorUser = new User();
      operatorUser.username = 'operator';
      operatorUser.passwordHash = await bcrypt.hash('operator123', 10);
      operatorUser.role = UserRole.OPERATOR;
      operatorUser.isActive = true;

      await userRepository.save(operatorUser);
      console.log('✅ Demo operator user created (username: operator, password: operator123)');
    }

    console.log('🌱 Database seeding completed!');
  }
}