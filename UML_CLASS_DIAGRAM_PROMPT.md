# PROMPT VẼ CLASS DIAGRAM UML CHO DỰ ÁN UTH-CONFMS

Vẽ Class Diagram UML với đầy đủ các class, thuộc tính (attributes) và phương thức (methods) sử dụng 3 ký hiệu visibility UML:
- **+** (public) 
- **-** (private)
- **#** (protected)

## 1. IDENTITY SERVICE

### User (Entity)
```
+ id: number
+ email: string
+ password: string
+ fullName: string
+ isVerified: boolean
+ roles: Role[]
+ refreshTokens: RefreshToken[]
+ createdAt: Date
+ updatedAt: Date
+ deletedAt: Date | null
+ isActive: boolean
```

### UsersService
```
- usersRepository: Repository<User>
- roleRepository: Repository<Role>
- passwordResetTokenRepository: Repository<PasswordResetToken>
- dataSource: DataSource
- emailService: EmailService
- submissionClient: SubmissionClientService
- reviewClient: ReviewClientService

+ markEmailVerified(userId: number): Promise<User>
+ findByEmail(email: string): Promise<User | null>
+ findByEmailIncludingDeleted(email: string): Promise<User | null>
+ findById(id: number): Promise<User | null>
+ findAll(): Promise<User[]>
+ createUser(params: {...}): Promise<User>
+ findRoleByName(name: string): Promise<Role | null>
+ createUserWithRole(params: {...}): Promise<User>
+ updateUserRoles(userId: number, roleName: string, authToken?: string): Promise<User>
+ getProfile(userId: number): Promise<User>
+ changePassword(userId: number, dto: ChangePasswordDto): Promise<void>
+ forgotPassword(email: string): Promise<void>
+ getResetCodeByEmail(email: string)
+ verifyResetCode(email: string, code: string): Promise<boolean>
+ resetPassword(email: string, code: string, newPassword: string): Promise<void>
+ deleteUser(userId: number, authToken?: string, force?: boolean): Promise<void>
```

### UsersController
```
- usersService: UsersService
- authService: AuthService
- emailService: EmailService

+ getProfile(userId: number)
+ changePassword(userId: number, dto: ChangePasswordDto)
+ forgotPassword(email: string)
+ getResetCode(email: string)
+ verifyResetCode(email: string, code: string)
+ resetPassword(email: string, code: string, newPassword: string)
+ getAllUsers()
+ getUserById(userId: number)
+ createUser(dto: CreateUserDto)
+ updateUserRoles(userId: number, dto: UpdateUserRolesDto, req: Request)
+ deleteUser(userId: number, req: Request)
```

### AuthService
```
- usersService: UsersService
- jwtService: JwtService
- refreshTokenRepository: Repository<RefreshToken>

+ register(dto: RegisterDto): Promise<{user: User, tokens: {...}}>
+ login(dto: LoginDto): Promise<{user: User, tokens: {...}}>
+ refreshToken(refreshToken: string): Promise<{accessToken: string, refreshToken: string}>
+ validateUser(email: string, password: string): Promise<User | null>
+ verifyEmail(token: string): Promise<void>
+ resendVerificationEmail(email: string): Promise<void>
```

## 2. CONFERENCE SERVICE

### Conference (Entity)
```
+ id: number
+ name: string
+ startDate: Date
+ endDate: Date
+ venue: string
+ description: string | null
+ shortDescription: string | null
+ contactEmail: string | null
+ organizerId: number
+ deletedAt: Date | null
+ isActive: boolean
+ tracks: Track[]
+ members: ConferenceMember[]
+ cfpSetting: CfpSetting | null
+ emailTemplates: EmailTemplate[]
+ formTemplates: FormTemplate[]
+ cfpTemplate: CfpTemplate | null
```

