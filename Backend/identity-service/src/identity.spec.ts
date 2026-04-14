/**
 * ============================================================
 *  IDENTITY SERVICE - BVA Integration Test Suite (111 Cases)
 *  Chạy: npm run test
 * ============================================================
 */

const request = require('supertest');
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';

// Controllers
import { AuthController } from './auth/auth.controller';
import { UsersController } from './users/users.controller';

// Services (for DI tokens)
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { EmailService } from './common/services/email.service';

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// ─── Helper: common exception filter ─────────────────────────────────────────
const exceptionFilter = {
  catch(exception: any, host: any) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.status || exception.getStatus?.() || 500;
    response.status(status).json({ statusCode: status, message: exception.message });
  },
} as any;

// ─── Helper: create app from AuthController ───────────────────────────────────
async function createAuthApp(
  mockAuthService: object,
  mockUsersService: object,
  guardOverrides?: { guard: any; value: any }[],
): Promise<INestApplication> {
  let builder = Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      { provide: AuthService, useValue: mockAuthService },
      { provide: UsersService, useValue: mockUsersService },
    ],
  });

  for (const override of guardOverrides ?? []) {
    builder = builder.overrideGuard(override.guard).useValue(override.value) as any;
  }

  const moduleFixture: TestingModule = await builder.compile();
  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(exceptionFilter);
  await app.init();
  return app;
}

// ─── Helper: create app from UsersController ──────────────────────────────────
async function createUsersApp(
  mockUsersService: object,
  mockEmailService: object = {},
  guardOverrides?: { guard: any; value: any }[],
): Promise<INestApplication> {
  let builder = Test.createTestingModule({
    controllers: [UsersController],
    providers: [
      { provide: UsersService, useValue: mockUsersService },
      { provide: AuthService, useValue: {} },
      { provide: EmailService, useValue: mockEmailService },
    ],
  });

  for (const override of guardOverrides ?? []) {
    builder = builder.overrideGuard(override.guard).useValue(override.value) as any;
  }

  const moduleFixture: TestingModule = await builder.compile();
  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(exceptionFilter);
  await app.init();
  return app;
}

// ═══════════════════════════════════════════════════════════════
//  MODULE AUTH
// ═══════════════════════════════════════════════════════════════

// ─── BVA 1.x ─ Register ──────────────────────────────────────────────────────
describe('Auth | POST /auth/register - BVA_1 (14 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createAuthApp(
      {
        register: jest.fn().mockImplementation((dto) => {
          if (dto.fullName?.length > 50) throw new Error('varchar(50)');
          if (dto.email?.length > 150) throw new Error('varchar(150)');
          if (dto.password?.length > 255) throw new Error('varchar(255)');
          return Promise.resolve({ message: 'Mock Success', user: { id: 1, email: dto.email } });
        }),
      },
      {},
    );
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('BVA_1.1 (Min-1): Password 5 ký tự → 400', () =>
    request(app.getHttpServer()).post('/auth/register')
      .send({ email: 'bva1.1@gmail.com', password: '12345', fullName: 'Nguyễn Văn A' }).expect(400));

  it('BVA_1.2 (Min): Password 6 ký tự → 201', () =>
    request(app.getHttpServer()).post('/auth/register')
      .send({ email: 'bva1.2@gmail.com', password: '123456', fullName: 'Nguyễn Văn A' }).expect(201));

  it('BVA_1.3 (Min+1): Password 7 ký tự → 201', () =>
    request(app.getHttpServer()).post('/auth/register')
      .send({ email: 'bva1.3@gmail.com', password: '1234567', fullName: 'Nguyễn Văn A' }).expect(201));

  it('BVA_1.4 (Max): fullName 50 ký tự → 201', () =>
    request(app.getHttpServer()).post('/auth/register')
      .send({ email: 'bva1.4@gmail.com', password: 'password123', fullName: 'A'.repeat(50) }).expect(201));

  it('BVA_1.5 (Max+1): fullName 51 ký tự → 400|500', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register')
      .send({ email: 'bva1.5@gmail.com', password: 'password123', fullName: 'A'.repeat(51) });
    expect([400, 500]).toContain(res.status);
  });

  it('BVA_1.6 (Max): Email 150 ký tự → 201', () => {
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(40) + '.' + 'c'.repeat(40) + '.com';
    return request(app.getHttpServer()).post('/auth/register')
      .send({ email, password: 'password123', fullName: 'Nguyễn Văn A' }).expect(201);
  });

  it('BVA_1.7 (Max+1): Email 151 ký tự → 400|500', async () => {
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(40) + '.' + 'c'.repeat(41) + '.com';
    const res = await request(app.getHttpServer()).post('/auth/register')
      .send({ email, password: 'password123', fullName: 'Nguyễn Văn A' });
    expect([400, 500]).toContain(res.status);
  });

  it('BVA_1.8: fullName rỗng → 400', () =>
    request(app.getHttpServer()).post('/auth/register')
      .send({ email: 'bva1.8@gmail.com', password: 'password123', fullName: '' }).expect(400));

  it('BVA_1.9: Password rỗng → 400', () =>
    request(app.getHttpServer()).post('/auth/register')
      .send({ email: 'bva1.9@gmail.com', password: '', fullName: 'Nguyễn Văn A' }).expect(400));

  it('BVA_1.10 (Max): Password 255 ký tự → 201', () =>
    request(app.getHttpServer()).post('/auth/register')
      .send({ email: 'bva1.10@gmail.com', password: 'A'.repeat(255), fullName: 'Nguyễn Văn A' }).expect(201));

  it('BVA_1.11 (Max+1): Password 256 ký tự → 400|500', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register')
      .send({ email: 'bva1.11@gmail.com', password: 'A'.repeat(256), fullName: 'Nguyễn Văn A' });
    expect([400, 500]).toContain(res.status);
  });

  it('BVA_1.12: fullName 1 ký tự → 400 (@MinLength 2)', () =>
    request(app.getHttpServer()).post('/auth/register')
      .send({ email: 'bva1.12@gmail.com', password: 'password123', fullName: 'A' }).expect(400));

  it('BVA_1.13: Thiếu fullName → 400', () =>
    request(app.getHttpServer()).post('/auth/register')
      .send({ email: 'bva1.13@gmail.com', password: 'password123' }).expect(400));

  it('BVA_1.14: Email có khoảng trắng 2 đầu → 201|400', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register')
      .send({ email: ' a@test.com ', password: ' password123 ', fullName: ' Nguyễn Văn A ' });
    expect([201, 400]).toContain(res.status);
  });
});

