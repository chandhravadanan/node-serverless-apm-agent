export enum TxnType {
  API = 1,
  PAGE = 2,
  FUNCTION = 3,
}

export interface ReqInfo {
  url: string;
  method: string;
  queryParam: string;
  type: TxnType;
}

export interface TxnData {
  url: string;
  start: number;
  rt: number;
  method: string;
  status: number;
  type: number;
  errors: Map<string, number>;
}

export interface AgentInfo {
  // eslint-disable-next-line camelcase
  agent_version: string;
}

export interface AgentData {
  info: AgentInfo;
  txn: TxnData;
}

export interface AgentConfigParams {
  licenseKey: string;
  projectId: string;
  collector?: string;
  logLevel?: string;
}

export interface ErrorInfo extends Error {
  nextApmProcessed?: boolean;
  code?: string;
}

export interface MethodInfo {
  method?: string;
  methods?: string[];
  webreq?: boolean;
  lambda?: boolean;
  extract?: (obj, args) => void;
  wrapper?: (original, functionInfo: MethodInfo) => any;
}
