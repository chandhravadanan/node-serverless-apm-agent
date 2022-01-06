import * as Transport from './transport';
import fetch from 'isomorphic-fetch';
import { version } from '../../../package.json';
import Txn from './txn';
import { DEFAULT_COLLECTOR } from '../util/constants';

const mockConfig = () => {
  process.env.NEXTAPM_LICENSE_KEY = 'abc';
  process.env.NEXTAPM_PROJECT_ID = 'a1b2';
};

const clearConfig = () => {
  process.env.NEXTAPM_LICENSE_KEY = '';
  process.env.NEXTAPM_PROJECT_ID = '';
};

jest.mock('../util/constants', () => {
  const promise = {
    then: () => promise,
    catch: () => promise,
  };

  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => promise),
  };
});

jest.mock('isomorphic-fetch', () => {
  const promise = {
    then: () => promise,
    catch: () => promise,
  };

  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => promise),
  };
});

describe('Transport', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sendData should not send req if license key or project id not configured', async (done) => {
    clearConfig();
    Transport.sendData({} as any);
    expect(fetch).toHaveBeenCalledTimes(0);
    done();
  });

  it('sendData should not send req if collector host empty', async (done) => {
    mockConfig();
    Transport.sendData(null);
    expect(fetch).toHaveBeenCalledTimes(0);
    done();
  });

  it('sendData should not send req if payload is null', async (done) => {
    mockConfig();
    Transport.sendData(null);
    expect(fetch).toHaveBeenCalledTimes(0);
    done();
  });

  it('sendData should send req for valid config and data', async (done) => {
    mockConfig();
    const payload = { data: 'something' };
    const queryParams = `licenseKey=abc&projectId=a1b2`;
    const url = `${DEFAULT_COLLECTOR}/api/data?${queryParams}`;
    Transport.sendData(payload as any);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenLastCalledWith(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    done();
  });

  it('sendData should handle promise errors', async (done) => {
    mockConfig();
    const payload = { data: 'something' };
    const queryParams = `licenseKey=abc&projectId=a1b2`;
    const url = `${DEFAULT_COLLECTOR}/api/data?${queryParams}`;
    Transport.sendData(payload as any);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenLastCalledWith(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    done();
  });

  it(`sendMetrics should return false if license key or project id not configured`, async (done) => {
    process.env.NEXTAPM_LICENSE_KEY = '';
    const txn = new Txn(null);
    expect(await Transport.sendMetrics(txn)).toBeFalsy();

    process.env.NEXTAPM_LICENSE_KEY = 'abc';
    process.env.NEXTAPM_PROJECT_ID = '';
    expect(await Transport.sendMetrics(new Txn(null))).toBeFalsy();

    clearConfig();
    done();
  });

  it(`sendMetrics should not throw error for invalid txn`, async (done) => {
    mockConfig();
    expect(await Transport.sendMetrics(null)).toBeFalsy();
    clearConfig();
    done();
  });

  it(`sendMetrics should not throw error if not txn type`, async (done) => {
    mockConfig();
    expect(await Transport.sendMetrics(10 as any)).toBeFalsy();
    clearConfig();
    done();
  });

  it(`sendMetrics should return false for non completed txn`, async (done) => {
    mockConfig();
    const txn = new Txn(null);
    expect(await Transport.sendMetrics(txn)).toBeFalsy();
    clearConfig();
    done();
  });

  it(`sendMetrics should call sendData for valid config and txn`, async (done) => {
    const txn = new Txn(null);
    txn.end({ statusCode: 304 } as any);
    const sendDataMock = jest.spyOn(Transport, 'sendData');
    sendDataMock.mockImplementationOnce(async () => {
      console.log('sendData called');
    });
    mockConfig();
    expect(await Transport.sendMetrics(txn)).toBeTruthy();
    expect(sendDataMock).toHaveBeenCalledTimes(1);
    expect(sendDataMock).toHaveBeenCalledWith({
      info: {
        agent_version: version,
      },
      txn: txn.getAsJson(),
    });
    clearConfig();
    done();
  });

  it(`sendMetrics should not throw error if sendData fails`, async (done) => {
    const txn = new Txn(null);
    txn.end({ statusCode: 304 } as any);
    const sendDataMock = jest.spyOn(Transport, 'sendData');
    sendDataMock.mockImplementationOnce(async () => {
      throw new Error('Fails');
    });
    mockConfig();
    expect(await Transport.sendMetrics(txn)).toBeFalsy();
    expect(sendDataMock).toHaveBeenCalledTimes(1);
    expect(sendDataMock).toHaveBeenCalledWith({
      info: {
        agent_version: version,
      },
      txn: txn.getAsJson(),
    });
    clearConfig();
    done();
  });
});
