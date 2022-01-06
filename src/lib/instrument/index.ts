import logger from '../util/logger';
import { MethodInfo } from '../util/types';
import globalModInfo from './modules/global';
import firebaseInfo from './modules/firebase-functions';
import { checkAndWrapFunction } from './wrapper';

const modulesInfo = {
  'firebase-functions': firebaseInfo,
};

let instrumented = false;

const instrumentModule = (
  actualModule,
  moduleInfo: MethodInfo[],
  moduleName: string
) => {
  logger.info(`Instrumenting module:: ${moduleName}`);
  if (!moduleInfo || moduleInfo.length <= 0) {
    return;
  }

  moduleInfo.forEach((methodGroupInfo: MethodInfo) => {
    if (methodGroupInfo.methods) {
      const { methods, ...others } = methodGroupInfo;
      methods.forEach((eachMethod) => {
        const curMethodInfo = { ...others, method: eachMethod };
        checkAndWrapFunction(actualModule, curMethodInfo, moduleName);
      });
    } else if (methodGroupInfo.method) {
      checkAndWrapFunction(actualModule, methodGroupInfo, moduleName);
    }
  });
};

export const instrument = async () => {
  instrumentModule(global, globalModInfo, 'global');

  try {
    const requireMiddle = 'require-in-the-middle';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Hook = require(requireMiddle);

    Object.keys(modulesInfo).forEach((moduleName) => {
      Hook([moduleName], (exports) => {
        try {
          instrumentModule(exports, modulesInfo[moduleName], moduleName);

          return exports;
        } catch (err) {
          logger.error(`unable to instrument ${moduleName}`, err);
        }
        return exports;
      });
    });
  } catch (err) {
    logger.error(`[instrument] unable to load require-in-the-middle`, err);
  }
};

export const init = () => {
  if (!instrumented) {
    instrument();
    instrumented = true;
  }
};
