import { checkAndTrackErr } from '../../util/helper';
import { MethodInfo } from '../../util/types';

const captureExc = (invoker, args) => {
  args?.forEach((each) => {
    if (each instanceof Error) {
      checkAndTrackErr(each);
    }
  });
};

const moduleInfo: MethodInfo[] = [
  {
    method: 'console.log',
    extract: captureExc,
  },
  {
    method: 'console.info',
    extract: captureExc,
  },
  {
    method: 'console.warn',
    extract: captureExc,
  },
  {
    method: 'console.error',
    extract: captureExc,
  },
];

export default moduleInfo;
