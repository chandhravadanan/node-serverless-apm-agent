import Txn from '../metric/txn';
import { isFunction } from '../util/helper';
import { MethodInfo, TxnType } from '../util/types';
import { checkAndCreateFaasTxn, trackWebReq } from './tracking';

const checkAndWrapPromise = (txn: Txn, res: any) => {
  if (res && isFunction(res.then)) {
    res
      .then(() => {
        txn?.endFaaS(null);
      })
      .catch((err) => {
        txn?.endFaaS(err);
      });
  }
};

const getFunctionName = (methodInfo: MethodInfo) => {
  if (methodInfo?.lambda && process?.env?.AWS_LAMBDA_FUNCTION_NAME) {
    return process?.env?.AWS_LAMBDA_FUNCTION_NAME;
  }

  const fullyQualifiedMethod = methodInfo?.method;
  if (!fullyQualifiedMethod) {
    return 'Anonymous';
  }

  const methodPaths = fullyQualifiedMethod.split('.');
  return `${methodPaths[0]} - ${methodPaths[methodPaths.length - 1]}`;
};



export const wrapFaasHandler = (handler, methodInfo: MethodInfo) => {
  return function (...args) {
    if (methodInfo.webreq && args.length > 2) {
      trackWebReq(args[0], args[1], TxnType.API);
      return handler.apply(this, args);
    }

    let exc;
    const name = getFunctionName(methodInfo);
    const txn = checkAndCreateFaasTxn(name);
    try {
      const res = handler.apply(this, args);
      checkAndWrapPromise(txn, res);
      return res;
    } catch (err) {
      exc = err;
      throw err;
    } finally {
      txn?.endFaaS(exc);
    }
  };
};