### ConferencesService
```
- conferenceRepository: Repository<Conference>
- trackRepository: Repository<Track>
- conferenceMemberRepository: Repository<ConferenceMember>
- trackMemberRepository: Repository<TrackMember>
- cfpSettingRepository: Repository<CfpSetting>
- emailService: EmailService
- identityClient: IdentityClientService
- submissionClient: SubmissionClientService
- reviewClient: ReviewClientService

+ createConference(dto: CreateConferenceDto, organizerId: number): Promise<Conference>
+ findAll(): Promise<Conference[]>
+ findOne(id: number): Promise<Conference>
+ addTrack(conferenceId: number, name: string, user: {...}): Promise<Track>
+ setCfpSettings(conferenceId: number, dto: SetCfpSettingDto, user: {...}): Promise<CfpSetting>
+ updateConference(id: number, dto: UpdateConferenceDto, user: {...}): Promise<Conference>
+ deleteConference(id: number, user: {...}): Promise<void>
+ updateTrack(conferenceId: number, trackId: number, dto: UpdateTrackDto, user: {...}): Promise<Track>
+ deleteTrack(conferenceId: number, trackId: number, user: {...}, authToken?: string): Promise<void>
+ findAllTracks(conferenceId: number): Promise<Track[]>
+ getCfpSetting(conferenceId: number): Promise<CfpSetting | null>
+ listTrackMembers(trackId: number, user: {...}): Promise<TrackMember[]>
+ addTrackMember(trackId: number, dto: AddTrackMemberDto, user: {...}, authToken?: string): Promise<TrackMember>
+ removeTrackMember(trackId: number, memberUserId: number, user: {...}, authToken?: string): Promise<void>
+ getMyTrackAssignments(userId: number): Promise<TrackMember[]>
+ acceptTrackAssignment(trackId: number, userId: number): Promise<TrackMember>
+ checkReviewerTrackAssignment(reviewerId: number, trackId: number): Promise<{hasAccepted: boolean}>
+ rejectTrackAssignment(trackId: number, userId: number): Promise<TrackMember>
+ ensureCanManageConference(conferenceId: number, user: {...})
- ensureValidDateRange(start: string, end: string)
- ensureValidCfpDates(dto: SetCfpSettingDto)
- getConferenceOrThrow(id: number): Promise<Conference>
- sendTrackAssignmentEmail(member: TrackMember, track: Track, authToken: string): Promise<void>
```

### Track (Entity)
```
+ id: number
+ name: string
+ conferenceId: number
+ deletedAt: Date | null
+ isActive: boolean
+ conference: Conference
+ members: TrackMember[]
```

### ReportingService
```
- conferenceRepository: Repository<Conference>
- trackRepository: Repository<Track>
- conferenceMemberRepository: Repository<ConferenceMember>
- trackMemberRepository: Repository<TrackMember>
- submissionClient: SubmissionClientService

+ getConferenceStats(conferenceId: number): Promise<{...}>
+ getTrackStats(conferenceId: number, trackId: number): Promise<{...}>
```

## 3. SUBMISSION SERVICE

### Submission (Entity)
```
+ id: string
+ title: string
+ abstract: string
+ keywords: string[]
+ status: SubmissionStatus
+ authorId: number
+ conferenceId: number
+ trackId: number
+ submittedAt: Date
+ fileUrl: string | null
+ metadata: Record<string, any> | null
+ currentVersionId: number | null
+ versions: SubmissionVersion[]
```

