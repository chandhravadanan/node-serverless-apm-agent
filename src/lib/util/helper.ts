import { IncomingMessage } from 'http';
import Context from '../metric/context';
import { DEFAULT_COLLECTOR } from './constants';
import logger from './logger';
import { ErrorInfo, ReqInfo, TxnType } from './types';

export const isCSR = () => typeof window !== 'undefined';

export const isAllowed = (req: IncomingMessage) => {
  if (!req || /\/_/.exec(req?.url)) {
    return false;
  }
  return true;
};

export const isEmpty = (str: string) => {
  return str === undefined || str === null || str === '';
};

// eslint-disable-next-line @typescript-eslint/ban-types
export const isFunction = (fn: Function) => {
  return typeof fn === 'function';
};

export const getReqInfo = (req: IncomingMessage, type: TxnType) => {
  const reqInfo: ReqInfo = { url: '', method: '', queryParam: '', type };
  if (req) {
    reqInfo.method = req.method || '';
    if (req.url) {
      const index = req.url.indexOf('?');
      if (index < 0) {
        reqInfo.url = req.url;
      } else {
        reqInfo.url = req.url.substring(0, index);
        reqInfo.queryParam = req.url.substring(index + 1);
      }
    }
  }
  return reqInfo;
};

export const validateConfig = () => {
  if (!process.env.NEXTAPM_LICENSE_KEY) {
    logger.error(
      `license key not found. configure license key in NEXTAPM_LICENSE_KEY environment variable`
    );
    return false;
  }
  if (!process.env.NEXTAPM_PROJECT_ID) {
    logger.error(
      `project id not found. configure project id in NEXTAPM_PROJECT_ID environment variable`
    );
    return false;
  }
  return true;
};

export const getErrName = (err: ErrorInfo) => {
  if (!isEmpty(err.name) && err.name !== 'Error') {
    return err.name.toString();
  }

  if (!isEmpty(err.code)) {
    return err.code.toString();
  }

  return 'Error';
};

export const checkAndTrackErr = (err: Error) => {
  if (!err) {
    return;
  }
  if (!isCSR() && Context.anyActiveTxn()) {
    Context.getCurTxn().addError(err);
  }
};

export const getCollectorBaseUrl = () => {
  if (!process.env.NEXTAPM_HOST) {
    return DEFAULT_COLLECTOR;
  }
  const host = process.env.NEXTAPM_HOST;
  if (host?.startsWith('http')) {
    return host;
  }
  return `https://${host}`;
};
