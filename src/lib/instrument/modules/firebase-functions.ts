import { isFunction } from '../../util/helper';
import { MethodInfo, TxnType } from '../../util/types';
import { wrapFaasHandler } from '../faas-wrapper';

const wrap = (actual, methodInfo: MethodInfo) => {
  return function wrapper(...args) {
    if (args?.length && isFunction(args[0])) {
      args[0] = wrapFaasHandler(args[0], methodInfo);
    }
    return actual.apply(this, args);
  };
};

const moduleInfo: MethodInfo[] = [
  {
    methods: [
      'database.RefBuilder.prototype.onWrite',
      'database.RefBuilder.prototype.onUpdate',
      'database.RefBuilder.prototype.onCreate',
      'database.RefBuilder.prototype.onDelete',

      'firestore.DocumentBuilder.prototype.onWrite',
      'firestore.DocumentBuilder.prototype.onUpdate',
      'firestore.DocumentBuilder.prototype.onCreate',
      'firestore.DocumentBuilder.prototype.onDelete',

      'pubsub.ScheduleBuilder.prototype.onRun',

      'auth.UserBuilder.prototype.onCreate',
      'auth.UserBuilder.prototype.onDelete',

      'analytics.AnalyticsEventBuilder.prototype.onLog',

      'storage.ObjectBuilder.prototype.onChange',
      'storage.ObjectBuilder.prototype.onArchive',
      'storage.ObjectBuilder.prototype.onDelete',
      'storage.ObjectBuilder.prototype.onFinalize',
      'storage.ObjectBuilder.prototype.onMetadataUpdate',
    ],
    wrapper: wrap,
  },
  {
    method: 'https.onRequest',
    wrapper: wrap,
    webreq: true,
  },
];

export default moduleInfo;
