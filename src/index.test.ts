import { monitorNextApp, monitorServerlessApi, trackErr } from './index';
import Context from './lib/metric/context';
import * as Tracking from './lib/instrument/tracking';
import * as Helper from './lib/util/helper';
import { TxnType } from './lib/util/types';

describe(`Agent`, () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it(`monitorServerlessApi should not throw error if license key not present`, async (done) => {
    expect(() => monitorServerlessApi(() => true)).not.toThrow(Error);
    expect(typeof monitorServerlessApi(() => true) === 'function').toBeTruthy();
    done();
  });

  it(`monitorServerlessApi should not throw error for invalid input`, async (done) => {
    expect(() => monitorServerlessApi(null)).not.toThrow(Error);
    expect(() => monitorServerlessApi(10 as any)).not.toThrow(Error);
    expect(monitorServerlessApi(null)).toBeNull();
    expect(monitorServerlessApi(10 as any)).toBe(10);
    done();
  });

  it(`monitorServerlessApi should call trackWebReqMock for valid config`, async (done) => {
    const req = {} as any;
    const res = {} as any;
    const validateMock = jest.spyOn(Helper, 'validateConfig');
    validateMock.mockImplementationOnce(() => true);
    const trackWebReqMock = jest.spyOn(Tracking, 'trackWebReq');
    trackWebReqMock.mockImplementationOnce(() => true);
    const wrapper = monitorServerlessApi(() => true);
    wrapper(req, res);
    expect(trackWebReqMock).toHaveBeenCalledTimes(1);
    expect(trackWebReqMock).toHaveBeenLastCalledWith(req, res, TxnType.API);
    done();
  });

  it(`monitorNextApp should not throw error if license key not present`, async (done) => {
    expect(() => monitorNextApp({} as any)).not.toThrow(Error);
    done();
  });

  it(`monitorNextApp should not throw error for invalid input`, async (done) => {
    expect(() => monitorNextApp(null)).not.toThrow(Error);
    done();
  });

  it(`monitorNextApp should call trackCSR for client side rendering`, async (done) => {
    const isCSRMock = jest.spyOn(Helper, 'isCSR');
    isCSRMock.mockImplementationOnce(() => true);
    const trackCSRMock = jest.spyOn(Tracking, 'trackCSR');
    trackCSRMock.mockImplementationOnce(() => true);
    const trackSSRMock = jest.spyOn(Tracking, 'trackSSR');
    trackSSRMock.mockImplementationOnce(() => true);
    const validateMock = jest.spyOn(Helper, 'validateConfig');
    validateMock.mockImplementationOnce(() => true);
    const appContext = {} as any;
    monitorNextApp(appContext);
    expect(validateMock).toHaveBeenCalledTimes(0);
    expect(trackSSRMock).toHaveBeenCalledTimes(0);
    expect(isCSRMock).toHaveBeenCalledTimes(1);
    expect(trackCSRMock).toHaveBeenCalledTimes(1);
    expect(trackCSRMock).toHaveBeenLastCalledWith(appContext);
    done();
  });

  it(`monitorNextApp should call trackSSR for server side rendering`, async (done) => {
    const validateMock = jest.spyOn(Helper, 'validateConfig');
    validateMock.mockImplementationOnce(() => true);
    const trackSSRMock = jest.spyOn(Tracking, 'trackSSR');
    trackSSRMock.mockImplementationOnce(() => true);
    const appContext = {} as any;
    monitorNextApp(appContext);
    expect(validateMock).toHaveBeenCalledTimes(1);
    expect(trackSSRMock).toHaveBeenCalledTimes(1);
    expect(trackSSRMock).toHaveBeenLastCalledWith(appContext);
    done();
  });

  it(`trackErr should not throw error for null`, async (done) => {
    expect(() => trackErr(null)).not.toThrow(Error);
    done();
  });

  it(`trackErr should not throw error for invalid input`, async (done) => {
    expect(() => trackErr(100 as any)).not.toThrow(Error);
    done();
  });

  it(`trackErr should not process error for client side rendering`, async (done) => {
    Context.clearCurTxn();
    const isCSRMock = jest.spyOn(Helper, 'isCSR');
    isCSRMock.mockImplementationOnce(() => true);
    trackErr(new Error('ApiError'));
    expect(isCSRMock).toHaveBeenCalledTimes(1);
    done();
  });

  it(`trackErr should not process error if no cur txn`, async (done) => {
    Context.clearCurTxn();
    const isCSRMock = jest.spyOn(Helper, 'isCSR');
    isCSRMock.mockImplementationOnce(() => false);
    const contextMock = jest.spyOn(Context, 'anyActiveTxn');
    contextMock.mockImplementationOnce(() => null);
    trackErr(new Error('ApiError'));
    expect(isCSRMock).toHaveBeenCalledTimes(1);
    expect(contextMock).toHaveBeenCalledTimes(1);
    done();
  });

  it(`trackErr should process error if txn active`, async (done) => {
    const addError = jest.fn();
    const err = new Error('ApiError');
    Context.setCurTxn({ addError } as any);
    const isCSRMock = jest.spyOn(Helper, 'isCSR');
    isCSRMock.mockImplementationOnce(() => false);
    const contextMock = jest.spyOn(Context, 'anyActiveTxn');
    contextMock.mockImplementationOnce(() => true);
    trackErr(err);
    expect(isCSRMock).toHaveBeenCalledTimes(1);
    expect(contextMock).toHaveBeenCalledTimes(1);
    expect(addError).toHaveBeenCalledTimes(1);
    expect(addError).toHaveBeenCalledWith(err);
    done();
  });
});
