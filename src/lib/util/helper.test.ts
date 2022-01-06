import { DEFAULT_COLLECTOR } from './constants';
import {
  getCollectorBaseUrl,
  getReqInfo,
  isAllowed,
  isCSR,
  validateConfig,
} from './helper';
import { TxnType } from './types';

describe('HelperUtil', () => {
  it('isCSR should return false for server side rendering', async (done) => {
    expect(isCSR()).toBeFalsy();
    done();
  });

  it('isAllowed should return false for null', async (done) => {
    expect(isAllowed(null)).toBeFalsy();
    done();
  });

  it('isAllowed should return false if url starts with /_', async (done) => {
    expect(isAllowed({ url: '/_abc' } as any)).toBeFalsy();
    done();
  });

  it('isAllowed should return true if url not starts with /_', async (done) => {
    expect(isAllowed({ url: '/logout' } as any)).toBeTruthy();
    done();
  });

  it('validateConfig should return false if license key empty', async (done) => {
    process.env.NEXTAPM_LICENSE_KEY = '';
    expect(validateConfig()).toBeFalsy();
    done();
  });

  it('validateConfig should return false if project id empty', async (done) => {
    process.env.NEXTAPM_LICENSE_KEY = 'abc';
    process.env.NEXTAPM_PROJECT_ID = '';
    expect(validateConfig()).toBeFalsy();
    process.env.NEXTAPM_LICENSE_KEY = '';
    done();
  });

  it('validateConfig should return true if licensekey and project id not empty', async (done) => {
    process.env.NEXTAPM_LICENSE_KEY = 'abc';
    process.env.NEXTAPM_PROJECT_ID = 'a1b2c3d4';
    expect(validateConfig()).toBeTruthy();
    process.env.NEXTAPM_LICENSE_KEY = '';
    process.env.NEXTAPM_PROJECT_ID = '';
    done();
  });

  it('getReqInfo should return valid extracted info for valid req object', async (done) => {
    const url = '/login';
    const method = 'POST';
    const type = TxnType.API;
    expect(getReqInfo({ url, method } as any, type)).toEqual({
      url,
      type,
      method,
      queryParam: '',
    });
    done();
  });

  it('getReqInfo should return valid queryparam from valid url', async (done) => {
    const queryParam = 'name=chan';
    const uri = '/login';
    const url = `${uri}?${queryParam}`;
    const method = 'POST';
    const type = TxnType.API;
    expect(getReqInfo({ url, method } as any, type)).toEqual({
      url: uri,
      type,
      method,
      queryParam,
    });
    done();
  });

  it('getReqInfo should return empty info if req object not valid', async (done) => {
    expect(getReqInfo(null, null)).toEqual({
      url: '',
      type: null,
      method: '',
      queryParam: '',
    });
    done();
  });

  it('getCollectorBaseUrl should return default domain if NEXTAPM_HOST not configured', async (done) => {
    process.env.NEXTAPM_HOST = '';
    expect(getCollectorBaseUrl()).toBe(DEFAULT_COLLECTOR);
    done();
  });

  it('getCollectorBaseUrl should return NEXTAPM_HOST if configured', async (done) => {
    const domain = 'http://localhost:3000';
    process.env.NEXTAPM_HOST = domain;
    expect(getCollectorBaseUrl()).toBe(domain);
    done();
  });

  it('getCollectorBaseUrl should prefix https if NEXTAPM_HOST only has hostname', async (done) => {
    const domain = 'localhost:3000';
    process.env.NEXTAPM_HOST = domain;
    expect(getCollectorBaseUrl()).toBe(`https://${domain}`);
    done();
  });
});
