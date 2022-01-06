import { ErrorInfo, TxnType } from '../util/types';
import Txn from './txn';

describe('Txn', () => {
  it('end should not throw error for null', async (done) => {
    const txn = new Txn({} as any);
    expect(() => txn.end(null)).not.toThrow(Error);
    done();
  });

  it('end should update endTime, rt, status for valid res object', async (done) => {
    const txn = new Txn({} as any);
    const statusCode = 304;
    const startTime = txn.startTime;
    txn.end({ statusCode } as any);
    expect(txn.completed).toBeTruthy();
    expect(txn.status).toBe(statusCode);
    expect(txn.startTime).toBe(startTime);
    expect(txn.endTime.toString().match(/\d{13}/)).toBeTruthy();
    expect(txn.responseTime).toBe(txn.endTime - txn.startTime);
    done();
  });

  it('addError should not throw error for null', async (done) => {
    const txn = new Txn({} as any);
    expect(() => txn.addError(null)).not.toThrow(Error);
    done();
  });

  it('addError should update errInfo for valid err object', async (done) => {
    const txn = new Txn({} as any);
    txn.addError(new TypeError('CustomError'));
    expect(txn.errInfo).toEqual({
      TypeError: 1,
    });
    txn.addError(new TypeError('CustomError'));
    expect(txn.errInfo).toEqual({
      TypeError: 2,
    });
    done();
  });

  it('addError should not update errInfo for processed err object', async (done) => {
    const txn = new Txn({} as any);
    const err: ErrorInfo = new TypeError('Test');
    txn.addError(err);
    expect(txn.errInfo).toEqual({
      TypeError: 1,
    });
    expect(err.nextApmProcessed).toBeTruthy();
    txn.addError(err);
    expect(txn.errInfo).toEqual({
      TypeError: 1,
    });
    expect(err.nextApmProcessed).toBeTruthy();
    done();
  });

  it('getAsJson should return properties of txn object', async (done) => {
    const reqInfo = {
      url: '/signup',
      method: 'POST',
      type: TxnType.API,
    } as any;
    const txn = new Txn(reqInfo);
    const txnData = txn.getAsJson();
    expect(txnData).toEqual(
      expect.objectContaining({
        ...reqInfo,
        errors: {},
      })
    );
    expect(typeof txnData.rt === 'number');
    expect(typeof txnData.start === 'number');
    expect(typeof txnData.status === 'number');
    done();
  });
});
