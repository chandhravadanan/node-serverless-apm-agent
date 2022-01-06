import Txn from './txn';

export default class Context {
  static curTxn: Txn = null;
  static callStack: string[] = [];

  static setCurTxn = (txn: Txn) => {
    Context.curTxn = txn;
  };

  static clearCurTxn = () => {
    Context.curTxn = null;
  };

  static getCurTxn = () => {
    return Context.curTxn;
  };

  static anyActiveTxn = () => Context.curTxn != null;

  static push = (method: string) => {
    Context.callStack.push(method);
  };

  static pop = () => {
    Context.callStack.pop();
  };

  static clearCallStack = () => {
    Context.callStack = [];
  };

  static isLoop = (method: string) => {
    const size = Context.callStack.length;
    if (size) {
      return Context.callStack[size - 1] === method;
    }

    return false;
  };
}
