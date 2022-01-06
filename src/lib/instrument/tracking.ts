import { IncomingMessage, ServerResponse } from 'http';
import { AppContext } from 'next/app';
import { getReqInfo, isAllowed, validateConfig } from '../util/helper';
import { NextPageContext } from 'next';
import { ReqInfo, TxnType } from '../util/types';
import logger from '../util/logger';
import Context from '../metric/context';
import Txn from '../metric/txn';

export const trackSSR = (appContext: AppContext) => {
  if (!appContext || !appContext.ctx) {
    logger.error('Invalid nextjs app context');
    return;
  }
  const ctx: NextPageContext = appContext.ctx;
  trackWebReq(ctx.req, ctx.res, TxnType.PAGE);
};

// TODO track client side metric
export const trackCSR = (appContext?: AppContext) => {
  logger.info('Client side tracking');
};

export const trackWebReq = (
  req: IncomingMessage | undefined,
  res: ServerResponse | undefined,
  type: TxnType
) => {
  try {
    if (!validateConfig()) {
      return false;
    }
    if (!req || !res || typeof res.on !== 'function') {
      logger.error('Invalid nextjs req/res');
      return false;
    }
    if (!isAllowed(req)) {
      logger.info('req skipped');
      return false;
    }
    const reqInfo = getReqInfo(req, type);
    const txn = new Txn(reqInfo);
    res.on('finish', async () => {
      if (txn) {
        await txn.end(res);
      }
    });
    Context.setCurTxn(txn);
    return true;
  } catch (err) {
    logger.error('[monitorWebReq]', err);
  }
  return false;
};

export const checkAndCreateFaasTxn = (name = '') => {
  if (!validateConfig()) {
    return;
  }
  const txn = new Txn({
    url: name,
    type: TxnType.FUNCTION,
  } as ReqInfo);
  Context.setCurTxn(txn);
  return txn;
};