// ─── BVA 2.x ─ Login ─────────────────────────────────────────────────────────
describe('Auth | POST /auth/login - BVA_2 (10 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createAuthApp(
      {
        login: jest.fn().mockImplementation((dto) => {
          if (dto.email === 'wrong@gmail.com') throw new Error('Unauthorized');
          return Promise.resolve({ accessToken: 'mock', refreshToken: 'mock', user: { id: 1 } });
        }),
      },
      {},
    );
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('BVA_2.1 (Min-1): Password 5 ký tự → 400', () =>
    request(app.getHttpServer()).post('/auth/login')
      .send({ email: 'valid@gmail.com', password: '12345' }).expect(400));

  it('BVA_2.2 (Min): Password 6 ký tự → 201', () =>
    request(app.getHttpServer()).post('/auth/login')
      .send({ email: 'valid@gmail.com', password: '123456' }).expect(201));

  it('BVA_2.3: Email rỗng → 400', () =>
    request(app.getHttpServer()).post('/auth/login')
      .send({ email: '', password: 'password123' }).expect(400));

  it('BVA_2.4: Email có khoảng trắng → 201|400', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login')
      .send({ email: ' user@gmail.com ', password: 'password123' });
    expect([201, 400]).toContain(res.status);
  });

  it('BVA_2.5 (Nominal): Thông tin bình thường → 201', () =>
    request(app.getHttpServer()).post('/auth/login')
      .send({ email: 'valid@gmail.com', password: 'password123' }).expect(201));

  it('BVA_2.6 (Max): Password 255 ký tự → 201', () =>
    request(app.getHttpServer()).post('/auth/login')
      .send({ email: 'valid@gmail.com', password: 'A'.repeat(255) }).expect(201));

  it('BVA_2.7 (Max+1): Password 256 ký tự → 400', () =>
    request(app.getHttpServer()).post('/auth/login')
      .send({ email: 'valid@gmail.com', password: 'A'.repeat(256) }).expect(400));

  it('BVA_2.8 (Min): Email siêu ngắn a@b.co → 201', () =>
    request(app.getHttpServer()).post('/auth/login')
      .send({ email: 'a@b.co', password: 'password123' }).expect(201));

  it('BVA_2.9 (Max): Email 150 ký tự → 201', () => {
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(40) + '.' + 'c'.repeat(40) + '.com';
    return request(app.getHttpServer()).post('/auth/login')
      .send({ email, password: 'password123' }).expect(201);
  });

  it('BVA_2.10 (Max+1): Email 151 ký tự → 400', () => {
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(40) + '.' + 'c'.repeat(41) + '.com';
    return request(app.getHttpServer()).post('/auth/login')
      .send({ email, password: 'password123' }).expect(400);
  });
});

