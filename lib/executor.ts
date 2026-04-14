// Execution engine — Judge0 CE public API (no auth required)
const JUDGE0_URL = 'https://ce.judge0.com';

export const LANGUAGE_IDS: Record<string, number> = {
  python: 71,
  cpp:    54,
  java:   62,
};

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  status: 'PASS' | 'FAIL' | 'ERROR';
  error?: string;
  executionTime?: string;
}

export interface ExecutionSummary {
  visibleResults: TestResult[];
  hiddenPassed: boolean;
  hiddenTotal: number;
  hiddenPassedCount: number;
  allPassed: boolean;
  totalPassed: number;
  totalTests: number;
  compilationError?: string;
}

// Normalize output for comparison
function normalize(output: string): string {
  return output
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')  // trailing spaces per line
    .toLowerCase();
}

function compareOutput(actual: string, expected: string): boolean {
  return normalize(actual) === normalize(expected);
}

// Execute single test case against Judge0
async function executeOne(
  code: string,
  languageId: number,
  stdin: string,
  timeoutMs = 10000
): Promise<{ stdout: string; stderr: string; compile_output: string; time: string; status: { id: number; description: string } }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: stdin || '',
          cpu_time_limit: 5,
          wall_time_limit: 8,
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Judge0 HTTP ${res.status}`);
    return res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('TIME_LIMIT_EXCEEDED');
    throw err;
  }
}

// Run code against all test cases with concurrency limit
export async function runTestCases(
  code: string,
  language: string,
  visibleTests: TestCase[],
  hiddenTests: TestCase[],
  earlyExit = true
): Promise<ExecutionSummary> {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    return makeErrorSummary(visibleTests, `Unsupported language: ${language}`);
  }

  if (!code.trim()) {
    return makeErrorSummary(visibleTests, 'Code cannot be empty');
  }

  // First run: check for compilation error using first visible test
  const firstTest = visibleTests[0] || hiddenTests[0];
  if (firstTest) {
    try {
      const probe = await executeOne(code, languageId, firstTest.input);
      if (probe.compile_output?.trim()) {
        return makeErrorSummary(visibleTests, probe.compile_output, 'Compilation Error');
      }
    } catch (err: any) {
      return makeErrorSummary(visibleTests, err.message);
    }
  }

  // Run visible tests
  const visibleResults: TestResult[] = [];
  let anyFailed = false;

  for (const tc of visibleTests) {
    try {
      const result = await executeOne(code, languageId, tc.input);

      let actualOutput = '';
      let error: string | undefined;
      let status: 'PASS' | 'FAIL' | 'ERROR' = 'FAIL';

      if (result.compile_output?.trim()) {
        actualOutput = result.compile_output;
        error = 'Compilation Error';
        status = 'ERROR';
      } else if (result.stderr?.trim()) {
        actualOutput = result.stderr;
        error = 'Runtime Error';
        status = 'ERROR';
      } else if (result.status?.id === 5) {
        actualOutput = 'Time Limit Exceeded';
        error = 'TLE';
        status = 'ERROR';
      } else {
        actualOutput = result.stdout || '';
        status = compareOutput(actualOutput, tc.expectedOutput) ? 'PASS' : 'FAIL';
      }

      if (status !== 'PASS') anyFailed = true;

      visibleResults.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput,
        status,
        error,
        executionTime: result.time ? `${Math.round(parseFloat(result.time) * 1000)}ms` : undefined,
      });

      if (earlyExit && status === 'ERROR') break;
    } catch (err: any) {
      anyFailed = true;
      visibleResults.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: '',
        status: 'ERROR',
        error: err.message || 'Execution failed',
      });
      if (earlyExit) break;
    }
  }

  // Run hidden tests (parallel, max 3 concurrent)
  let hiddenPassedCount = 0;
  const CONCURRENCY = 3;

  for (let i = 0; i < hiddenTests.length; i += CONCURRENCY) {
    const batch = hiddenTests.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(tc => executeOne(code, languageId, tc.input))
    );

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      const tc = batch[j];
      if (r.status === 'fulfilled') {
        const result = r.value;
        const actualOutput = result.stdout || '';
        if (
          !result.compile_output?.trim() &&
          !result.stderr?.trim() &&
          result.status?.id !== 5 &&
          compareOutput(actualOutput, tc.expectedOutput)
        ) {
          hiddenPassedCount++;
        }
      }
    }

    // Early exit if too many hidden failures
    if (earlyExit && hiddenPassedCount === 0 && i >= CONCURRENCY) break;
  }

  const hiddenPassed = hiddenPassedCount === hiddenTests.length;
  const totalPassed  = visibleResults.filter(r => r.status === 'PASS').length + hiddenPassedCount;
  const totalTests   = visibleTests.length + hiddenTests.length;

  return {
    visibleResults,
    hiddenPassed,
    hiddenTotal: hiddenTests.length,
    hiddenPassedCount,
    allPassed: !anyFailed && hiddenPassed,
    totalPassed,
    totalTests,
  };
}

function makeErrorSummary(
  visibleTests: TestCase[],
  message: string,
  errorType = 'Error'
): ExecutionSummary {
  return {
    visibleResults: visibleTests.map(tc => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput: message,
      status: 'ERROR',
      error: errorType,
    })),
    hiddenPassed: false,
    hiddenTotal: 0,
    hiddenPassedCount: 0,
    allPassed: false,
    totalPassed: 0,
    totalTests: visibleTests.length,
    compilationError: message,
  };
}
