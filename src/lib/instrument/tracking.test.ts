import { EventEmitter } from 'events';
import { TxnType } from '../util/types';
import Context from '../metric/context';
import * as Tracking from './tracking';

const mockConfig = () => {
  process.env.NEXTAPM_LICENSE_KEY = 'abc';
  process.env.NEXTAPM_PROJECT_ID = 'def';
};

describe('tracking', () => {
  afterEach((done) => {
    process.env.NEXTAPM_LICENSE_KEY = '';
    process.env.NEXTAPM_PROJECT_ID = '';
    done();
  });

  it('trackSSR should not throw error for invalid appContext', async (done) => {
    expect(() => Tracking.trackSSR(null)).not.toThrowError();
    done();
  });

  it('trackSSR should not throw error for invalid appContext.ctx', async (done) => {
    expect(() => Tracking.trackSSR({ ctx: null } as any)).not.toThrowError();
    done();
  });

  it('trackSSR should call trackWebReq for valid appContext', async (done) => {
    const req = { url: '/pay' };
    const res = { on: jest.fn() };
    const ctx = { req, res };
    const trackWebReqMock = jest.spyOn(Tracking, 'trackWebReq');
    trackWebReqMock.mockImplementationOnce(() => true);

    expect(() => Tracking.trackSSR({ ctx } as any)).not.toThrowError();
    expect(trackWebReqMock).toHaveBeenCalledTimes(1);
    expect(trackWebReqMock).toHaveBeenCalledWith(req, res, TxnType.PAGE);
    done();
  });

  it('trackCSR should not throw error for invalid appContext', async (done) => {
    expect(() => Tracking.trackCSR(null)).not.toThrowError();
    done();
  });

  it('trackWebReq should not throw error for invalid config', async (done) => {
    const url = '/do/something';
    expect(() =>
      Tracking.trackWebReq({ url } as any, { on: jest.fn() } as any, null)
    ).not.toThrowError();
    done();
  });

  it('trackWebReq should not throw error for invalid req', async (done) => {
    mockConfig();
    expect(() =>
      Tracking.trackWebReq(null, {} as any, null)
    ).not.toThrowError();
    done();
  });

  it('trackWebReq should not throw error for invalid res', async (done) => {
    mockConfig();
    expect(() =>
      Tracking.trackWebReq({} as any, null, null)
    ).not.toThrowError();
    done();
  });

  it('trackWebReq should return false if any exception occured', async (done) => {
    mockConfig();
    Context.clearCurTxn();
    const url = '/auth';
    // on function not present in response object
    const created = Tracking.trackWebReq({ url } as any, {} as any, null);
    expect(created).toBeFalsy();
    expect(Context.getCurTxn()).toBeNull();
    done();
  });

  it('trackWebReq should not create txn if not valid req url', async (done) => {
    mockConfig();
    Context.clearCurTxn();
    const url = '/_next';
    const created = Tracking.trackWebReq(
      { url } as any,
      { on: jest.fn() } as any,
      null
    );
    expect(created).toBeFalsy();
    expect(Context.getCurTxn()).toBeNull();
    done();
  });

  it('trackWebReq should create txn for valid req, res', async (done) => {
    mockConfig();
    Context.clearCurTxn();
    const url = '/checkout';
    const created = Tracking.trackWebReq(
      { url } as any,
      { on: jest.fn() } as any,
      null
    );
    expect(created).toBeTruthy();
    expect(Context.getCurTxn()).not.toBeNull();
    expect(Context.getCurTxn().url).toBe(url);
    done();
  });

  it('trackWebReq should call end txn if finish event emitted', async (done) => {
    mockConfig();
    Context.clearCurTxn();
    const url = '/txn/list';
    const res = new EventEmitter();
    const created = Tracking.trackWebReq({ url } as any, res as any, null);
    expect(created).toBeTruthy();
    expect(Context.getCurTxn()).not.toBeNull();
    expect(Context.getCurTxn().url).toBe(url);
    expect(Context.getCurTxn().completed).toBeFalsy();
    res.emit('finish');
    expect(Context.getCurTxn().completed).toBeTruthy();
    done();
  });
});