// ─── BVA 3.x ─ Refresh Token ─────────────────────────────────────────────────
describe('Auth | POST /auth/refresh-token - BVA_3 (5 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createAuthApp(
      {
        refreshToken: jest.fn().mockImplementation((dto) => {
          if (dto.refreshToken === 'expired_token') { const e: any = new Error('Expired'); e.status = 401; throw e; }
          if (dto.refreshToken === 'invalid_token')  { const e: any = new Error('Invalid'); e.status = 401; throw e; }
          return Promise.resolve({ message: 'OK' });
        }),
      },
      {},
    );
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('BVA_3.1: refreshToken rỗng → 400', () =>
    request(app.getHttpServer()).post('/auth/refresh-token').send({ refreshToken: '' }).expect(400));
  it('BVA_3.2: Token gần hết hạn → 201', () =>
    request(app.getHttpServer()).post('/auth/refresh-token').send({ refreshToken: 'almost_expired_token' }).expect(201));
  it('BVA_3.3: Token đã hết hạn → 401', () =>
    request(app.getHttpServer()).post('/auth/refresh-token').send({ refreshToken: 'expired_token' }).expect(401));
  it('BVA_3.4: Token sai cấu trúc → 401', () =>
    request(app.getHttpServer()).post('/auth/refresh-token').send({ refreshToken: 'invalid_token' }).expect(401));
  it('BVA_3.5 (Nominal): Token hợp lệ → 201', () =>
    request(app.getHttpServer()).post('/auth/refresh-token').send({ refreshToken: 'valid_normal_token' }).expect(201));
});

// ─── BVA 4.x ─ Logout ────────────────────────────────────────────────────────
describe('Auth | POST /auth/logout - BVA_4 (5 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createAuthApp(
      { logout: jest.fn().mockResolvedValue({ message: 'OK' }) },
      {},
      [{ guard: JwtAuthGuard, value: { canActivate: (ctx: any) => { ctx.switchToHttp().getRequest().user = { sub: 1 }; return true; } } }],
    );
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('BVA_4.1: refreshToken rỗng → 400', () =>
    request(app.getHttpServer()).post('/auth/logout').send({ refreshToken: '' }).expect(400));
  it('BVA_4.2: Token gần hết hạn → 201', () =>
    request(app.getHttpServer()).post('/auth/logout').send({ refreshToken: 'almost_expired_token' }).expect(201));
  it('BVA_4.3: Token hết hạn nhưng vẫn xóa OK → 201', () =>
    request(app.getHttpServer()).post('/auth/logout').send({ refreshToken: 'expired_token' }).expect(201));
  it('BVA_4.4: Token sai cấu trúc → 201', () =>
    request(app.getHttpServer()).post('/auth/logout').send({ refreshToken: 'invalid_structure_token_abc123' }).expect(201));
  it('BVA_4.5 (Nominal): Token hợp lệ → 201', () =>
    request(app.getHttpServer()).post('/auth/logout').send({ refreshToken: 'valid_normal_token' }).expect(201));
});

// ─── BVA 5.x ─ Verify Email ──────────────────────────────────────────────────
describe('Auth | POST /auth/verify-email - BVA_5 (7 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createAuthApp(
      {
        verifyEmail: jest.fn().mockImplementation((token) => {
          if (token === '000000') { const e: any = new Error('Invalid'); e.status = 401; throw e; }
          return Promise.resolve({ message: 'OK', isVerified: true });
        }),
      },
      {},
    );
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('BVA_5.1 (Min-1): OTP 5 ký tự → 400', () =>
    request(app.getHttpServer()).post('/auth/verify-email').send({ token: '99999' }).expect(400));
  it('BVA_5.2 (Min): OTP 6 ký tự (100000) → 201', () =>
    request(app.getHttpServer()).post('/auth/verify-email').send({ token: '100000' }).expect(201));
  it('BVA_5.3 (Max): OTP 6 ký tự (999999) → 201', () =>
    request(app.getHttpServer()).post('/auth/verify-email').send({ token: '999999' }).expect(201));
  it('BVA_5.4 (Max+1): OTP 7 ký tự → 400', () =>
    request(app.getHttpServer()).post('/auth/verify-email').send({ token: '1000000' }).expect(400));
  it('BVA_5.8: OTP rỗng → 400', () =>
    request(app.getHttpServer()).post('/auth/verify-email').send({ token: '' }).expect(400));
  it('BVA_5.9: OTP "000000" → 401 (fail DB check)', () =>
    request(app.getHttpServer()).post('/auth/verify-email').send({ token: '000000' }).expect(401));
  it('BVA_5.10: OTP xen chữ cái "12a456" → 400', () =>
    request(app.getHttpServer()).post('/auth/verify-email').send({ token: '12a456' }).expect(400));
});