### SubmissionsService
```
- submissionRepository: Repository<Submission>
- submissionVersionRepository: Repository<SubmissionVersion>
- supabaseService: SupabaseService
- dataSource: DataSource
- conferenceClient: ConferenceClientService
- reviewClient: ReviewClientService
- identityClient: IdentityClientService
- emailService: EmailService

+ uploadFile(file: Express.Multer.File | undefined): Promise<string>
+ create(dto: CreateSubmissionDto, authorId: number, file?: Express.Multer.File): Promise<Submission>
+ findAll(dto: QuerySubmissionsDto, userId?: number, userRoles?: string[]): Promise<{data: Submission[], total: number}>
+ findOne(id: string, userId?: number, userRoles?: string[]): Promise<Submission>
+ update(id: string, dto: UpdateSubmissionDto, authorId: number, file?: Express.Multer.File): Promise<Submission>
+ updateStatus(id: string, dto: UpdateStatusDto, userId: number, userRoles: string[]): Promise<Submission>
+ delete(id: string, authorId: number): Promise<void>
+ getSubmissionIdsByTrack(trackId: number, authToken: string): Promise<string[]>
+ countSubmissionsByAuthorId(authorId: number, authToken: string): Promise<number>
+ getSubmissionById(id: string, authToken: string): Promise<Submission | null>
- validateStatusTransition(currentStatus: SubmissionStatus, newStatus: SubmissionStatus): boolean
- checkPermissions(userId: number, userRoles: string[], submission: Submission): boolean
```

## 4. REVIEW SERVICE

### Review (Entity)
```
+ id: number
+ submissionId: string
+ reviewerId: number
+ conferenceId: number
+ rating: number | null
+ confidence: number | null
+ summary: string | null
+ strengths: string | null
+ weaknesses: string | null
+ questions: string | null
+ recommendations: string | null
+ submittedAt: Date | null
+ assignment: Assignment
```

### ReviewsService
```
- reviewPreferenceRepository: Repository<ReviewPreference>
- assignmentRepository: Repository<Assignment>
- reviewRepository: Repository<Review>
- pcDiscussionRepository: Repository<PcDiscussion>
- decisionRepository: Repository<Decision>
- rebuttalRepository: Repository<Rebuttal>
- conferenceClient: ConferenceClientService
- submissionClient: SubmissionClientService
- identityClient: IdentityClientService

+ submitBid(reviewerId: number, dto: CreateBidDto): Promise<ReviewPreference>
+ checkConflictOfInterest(reviewerId: number, submissionId: string | number, conferenceId?: number): Promise<boolean>
+ selfAssignSubmission(reviewerId: number, submissionId: string, conferenceId: number): Promise<Assignment>
+ createAssignment(dto: CreateAssignmentDto, authToken: string): Promise<Assignment>
+ createAutoAssignment(dto: CreateAutoAssignmentDto, authToken: string): Promise<Assignment[]>
+ getAssignments(submissionId: string, authToken?: string): Promise<Assignment[]>
+ getMyAssignments(reviewerId: number): Promise<Assignment[]>
+ submitReview(reviewerId: number, dto: CreateReviewDto, authToken: string): Promise<Review>
+ getReviews(submissionId: string, authToken?: string): Promise<Review[]>
+ getMyReviews(reviewerId: number): Promise<Review[]>
+ createDiscussion(submissionId: string, dto: CreateDiscussionDto, userId: number, authToken: string): Promise<PcDiscussion>
+ getDiscussions(submissionId: string, authToken?: string): Promise<PcDiscussion[]>
+ createDecision(submissionId: string, dto: CreateDecisionDto, userId: number, authToken: string): Promise<Decision>
+ getDecision(submissionId: string, authToken?: string): Promise<Decision | null>
+ createRebuttal(submissionId: string, dto: CreateRebuttalDto, authorId: number, authToken: string): Promise<Rebuttal>
+ getRebuttals(submissionId: string, authToken?: string): Promise<Rebuttal[]>
+ getReviewerActivityStats(reviewerId: number, authToken: string): Promise<{assignmentCount: number, reviewCount: number}>
+ hasUserReviewedSubmissions(userId: number, submissionIds: string[], authToken: string): Promise<boolean>
```

### Assignment (Entity)
```
+ id: number
+ submissionId: string
+ reviewerId: number
+ conferenceId: number
+ assignedAt: Date
+ status: AssignmentStatus
+ review: Review
```

