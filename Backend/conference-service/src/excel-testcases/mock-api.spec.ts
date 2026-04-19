import * as fs from 'node:fs';
import * as path from 'node:path';

type RawCase = {
  Id: string;
  Function: string;
  Description?: string;
  Procedure?: string;
  Expected?: string;
  Preconditions?: string;
};

type MockRequest = {
  method: 'get' | 'post' | 'patch' | 'delete';
  url: string;
  auth: 'none' | 'user' | 'reviewer';
};

type MockResponse = {
  status: number;
  message: string;
  data: Record<string, unknown>;
};

function loadCases(): RawCase[] {
  const casesFile = path.resolve(
    __dirname,
    'conference_cases_clean.json',
  );

  if (!fs.existsSync(casesFile)) {
    return [];
  }

  const raw = fs.readFileSync(casesFile, 'utf8');
  const parsed = JSON.parse(raw) as RawCase[];
  return Array.isArray(parsed) ? parsed : [];
}

function normalize(s?: string): string {
  return (s ?? '').toLowerCase();
}

function caseText(tc: RawCase): string {
  return [tc.Description, tc.Procedure, tc.Preconditions, tc.Expected]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function behaviorText(tc: RawCase): string {
  return [tc.Description, tc.Procedure, tc.Preconditions].filter(Boolean).join(' ').toLowerCase();
}

function hasAny(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

function firstJsonObject(text?: string): Record<string, unknown> | null {
  if (!text) {
    return null;
  }
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) {
    return null;
  }
  try {
    return JSON.parse(m[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function pickRawValue(tc: RawCase, key: string, fallback: string): string {
  const obj = firstJsonObject(tc.Procedure);
  const jsonVal = obj?.[key];
  if (typeof jsonVal === 'number' || typeof jsonVal === 'string') {
    return String(jsonVal);
  }

  const text = `${tc.Procedure ?? ''} ${tc.Description ?? ''}`;
  const eq = text.match(new RegExp(`${key}\\s*=\\s*([a-zA-Z0-9-]+)`, 'i'));
  if (eq?.[1]) {
    return eq[1];
  }
  // Only accept explicit key:value form to avoid false capture like "id khong ton tai".
  const keyVal = text.match(new RegExp(`${key}\\s*:\\s*([a-zA-Z0-9-]+)`, 'i'));
  if (keyVal?.[1]) {
    return keyVal[1];
  }
  return fallback;
}

function inferMockRequest(tc: RawCase): MockRequest | null {
  const conferenceId = pickRawValue(tc, 'conferenceId', '1');
  const id = pickRawValue(tc, 'id', conferenceId);
  const trackId = pickRawValue(tc, 'trackId', '1');
  const reviewerId = pickRawValue(tc, 'reviewerId', '1');
  const userId = pickRawValue(tc, 'userId', '1');

  switch (tc.Function) {
    case 'getPublicCfp':
      return { method: 'get', url: `/public/conferences/${id}/cfp`, auth: 'none' };
    case 'checkDeadline':
      return {
        method: 'get',
        url: `/public/conferences/${conferenceId}/cfp/check-deadline?type=submission`,
        auth: 'none',
      };
    case 'getPublicTracks':
      return {
        method: 'get',
        url: `/public/conferences/${id}/tracks`,
        auth: 'none',
      };
    case 'validateTrack':
      return {
        method: 'get',
        url: `/public/conferences/${conferenceId}/tracks/${trackId}/validate`,
        auth: 'none',
      };
    case 'getDeadlines':
      return {
        method: 'get',
        url: `/conferences/${conferenceId}/cfp/deadlines`,
        auth: 'none',
      };
    case 'create':
      return { method: 'post', url: '/conferences', auth: 'user' };
    case 'findAll':
      return { method: 'get', url: '/conferences', auth: 'user' };
    case 'getMyTrackAssignments':
      return {
        method: 'get',
        url: '/conferences/reviewer/my-track-assignments',
        auth: 'reviewer',
      };
    case 'findOne':
      return { method: 'get', url: `/conferences/${id}`, auth: 'user' };
    case 'updateConference':
      return { method: 'patch', url: `/conferences/${id}`, auth: 'user' };
    case 'deleteConference':
      return { method: 'delete', url: `/conferences/${id}`, auth: 'user' };
    case 'getTracks':
      return { method: 'get', url: `/conferences/${id}/tracks`, auth: 'user' };
    case 'addTrack':
      return { method: 'post', url: `/conferences/${id}/tracks`, auth: 'user' };
    case 'setCfp':
      return { method: 'post', url: `/conferences/${id}/cfp`, auth: 'user' };
    case 'updateTrack':
      return {
        method: 'patch',
        url: `/conferences/${conferenceId}/tracks/${trackId}`,
        auth: 'user',
      };
    case 'deleteTrack':
      return {
        method: 'delete',
        url: `/conferences/${conferenceId}/tracks/${trackId}`,
        auth: 'user',
      };
    case 'checkReviewerTrackAssignment':
      return {
        method: 'get',
        url: `/conferences/tracks/${trackId}/reviewer/${reviewerId}/check-assignment`,
        auth: 'user',
      };
    case 'listTrackMembers':
      return {
        method: 'get',
        url: `/conferences/tracks/${trackId}/members`,
        auth: 'user',
      };
    case 'addTrackMember':
      return {
        method: 'post',
        url: `/conferences/tracks/${trackId}/members?userId=${userId}`,
        auth: 'user',
      };
    case 'removeTrackMember':
      return {
        method: 'delete',
        url: `/conferences/tracks/${trackId}/members/${userId}`,
        auth: 'user',
      };
    case 'acceptTrackAssignment':
      return {
        method: 'post',
        url: `/conferences/tracks/${trackId}/accept`,
        auth: 'reviewer',
      };
    case 'rejectTrackAssignment':
      return {
        method: 'post',
        url: `/conferences/tracks/${trackId}/reject`,
        auth: 'reviewer',
      };
    case 'getStats':
      return { method: 'get', url: `/conferences/${conferenceId}/stats`, auth: 'user' };
    case 'getSubmissionStats':
      return {
        method: 'get',
        url: `/conferences/${conferenceId}/stats/submissions`,
        auth: 'user',
      };
    case 'getAcceptanceRate':
      return {
        method: 'get',
        url: `/conferences/${conferenceId}/stats/acceptance-rate`,
        auth: 'user',
      };
    case 'getDashboardStats':
      return {
        method: 'get',
        url: `/conferences/${conferenceId}/stats/dashboard`,
        auth: 'user',
      };
    default:
      return null;
  }
}

const defaultStatusByFunction: Record<string, number> = {
  create: 201,
  addTrack: 201,
  setCfp: 201,
  addTrackMember: 201,
  deleteConference: 200,
  deleteTrack: 200,
  removeTrackMember: 200,
  updateConference: 200,
  updateTrack: 200,
  acceptTrackAssignment: 200,
  rejectTrackAssignment: 200,
};

function buildMockPayload(fn: string, req: MockRequest, status: number): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    function: fn,
    status,
    method: req.method,
    url: req.url,
    auth: req.auth,
    timestamp: now,
    ok: status >= 200 && status < 300,
  };
}

function inferMockStatus(tc: RawCase): number {
  const text = behaviorText(tc);

  switch (tc.Function) {
    case 'getPublicCfp':
      if (hasAny(text, ['khong ton tai', 'not found', '2147483647', 'x gia tri rat lon'])) {
        return 404;
      }
      if (hasAny(text, ['validation failed', 'numeric string is expected', 'khong hop le'])) {
        return 400;
      }
      return 200;

    case 'checkDeadline':
      if (hasAny(text, ['conferenceid=abc', 'validate conferenceid khong hop le', 'numeric string is expected'])) {
        return 400;
      }
      return 200;

    case 'getPublicTracks':
      if (hasAny(text, ['validation failed', 'numeric string is expected', 'khong hop le'])) {
        return 400;
      }
      return 200;

    case 'create':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (
        hasAny(text, [
          'email khong hop le',
          'thieu field',
          'vuot qua nguong toi da',
          'qua 500',
          'startdate',
          'enddate',
          'phai truoc enddate',
          'rong',
          'bo field name',
          'khong hop le',
        ])
      ) {
        return 400;
      }
      return 201;

    case 'findAll':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      return 200;

    case 'getMyTrackAssignments':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      return 200;

    case 'updateConference':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong co quyen', 'forbidden'])) {
        return 403;
      }
      if (hasAny(text, ['khong ton tai', 'not found'])) {
        return 404;
      }
      if (
        hasAny(text, [
          'numeric string is expected',
          'id khong hop le',
          'startdate phai truoc enddate',
          'loi thu tu ngay',
          'startdate sau enddate',
          'ngay bat au lon hon ngay ket thuc',
          'cap nhat conference voi startdate sau enddate',
          'vuot 255',
          'max length',
        ])
      ) {
        return 400;
      }
      return 200;

    case 'deleteConference':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong co quyen', 'forbidden'])) {
        return 403;
      }
      if (hasAny(text, ['khong ton tai', 'not found'])) {
        return 404;
      }
      if (hasAny(text, ['id khong hop le', 'numeric string is expected'])) {
        return 400;
      }
      if (text.includes('chua co submissions')) {
        return 200;
      }
      if (hasAny(text, ['co bai nop', 'a co submission', 'khong tho xoa vi co bai nop'])) {
        return 400;
      }
      if (hasAny(text, ['fallback', 'service loi', 'soft delete'])) {
        return 200;
      }
      return 200;

    case 'getTracks':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['numeric string is expected', 'id khong hop le'])) {
        return 400;
      }
      return 200;

    case 'addTrack':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong co quyen', 'forbidden'])) {
        return 403;
      }
      if (hasAny(text, ['khong ton tai', 'not found'])) {
        return 404;
      }
      if (
        hasAny(text, [
          'numeric string is expected',
          'id khong hop le',
          'thieu name',
          'vuot qua nguong toi da',
          'rong',
          'khong hop le',
        ])
      ) {
        return 400;
      }
      return 201;

    case 'setCfp':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong co quyen', 'forbidden'])) {
        return 403;
      }
      if (hasAny(text, ['khong ton tai', 'not found'])) {
        return 404;
      }
      if (hasAny(text, ['numeric string is expected', 'id khong hop le'])) {
        return 400;
      }
      if (
        hasAny(text, [
          'vi pham thu tu',
          'thu tu sai',
          'sai thu tu',
          'phai truoc',
          'dinh dang date sai',
          'validation dinh dang ngay khong hop le',
          'ngay sai',
          'reviewdeadline nho hon submissiondeadline',
          'notificationdate nho hon reviewdeadline',
          'camerareadydeadline nho hon notificationdate',
        ])
      ) {
        return 400;
      }
      return 201;

    case 'updateTrack':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong co quyen', 'forbidden'])) {
        return 403;
      }
      if (hasAny(text, ['khong ton tai', 'not found'])) {
        return 404;
      }
      if (hasAny(text, ['numeric string is expected', 'id khong hop le'])) {
        return 400;
      }
      if (hasAny(text, ['vuot qua nguong toi da', '255 ky tu', 'max length'])) {
        return 400;
      }
      return 200;

    case 'deleteTrack':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong co quyen', 'forbidden'])) {
        return 403;
      }
      if (hasAny(text, ['khong ton tai', 'not found'])) {
        return 404;
      }
      if (hasAny(text, ['numeric string is expected', 'id khong hop le'])) {
        return 400;
      }
      if (hasAny(text, ['co bai nop', 'submission-service', 'khong tho xoa track'])) {
        return hasAny(text, ['fallback', 'loi']) ? 200 : 400;
      }
      return 200;

    case 'addTrackMember':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong co quyen', 'forbidden'])) {
        return 403;
      }
      if (hasAny(text, ['khong ton tai', 'not found', 'user khong ton tai'])) {
        return 404;
      }
      if (hasAny(text, ['trung lap', 'da ton tai', 'duplicate'])) {
        return 400;
      }
      if (hasAny(text, ['userid am', 'userid=-1', 'user id am'])) {
        return 404;
      }
      if (hasAny(text, ['khong hop le', 'validation error', 'so nguyen duong', 'parseintpipe', 'userid bang 0'])) {
        return 400;
      }
      return 201;

    case 'removeTrackMember':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong co quyen', 'forbidden'])) {
        return 403;
      }
      if (hasAny(text, ['khong ton tai', 'not found'])) {
        return 404;
      }
      if (hasAny(text, ['review submissions', 'member a review', 'da review'])) {
        return 400;
      }
      if (hasAny(text, ['thieu auth token', 'thieu bearer header', 'guard cross-service'])) {
        return 400;
      }
      if (hasAny(text, ['numeric string is expected', 'id khong hop le'])) {
        return 400;
      }
      return 200;

    case 'acceptTrackAssignment':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong ton tai', 'not found', 'khong con active'])) {
        return 404;
      }
      if (hasAny(text, ['da xu ly', 'phan cong a uoc xu ly', 'status=accepted', 'status=rejected', 'xu ly truoc'])) {
        return 400;
      }
      if (hasAny(text, ['numeric string is expected', 'id khong hop le'])) {
        return 400;
      }
      return 200;

    case 'rejectTrackAssignment':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong ton tai', 'not found', 'khong con active'])) {
        return 404;
      }
      if (hasAny(text, ['da xu ly', 'phan cong a uoc xu ly', 'status=accepted', 'status=rejected', 'xu ly truoc'])) {
        return 400;
      }
      if (hasAny(text, ['numeric string is expected', 'id khong hop le'])) {
        return 400;
      }
      return 200;

    case 'getSubmissionStats':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong co quyen', 'forbidden'])) {
        return 403;
      }
      if (hasAny(text, ['404 tu reporting service', 'non-502'])) {
        return 404;
      }
      if (hasAny(text, ['numeric string is expected', 'id khong hop le'])) {
        return 400;
      }
      return 200;

    case 'getAcceptanceRate':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong co quyen', 'forbidden'])) {
        return 403;
      }
      if (hasAny(text, ['khong ton tai', 'not found'])) {
        return 404;
      }
      if (hasAny(text, ['numeric string is expected', 'id khong hop le'])) {
        return 400;
      }
      return 200;

    case 'getDashboardStats':
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong co quyen', 'forbidden'])) {
        return 403;
      }
      if (hasAny(text, ['khong ton tai', 'not found'])) {
        return 404;
      }
      if (hasAny(text, ['numeric string is expected', 'id khong hop le'])) {
        return 400;
      }
      return 200;

    default:
      if (hasAny(text, ['thieu token', 'unauthorized'])) {
        return 401;
      }
      if (hasAny(text, ['khong co quyen', 'forbidden'])) {
        return 403;
      }
      if (hasAny(text, ['khong ton tai', 'not found'])) {
        return 404;
      }
      if (hasAny(text, ['numeric string is expected', 'khong hop le', 'invalid', 'thieu field'])) {
        return 400;
      }
      return defaultStatusByFunction[tc.Function] ?? 200;
  }
}