// ─── BVA 6.x ─ Get Verification Token ────────────────────────────────────────
describe('Auth | GET /auth/get-verification-token - BVA_6 (5 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createAuthApp(
      {
        getVerificationTokenByEmail: jest.fn().mockImplementation((email) => {
          if (email === 'notfound@gmail.com') { const e: any = new Error('Not found'); e.status = 404; throw e; }
          return Promise.resolve({ email, isVerified: false });
        }),
      },
      {},
    );
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('BVA_6.1 (Min-1): Email rỗng → 400', () =>
    request(app.getHttpServer()).get('/auth/get-verification-token?email=').expect(400));
  it('BVA_6.2 (Min): Email a@b.co → 200', () =>
    request(app.getHttpServer()).get('/auth/get-verification-token?email=a@b.co').expect(200));
  it('BVA_6.3 (Max): Email 150 ký tự → 200', () => {
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(40) + '.' + 'c'.repeat(40) + '.com';
    return request(app.getHttpServer()).get(`/auth/get-verification-token?email=${email}`).expect(200);
  });
  it('BVA_6.4 (Max+1): Email 151 ký tự → 400', () => {
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(40) + '.' + 'c'.repeat(41) + '.com';
    return request(app.getHttpServer()).get(`/auth/get-verification-token?email=${email}`).expect(400);
  });
  it('BVA_6.5 (Nominal): Email hợp lệ → 200', () =>
    request(app.getHttpServer()).get('/auth/get-verification-token?email=valid@gmail.com').expect(200));
});

// ─── BVA 7.x ─ Check Session ─────────────────────────────────────────────────
describe('Auth | POST /auth/check-session - BVA_7 (5 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createAuthApp(
      {
        checkSession: jest.fn().mockImplementation((userId, refreshToken) => {
          if (refreshToken === 'expired_token' || refreshToken === 'invalid_structure') return Promise.resolve(false);
          return Promise.resolve(true);
        }),
      },
      {},
      [{ guard: JwtAuthGuard, value: { canActivate: (ctx: any) => { ctx.switchToHttp().getRequest().user = { sub: 1 }; return true; } } }],
    );
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('BVA_7.1 (Min-1): refreshToken rỗng → 400', () =>
    request(app.getHttpServer()).post('/auth/check-session').send({ refreshToken: '' }).expect(400));
  it('BVA_7.2: Token gần hết hạn → 201', () =>
    request(app.getHttpServer()).post('/auth/check-session').send({ refreshToken: 'almost_expired_token' }).expect(201));
  it('BVA_7.3: Token hết hạn → 401', () =>
    request(app.getHttpServer()).post('/auth/check-session').send({ refreshToken: 'expired_token' }).expect(401));
  it('BVA_7.4: Token sai cấu trúc → 401', () =>
    request(app.getHttpServer()).post('/auth/check-session').send({ refreshToken: 'invalid_structure' }).expect(401));
  it('BVA_7.5 (Nominal): Token hợp lệ → 201', () =>
    request(app.getHttpServer()).post('/auth/check-session').send({ refreshToken: 'valid_normal_token' }).expect(201));
});

