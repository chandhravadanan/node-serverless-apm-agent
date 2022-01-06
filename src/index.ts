import { IncomingMessage, ServerResponse } from 'http';
import { AppContext } from 'next/app';
import { trackCSR, trackSSR, trackWebReq } from './lib/instrument/tracking';
import {
  checkAndTrackErr,
  isCSR,
  isFunction,
  validateConfig,
} from './lib/util/helper';
import { AgentConfigParams, TxnType } from './lib/util/types';
import logger from './lib/util/logger';
import { init } from './lib/instrument';
import Context from './lib/metric/context';
import { AWS_LAMBDA_COLLECTOR } from './lib/util/constants';
import { wrapFaasHandler } from './lib/instrument/faas-wrapper';

if (isCSR()) {
  trackCSR();
} else {
  init();
}

// eslint-disable-next-line @typescript-eslint/ban-types
export const monitorServerlessApi = (handler: Function) => {
  if (!handler || !isFunction(handler)) {
    logger.error('[monitorServerlessApi] invalid function passed');
    return handler;
  }
  return (
    req: IncomingMessage | undefined,
    res: ServerResponse | undefined
  ) => {
    trackWebReq(req, res, TxnType.API);
    try {
      return handler(req, res);
    } catch (err) {
      trackErr(err);
      throw err;
    }
  };
};

export const monitorLambda = (handler) => {
  if (!handler || !isFunction(handler)) {
    logger.error('[monitorLambda] invalid function passed');
    return handler;
  }
  if (!validateConfig()) {
    return handler;
  }
  process.env.NEXTAPM_HOST = AWS_LAMBDA_COLLECTOR;
  return wrapFaasHandler(handler, { lambda: true });
};

export const monitorNextApp = (appContext: AppContext) => {
  if (isCSR()) {
    trackCSR(appContext);
  } else if (validateConfig()) {
    trackSSR(appContext);
  }
};

export const config = (options: AgentConfigParams) => {
  if (!options) {
    return;
  }
  const { licenseKey, projectId, collector, logLevel } = options;
  process.env.NEXTAPM_LICENSE_KEY = licenseKey || '';
  process.env.NEXTAPM_PROJECT_ID = projectId || '';
  process.env.NEXTAPM_HOST = collector || '';
  process.env.NEXTAPM_LOG_LEVEL = logLevel || '';
};

export const setFunctionName = (name: string) => {
  if (!name || !Context.getCurTxn()) {
    return;
  }
  Context.getCurTxn().setName(name);
};

export const trackErr = checkAndTrackErr;
