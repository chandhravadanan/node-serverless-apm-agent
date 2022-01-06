import { ServerResponse } from 'http';
import logger from '../util/logger';
import { sendMetrics } from './transport';
import { ErrorInfo, ReqInfo, TxnType } from '../util/types';
import { getErrName } from '../util/helper';

class Txn {
  url: string;
  type: TxnType;
  method: string;
  startTime: number;
  endTime: number;
  status: number;
  responseTime: number;
  completed: boolean;
  isError: boolean;
  errInfo: Map<string, number>;

  constructor(reqInfo: ReqInfo) {
    this.url = reqInfo?.url;
    this.type = reqInfo?.type;
    this.method = reqInfo?.method;
    this.startTime = Date.now();
    this.endTime = -1;
    this.status = 200;
    this.isError = false;
    this.responseTime = 0;
    this.completed = false;
    this.errInfo = {} as Map<string, number>;
  }

  async end(res: ServerResponse) {
    try {
      this.completed = true;
      this.endTime = Date.now();
      this.status = res?.statusCode || this.status;
      this.responseTime = this.endTime - this.startTime;
      logger.debug(`[Request] ${JSON.stringify(this.getAsJson())}`);
      await sendMetrics(this);
    } catch (err) {
      logger.error('error while ending the txn', err);
    }
  }

  async endFaaS(exc: ErrorInfo) {
    try {
      this.addError(exc);
      this.completed = true;
      this.endTime = Date.now();
      this.isError = !!exc;
      this.responseTime = this.endTime - this.startTime;
      logger.debug(`[Request] ${JSON.stringify(this.getAsJson())}`);
      await sendMetrics(this);
    } catch (err) {
      logger.error('error while ending the txn', err);
    }
  }

  addError(err: ErrorInfo) {
    if (!(err instanceof Error)) {
      return;
    }
    if (err && !err.nextApmProcessed) {
      const name = getErrName(err);
      const count = this.errInfo[name] || 0;
      this.errInfo[name] = count + 1;
      err.nextApmProcessed = true;
    }
  }

  getAsJson() {
    return {
      url: this.url,
      method: this.method,
      start: this.startTime,
      rt: this.responseTime,
      status: this.status,
      type: this.type,
      errors: this.errInfo,
      error: this.isError || this.status >= 400,
    };
  }

  isCompleted() {
    return this.completed;
  }

  setName(name: string) {
    this.url = name || '';
  }
}

export default Txn;
