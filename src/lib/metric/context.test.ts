import Context from './context';
import Txn from './txn';

describe('Context', () => {
  it('Context should set, clear and return correct value', async (done) => {
    Context.setCurTxn(null);
    expect(Context.curTxn).toBeNull();
    expect(Context.getCurTxn()).toBeNull();

    const txn = new Txn({} as any);
    Context.setCurTxn(txn);
    expect(Context.curTxn).toEqual(txn);
    expect(Context.getCurTxn()).toEqual(txn);

    Context.clearCurTxn();
    expect(Context.curTxn).toBeNull();
    expect(Context.getCurTxn()).toBeNull();

    done();
  });
});
