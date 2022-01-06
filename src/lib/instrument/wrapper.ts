import Context from '../metric/context';
import { checkAndTrackErr, isEmpty, isFunction } from '../util/helper';
import logger from '../util/logger';
import { MethodInfo } from '../util/types';

export const checkAndWrapFunction = (
  actualModule: any,
  methodInfo: MethodInfo,
  moduleName: string
) => {
  if (!actualModule || !methodInfo?.method) {
    logger.error(`Invalid module ${moduleName}`);
    return;
  }

  let actual = actualModule;
  const methodName = methodInfo.method;
  const methodPaths = methodName.split('.');
  for (let index = 0; index < methodPaths.length; index++) {
    actual = actual[methodPaths[index]];
    if (isEmpty(actual)) {
      logger.info(`${methodName} is undefined in module::${moduleName}`);
      return;
    }
  }
  if (!isFunction(actual)) {
    logger.info(`${methodName} is not a function in module::${moduleName}`);
    return;
  }
  logger.info(`Instrumenting function ::${methodName}`);
  wrapAndOverride(actualModule, actual, methodInfo, methodPaths);
};

const wrapAndOverride = (
  actualModule: any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  actMethod: Function,
  methodInfo: MethodInfo,
  methodPaths: string[]
) => {
  if (!methodPaths?.length) {
    return;
  }
  const wrappedMethod = wrap(actMethod, methodInfo);
  if (methodPaths.length === 1) {
    actualModule[methodPaths[0]] = wrappedMethod;
  } else if (methodPaths.length === 2) {
    actualModule[methodPaths[0]][methodPaths[1]] = wrappedMethod;
  } else if (methodPaths.length === 3) {
    actualModule[methodPaths[0]][methodPaths[1]][
      methodPaths[2]
    ] = wrappedMethod;
  } else if (methodPaths.length === 4) {
    actualModule[methodPaths[0]][methodPaths[1]][methodPaths[2]][
      methodPaths[3]
    ] = wrappedMethod;
  }
};

const wrap = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  original: Function,
  methodInfo: MethodInfo
) => {
  if (methodInfo.wrapper) {
    return methodInfo.wrapper(original, methodInfo);
  } else {
    return wrapCaller(original, methodInfo);
  }
};

const wrapCaller = (actualMethod, methodInfo: MethodInfo) => {
  return function (...args) {
    const curTxn = Context.getCurTxn();
    if (!curTxn || curTxn.isCompleted() || Context.isLoop(methodInfo?.method)) {
      return actualMethod.apply(this, args);
    }
    try {
      Context.push(methodInfo?.method);
      if (methodInfo?.extract) {
        methodInfo.extract(this, args);
      }
      return actualMethod.apply(this, args);
    } catch (err) {
      checkAndTrackErr(err);
      throw err;
    } finally {
      Context.pop();
    }
  };
};