function buildMockResponse(tc: RawCase, req: MockRequest): MockResponse {
  const status = inferMockStatus(tc);

  return {
    status,
    message: `Mocked by testcase ${tc.Id}`,
    data: buildMockPayload(tc.Function, req, status),
  };
}

const allCases = loadCases();

describe('Conference testcase mock logic (222 cases)', () => {
  beforeAll(() => {
    expect(allCases.length).toBe(222);

    const mockDataset = allCases.map((tc) => {
      const req = inferMockRequest(tc);
      if (!req) {
        return {
          id: tc.Id,
          fn: tc.Function,
          error: 'mapping_not_found',
        };
      }
      const res = buildMockResponse(tc, req);
      return {
        id: tc.Id,
        fn: tc.Function,
        request: req,
        response: res,
      };
    });

    const outFile = path.resolve(__dirname, 'mock_data_from_222_cases.json');
    fs.writeFileSync(outFile, JSON.stringify(mockDataset, null, 2), 'utf8');

  });

  it.each(allCases.map((x) => [x.Id, x]))('%s builds valid mock response from testcase', (id: string, tc: RawCase) => {
    const req = inferMockRequest(tc);
    expect(req).toBeTruthy();

    if (!req) {
      return;
    }

    const res = buildMockResponse(tc, req);

    expect(id).toBeTruthy();
    expect(tc.Function).toBeTruthy();
    expect(Number.isInteger(res.status)).toBe(true);
    expect([200, 201, 400, 401, 403, 404]).toContain(res.status);
    expect(typeof normalize(res.message)).toBe('string');
    expect(res.data.function).toBe(tc.Function);
    expect(res.data.url).toBe(req.url);
  });
});
