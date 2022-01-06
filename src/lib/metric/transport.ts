import Txn from './txn';
import fetch from 'isomorphic-fetch';
import logger from '../util/logger';
import { version } from '../../../package.json';
import { getCollectorBaseUrl, validateConfig } from '../util/helper';
import { AgentData } from '../util/types';

export const sendData = async (data: AgentData) => {
  if (!validateConfig()) {
    return;
  }
  if (!data) {
    return logger.error('[sendData] empty data passed');
  }
  const host = getCollectorBaseUrl();
  try {
    logger.debug('[sendData] Data', data);
    const licenseKey = process.env.NEXTAPM_LICENSE_KEY;
    const projectId = process.env.NEXTAPM_PROJECT_ID;
    const queryParams = `licenseKey=${licenseKey}&projectId=${projectId}`;
    const url = `${host}/api/data?${queryParams}`;
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    logger.info(`[sendData] Collector Response ${res.status}`, resData);
  } catch (err) {
    logger.error(`[sendData] ${host} Response Error ${err.message}`);
  }
};

export const sendMetrics = async (txn: Txn) => {
  logger.debug('[sendMetric]');
  if (!validateConfig()) {
    return false;
  }
  if (!txn || !(txn instanceof Txn)) {
    logger.error('[sendMetric] invalid txn');
    return false;
  }
  if (!txn.isCompleted()) {
    logger.warn('[sendMetric] non completed txn');
    return false;
  }
  try {
    await sendData({
      info: {
        agent_version: version,
      },
      txn: txn.getAsJson(),
    });
    return true;
  } catch (e) {
    logger.error('[sendMetric]', e);
  }
  return false;
};