// ─── GET /auth/me - Authorization States ─────────────────────────────────────
describe('Auth | GET /auth/me - Auth States (3 cases)', () => {
  let app: INestApplication;
  let guardShouldPass = true;
  let mockUserId = 1;

  beforeAll(async () => {
    app = await createAuthApp(
      {},
      {
        getProfile: jest.fn().mockImplementation((userId) => {
          if (userId === 999) return Promise.resolve(null);
          return Promise.resolve({ id: userId, email: 'user@test.com', fullName: 'Test', roles: [{ name: 'AUTHOR' }] });
        }),
      },
      [{
        guard: JwtAuthGuard,
        value: {
          canActivate: (context: ExecutionContext) => {
            if (!guardShouldPass) { const e: any = new Error('Unauthorized'); e.status = 401; throw e; }
            context.switchToHttp().getRequest().user = { sub: mockUserId };
            return true;
          },
        },
      }],
    );
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('Auth_Me.1: JWT Invalid → 401', () => { guardShouldPass = false; return request(app.getHttpServer()).get('/auth/me').expect(401); });
  it('Auth_Me.2: JWT OK nhưng User bị xóa → 404', () => { guardShouldPass = true; mockUserId = 999; return request(app.getHttpServer()).get('/auth/me').expect(404); });
  it('Auth_Me.3 (Nominal): Hợp lệ → 200', () => { guardShouldPass = true; mockUserId = 1; return request(app.getHttpServer()).get('/auth/me').expect(200); });
});

// ═══════════════════════════════════════════════════════════════
//  MODULE USERS
// ═══════════════════════════════════════════════════════════════

// ─── GET /users/profile - Authorization States ────────────────────────────────
describe('Users | GET /users/profile - Auth States (3 cases)', () => {
  let app: INestApplication;
  let guardShouldPass = true;
  let mockUserId = 1;

  beforeAll(async () => {
    app = await createUsersApp(
      {
        getProfile: jest.fn().mockImplementation((userId) => {
          if (userId === 999) return Promise.resolve(null);
          return Promise.resolve({ id: userId, email: 'u@t.c', fullName: 'Test User', roles: [{ name: 'AUTHOR' }] });
        }),
      },
      {},
      [{
        guard: JwtAuthGuard,
        value: {
          canActivate: (context: ExecutionContext) => {
            if (!guardShouldPass) { const e: any = new Error('Unauthorized'); e.status = 401; throw e; }
            context.switchToHttp().getRequest().user = { sub: mockUserId };
            return true;
          },
        },
      }],
    );
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('State 1: JWT sai → 401', () => { guardShouldPass = false; return request(app.getHttpServer()).get('/users/profile').expect(401); });
  it('State 2: JWT OK nhưng DB không tìm thấy → 404', () => { guardShouldPass = true; mockUserId = 999; return request(app.getHttpServer()).get('/users/profile').expect(404); });
  it('State 3 (Nominal): Hợp lệ → 200', () => { guardShouldPass = true; mockUserId = 1; return request(app.getHttpServer()).get('/users/profile').expect(200); });
});

// ─── BVA 9.x ─ Change Password ───────────────────────────────────────────────
describe('Users | PATCH /users/change-password - BVA_9 (9 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createUsersApp(
      {
        changePassword: jest.fn().mockImplementation((userId, dto) => {
          if (dto.oldPassword === dto.newPassword) { const e: any = new Error('Trùng mật khẩu'); e.status = 400; throw e; }
          return Promise.resolve();
        }),
      },
      {},
      [{ guard: JwtAuthGuard, value: { canActivate: (ctx: any) => { ctx.switchToHttp().getRequest().user = { sub: 1 }; return true; } } }],
    );
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('BVA_9.1 (Min-1): newPassword 5 ký tự → 400', () =>
    request(app.getHttpServer()).patch('/users/change-password').send({ oldPassword: 'password123', newPassword: '12345' }).expect(400));
  it('BVA_9.2 (Min): newPassword 6 ký tự → 200', () =>
    request(app.getHttpServer()).patch('/users/change-password').send({ oldPassword: 'password123', newPassword: '123456' }).expect(200));
  it('BVA_9.3 (Max): newPassword 255 ký tự → 200', () =>
    request(app.getHttpServer()).patch('/users/change-password').send({ oldPassword: 'password123', newPassword: 'a'.repeat(255) }).expect(200));
  it('BVA_9.4 (Max+1): newPassword 256 ký tự → 400', () =>
    request(app.getHttpServer()).patch('/users/change-password').send({ oldPassword: 'password123', newPassword: 'a'.repeat(256) }).expect(400));
  it('BVA_9.5: oldPassword rỗng → 400', () =>
    request(app.getHttpServer()).patch('/users/change-password').send({ oldPassword: '', newPassword: 'password123' }).expect(400));
  it('BVA_9.6: oldPassword 256 ký tự → 400', () =>
    request(app.getHttpServer()).patch('/users/change-password').send({ oldPassword: 'a'.repeat(256), newPassword: 'password123' }).expect(400));
  it('BVA_9.7 (Logical): newPassword trùng oldPassword → 400', () =>
    request(app.getHttpServer()).patch('/users/change-password').send({ oldPassword: 'password123', newPassword: 'password123' }).expect(400));
  it('BVA_9.8 (Trim): password có space → 200', () =>
    request(app.getHttpServer()).patch('/users/change-password').send({ oldPassword: 'password123', newPassword: ' password123 ' }).expect(200));
  it('BVA_9.9 (Nominal): Đúng hợp lệ → 200', () =>
    request(app.getHttpServer()).patch('/users/change-password').send({ oldPassword: 'password123', newPassword: 'newpassword123' }).expect(200));
});

// ─── BVA 11.x ─ Forgot Password ──────────────────────────────────────────────
describe('Users | POST /users/forgot-password - BVA_11 (5 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createUsersApp({ forgotPassword: jest.fn().mockResolvedValue(undefined) });
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('BVA_11.1 (Min-1): Email rỗng → 400', () =>
    request(app.getHttpServer()).post('/users/forgot-password').send({ email: '' }).expect(400));
  it('BVA_11.2 (Min): Email a@b.co → 201', () =>
    request(app.getHttpServer()).post('/users/forgot-password').send({ email: 'a@b.co' }).expect(201));
  it('BVA_11.3 (Max): Email 150 ký tự → 201', () => {
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(40) + '.' + 'c'.repeat(40) + '.com';
    return request(app.getHttpServer()).post('/users/forgot-password').send({ email }).expect(201);
  });
  it('BVA_11.4 (Max+1): Email 151 ký tự → 400', () => {
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(40) + '.' + 'c'.repeat(41) + '.com';
    return request(app.getHttpServer()).post('/users/forgot-password').send({ email }).expect(400);
  });
  it('BVA_11.5 (Nominal): Email hợp lệ → 201', () =>
    request(app.getHttpServer()).post('/users/forgot-password').send({ email: 'valid@gmail.com' }).expect(201));
});

// ─── BVA 12.x ─ Verify Reset Code ────────────────────────────────────────────
describe('Users | POST /users/verify-reset-code - BVA_12 (9 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createUsersApp({
      verifyResetCode: jest.fn().mockImplementation((email, code) => Promise.resolve(code !== '000000')),
    });
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('BVA_12.1 (Min-1): Code 5 chữ số → 400', () =>
    request(app.getHttpServer()).post('/users/verify-reset-code').send({ email: 'valid@gmail.com', code: '12345' }).expect(400));
  it('BVA_12.2 (Max+1): Code 7 chữ số → 400', () =>
    request(app.getHttpServer()).post('/users/verify-reset-code').send({ email: 'valid@gmail.com', code: '1234567' }).expect(400));
  it('BVA_12.3 (Nominal): Code 6 chữ số → 201', () =>
    request(app.getHttpServer()).post('/users/verify-reset-code').send({ email: 'valid@gmail.com', code: '123456' }).expect(201));
  it('BVA_12.4: Code rỗng → 400', () =>
    request(app.getHttpServer()).post('/users/verify-reset-code').send({ email: 'valid@gmail.com', code: '' }).expect(400));
  it('BVA_12.5: Code xen chữ cái → 400', () =>
    request(app.getHttpServer()).post('/users/verify-reset-code').send({ email: 'valid@gmail.com', code: '1a2b3c' }).expect(400));
  it('BVA_12.6: Email rỗng → 400', () =>
    request(app.getHttpServer()).post('/users/verify-reset-code').send({ email: '', code: '123456' }).expect(400));
  it('BVA_12.7 (Min): Email a@b.co → 201', () =>
    request(app.getHttpServer()).post('/users/verify-reset-code').send({ email: 'a@b.co', code: '123456' }).expect(201));
  it('BVA_12.8 (Max): Email 150 ký tự → 201', () => {
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(40) + '.' + 'c'.repeat(40) + '.com';
    return request(app.getHttpServer()).post('/users/verify-reset-code').send({ email, code: '123456' }).expect(201);
  });
  it('BVA_12.9 (Max+1): Email 151 ký tự → 400', () => {
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(40) + '.' + 'c'.repeat(41) + '.com';
    return request(app.getHttpServer()).post('/users/verify-reset-code').send({ email, code: '123456' }).expect(400);
  });
});

