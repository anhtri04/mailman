export interface RequestScripts {
  beforeRequest?: string;
  afterResponse?: string;
}

export interface ScriptAssertionResult {
  name: string;
  passed: boolean;
  message?: string;
}

export interface ScriptExecutionResult {
  success: boolean;
  output: string[];
  error?: string;
  assertions?: ScriptAssertionResult[];
}

export interface ScriptExecutionSummary {
  beforeRequest?: ScriptExecutionResult;
  afterResponse?: ScriptExecutionResult;
}