### ReviewPreference (Entity)
```
+ id: number
+ reviewerId: number
+ submissionId: string
+ conferenceId: number
+ preference: PreferenceType
```

## 5. CLIENT SERVICES (Integration)

### IdentityClientService
```
- httpService: HttpService
- configService: ConfigService

+ getUserById(userId: number, authToken: string): Promise<User>
+ validateToken(token: string): Promise<boolean>
```

### ConferenceClientService
```
- httpService: HttpService
- configService: ConfigService

+ getConference(conferenceId: number, authToken: string): Promise<Conference>
+ getTrack(trackId: number, authToken: string): Promise<Track>
+ checkReviewerTrackAssignment(reviewerId: number, trackId: number, authToken: string): Promise<{hasAccepted: boolean}>
```

### SubmissionClientService
```
- httpService: HttpService
- configService: ConfigService

+ getSubmissionById(id: string, authToken: string): Promise<Submission | null>
+ getSubmissionIdsByTrack(trackId: number, authToken: string): Promise<string[]>
+ countSubmissionsByAuthorId(authorId: number, authToken: string): Promise<number>
```

### ReviewClientService
```
- httpService: HttpService
- configService: ConfigService

+ getReviewerActivityStats(reviewerId: number, authToken: string): Promise<{assignmentCount: number, reviewCount: number}>
+ hasUserReviewedSubmissions(userId: number, submissionIds: string[], authToken: string): Promise<boolean>
```

## 6. COMMON SERVICES

### EmailService
```
- transporter: Transporter
- configService: ConfigService

+ sendVerificationEmail(email: string, token: string): Promise<void>
+ sendPasswordResetCode(email: string, code: string): Promise<void>
+ sendAccountCreatedNotification(email: string, password: string, fullName: string): Promise<void>
+ sendTrackAssignmentEmail(email: string, fullName: string, trackName: string, conferenceName: string): Promise<void>
```

## 7. RELATIONSHIPS

### Associations:
- User 1..* ──< ConferenceMember >── 1 Conference
- Conference 1..* ── Track
- Track 1..* ──< TrackMember >── 1 User
- User 1 ── 1..* Submission
- Submission 1..* ──< Assignment >── 1 User
- Assignment 1 ── 0..1 Review
- Submission 1 ── 0..* ReviewPreference
- Submission 1 ── 0..* PcDiscussion
- Submission 1 ── 0..1 Decision
- Submission 1..* ── Rebuttal
- Submission 1..* ── SubmissionVersion

### Dependencies:
- UsersService ──> SubmissionClientService
- UsersService ──> ReviewClientService
- ConferencesService ──> IdentityClientService
- ConferencesService ──> SubmissionClientService
- ConferencesService ──> ReviewClientService
- SubmissionsService ──> ConferenceClientService
- SubmissionsService ──> ReviewClientService
- ReviewsService ──> ConferenceClientService
- ReviewsService ──> SubmissionClientService
- ReviewsService ──> IdentityClientService

## YÊU CẦU VẼ DIAGRAM:

1. **Hiển thị tất cả các class** với đầy đủ thuộc tính và phương thức
2. **Sử dụng ký hiệu visibility UML:**
   - `+` cho public methods/attributes
   - `-` cho private methods/attributes
   - `#` cho protected methods/attributes
3. **Thể hiện relationships:**
   - Aggregation (hình thoi rỗng)
   - Composition (hình thoi đầy)
   - Association (mũi tên đơn giản)
   - Dependency (mũi tên đứt nét)
4. **Multiplicity:**
   - 1..* (một hoặc nhiều)
   - 0..1 (không hoặc một)
   - 0..* (không hoặc nhiều)
5. **Group các class theo service:**
   - Identity Service (màu xanh)
   - Conference Service (màu vàng)
   - Submission Service (màu xanh lá)
   - Review Service (màu đỏ)
   - Common/Integration (màu xám)

Vẽ Class Diagram theo chuẩn UML 2.5 với đầy đủ thông tin trên!