// ─── BVA 13.x ─ Reset Password ───────────────────────────────────────────────
describe('Users | POST /users/reset-password - BVA_13 (8 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createUsersApp({ resetPassword: jest.fn().mockResolvedValue(undefined) });
  });

  afterAll(() => app.close());
  afterEach(() => jest.clearAllMocks());

  it('BVA_13.1 (Min-1): newPassword 5 ký tự → 400', () =>
    request(app.getHttpServer()).post('/users/reset-password').send({ email: 'valid@gmail.com', code: '123456', newPassword: '12345' }).expect(400));
  it('BVA_13.2 (Min): newPassword 6 ký tự → 201', () =>
    request(app.getHttpServer()).post('/users/reset-password').send({ email: 'valid@gmail.com', code: '123456', newPassword: '123456' }).expect(201));
  it('BVA_13.3: newPassword rỗng → 400', () =>
    request(app.getHttpServer()).post('/users/reset-password').send({ email: 'valid@gmail.com', code: '123456', newPassword: '' }).expect(400));
  it('BVA_13.4 (Max): newPassword 255 ký tự → 201', () =>
    request(app.getHttpServer()).post('/users/reset-password').send({ email: 'valid@gmail.com', code: '123456', newPassword: 'a'.repeat(255) }).expect(201));
  it('BVA_13.5 (Max+1): newPassword 256 ký tự → 400', () =>
    request(app.getHttpServer()).post('/users/reset-password').send({ email: 'valid@gmail.com', code: '123456', newPassword: 'a'.repeat(256) }).expect(400));
  it('BVA_13.6: Email sai cấu trúc → 400', () =>
    request(app.getHttpServer()).post('/users/reset-password').send({ email: 'invalid_email', code: '123456', newPassword: 'newpassword' }).expect(400));
  it('BVA_13.7: Code xen chữ cái → 400', () =>
    request(app.getHttpServer()).post('/users/reset-password').send({ email: 'valid@gmail.com', code: '12a345', newPassword: 'newpassword' }).expect(400));
  it('BVA_13.8 (Nominal): Mọi thông tin hợp lệ → 201', () =>
    request(app.getHttpServer()).post('/users/reset-password').send({ email: 'valid@gmail.com', code: '123456', newPassword: 'newpassword' }).expect(201));
});

// ─── Get Reset Code ───────────────────────────────────────────────────────────
describe('Users | GET /users/get-reset-code - BVA (5 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createUsersApp({ getResetCodeByEmail: jest.fn().mockResolvedValue({ id: 1, code: '123456' }) });
  });

  afterAll(() => app.close());

  it('BVA_RC.1 (Min-1): Email rỗng → 400', () =>
    request(app.getHttpServer()).get('/users/get-reset-code?email=').expect(400));
  it('BVA_RC.2 (Min): Email a@b.co → 200', () =>
    request(app.getHttpServer()).get('/users/get-reset-code?email=a@b.co').expect(200));
  it('BVA_RC.3 (Max): Email 150 ký tự → 200', () => {
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(40) + '.' + 'c'.repeat(40) + '.com';
    return request(app.getHttpServer()).get(`/users/get-reset-code?email=${email}`).expect(200);
  });
  it('BVA_RC.4 (Max+1): Email 151 ký tự → 400', () => {
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(40) + '.' + 'c'.repeat(41) + '.com';
    return request(app.getHttpServer()).get(`/users/get-reset-code?email=${email}`).expect(400);
  });
  it('BVA_RC.5 (Nominal): Email hợp lệ → 200', () =>
    request(app.getHttpServer()).get('/users/get-reset-code?email=valid@gmail.com').expect(200));
});

// ─── BVA 15.x ─ Get User By ID ───────────────────────────────────────────────
describe('Users | GET /users/:id - BVA_15 (5 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createUsersApp(
      {
        findById: jest.fn().mockImplementation((id) => {
          if (id === 0 || id === -1) return Promise.resolve(null);
          return Promise.resolve({ id, email: 'mail@test.com', roles: [] });
        }),
      },
      {},
      [{ guard: JwtAuthGuard, value: { canActivate: () => true } }],
    );
  });

  afterAll(() => app.close());

  it('BVA_15.1 (Zero): ID = 0 → 404', () =>
    request(app.getHttpServer()).get('/users/0').expect(404));
  it('BVA_15.3 (Negative): ID = -1 → 404', () =>
    request(app.getHttpServer()).get('/users/-1').expect(404));
  it('BVA_15.4 (Max Int): ID = 2147483647 → 200', () =>
    request(app.getHttpServer()).get('/users/2147483647').expect(200));
  it('BVA_15.5 (Over Max Int): ID = 99999999999 → 400|404|200', () =>
    request(app.getHttpServer()).get('/users/99999999999999999999999')
      .then(res => expect([400, 404, 200]).toContain(res.status)));
  it('BVA_15.6 (Decimal): ID = 1.5 → 400', () =>
    request(app.getHttpServer()).get('/users/1.5').expect(400));
});

// ─── BVA 16.x ─ Create User (Admin) ──────────────────────────────────────────
describe('Users | POST /users/create - BVA_16 (5 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createUsersApp(
      {
        createUserWithRole: jest.fn().mockImplementation((dto) =>
          Promise.resolve({ id: 1, ...dto, roles: [{ name: dto.roleName }] })),
        findById: jest.fn().mockResolvedValue({ id: 1, email: 't@t.c', fullName: 'FullName10c', roles: [{ name: 'AUTHOR' }] }),
      },
      { sendAccountCreatedNotification: jest.fn().mockResolvedValue(true) },
      [
        { guard: JwtAuthGuard, value: { canActivate: () => true } },
        { guard: RolesGuard,   value: { canActivate: () => true } },
      ],
    );
  });

  afterAll(() => app.close());

  it('BVA_16.1 (Min-1): Password 5 ký tự → 400', () =>
    request(app.getHttpServer()).post('/users/create')
      .send({ email: 'user@gmail.com', password: '12345', fullName: 'Huy Bui IT', role: 'AUTHOR' }).expect(400));
  it('BVA_16.2 (Min): Password 6 ký tự → 201', () =>
    request(app.getHttpServer()).post('/users/create')
      .send({ email: 'user@gmail.com', password: '123456', fullName: 'HoTenDu10KyTu', role: 'AUTHOR' }).expect(201));
  it('BVA_16.4 (Max+1): fullName 51 ký tự → 400', () =>
    request(app.getHttpServer()).post('/users/create')
      .send({ email: 'u@test.com', password: 'password123', fullName: 'A'.repeat(51), role: 'AUTHOR' }).expect(400));
  it('BVA_16.5 (Empty Enum): Role rỗng "" → 400', () =>
    request(app.getHttpServer()).post('/users/create')
      .send({ email: 'u@test.com', password: 'password123', fullName: 'HoTenDu10KyTu', role: '' }).expect(400));
  it('BVA_16.6 (Null Enum): Role = null → 400', () =>
    request(app.getHttpServer()).post('/users/create')
      .send({ email: 'u@test.com', password: 'password123', fullName: 'HoTenDu10KyTu', role: null }).expect(400));
});

// ─── Update User Roles ─────────────────────────────────────────────────────────
describe('Users | PATCH /users/:id/roles - Enum Boundaries (4 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createUsersApp(
      { updateUserRoles: jest.fn().mockImplementation((id, role) => Promise.resolve({ id, roles: [{ name: role }] })) },
      {},
      [
        { guard: JwtAuthGuard, value: { canActivate: () => true } },
        { guard: RolesGuard,   value: { canActivate: () => true } },
      ],
    );
  });

  afterAll(() => app.close());

  it('Enum_1 (Valid): Role = CHAIR → 200', () =>
    request(app.getHttpServer()).patch('/users/1/roles').send({ role: 'CHAIR' }).expect(200));
  it('Enum_2 (Invalid): Role = GUEST_FAKE → 400', () =>
    request(app.getHttpServer()).patch('/users/1/roles').send({ role: 'GUEST_FAKE' }).expect(400));
  it('Enum_3 (Empty): Role = "" → 400', () =>
    request(app.getHttpServer()).patch('/users/1/roles').send({ role: '' }).expect(400));
  it('Enum_4 (Null): Role = null → 400', () =>
    request(app.getHttpServer()).patch('/users/1/roles').send({ role: null }).expect(400));
});

// ─── Delete User ──────────────────────────────────────────────────────────────
describe('Users | DELETE /users/:id - BVA Params (4 cases)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createUsersApp(
      {
        deleteUser: jest.fn().mockImplementation((id) => {
          if (id === 0 || id === -1) { const e: any = new Error('Not found'); e.status = 404; throw e; }
          return Promise.resolve(true);
        }),
      },
      {},
      [
        { guard: JwtAuthGuard, value: { canActivate: () => true } },
        { guard: RolesGuard,   value: { canActivate: () => true } },
      ],
    );
  });

  afterAll(() => app.close());

  it('DEL_1 (Zero): ID = 0 → 404', () =>
    request(app.getHttpServer()).delete('/users/0').expect(404));
  it('DEL_2 (Negative): ID = -1 → 404', () =>
    request(app.getHttpServer()).delete('/users/-1').expect(404));
  it('DEL_3 (Nominal): ID = 1 → 200', () =>
    request(app.getHttpServer()).delete('/users/1').expect(200));
  it('DEL_4 (Decimal): ID = 1.5 → 400', () =>
    request(app.getHttpServer()).delete('/users/1.5').expect(400));
});
