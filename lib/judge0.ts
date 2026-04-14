// Judge0 CE Public API — no API key required
const JUDGE0_URL = 'https://ce.judge0.com';

export const LANGUAGE_IDS: Record<string, number> = {
  python: 71,
  cpp:    54,
  java:   62,
};

export const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python 3.10',
  cpp:    'C++ 17',
  java:   'Java 17',
};

export const LANGUAGE_EXTENSIONS: Record<string, string> = {
  python: '.py',
  cpp:    '.cpp',
  java:   '.java',
};

export const STARTER_TEMPLATES: Record<string, string> = {
  python: `def solution():
    # Write your solution here
    pass

print(solution())`,

  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Write your solution here
    cout << "Hello World" << endl;
    
    return 0;
}`,

  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        // Write your solution here
        System.out.println("Hello World");
    }
}`,
};

export interface ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
}

export async function executeCode(
  sourceCode: string,
  language: string,
  stdin: string = ''
): Promise<ExecutionResult> {
  const languageId = LANGUAGE_IDS[language] || LANGUAGE_IDS.python;

  const res = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin || '',
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Judge0 error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export function formatOutput(result: ExecutionResult): {
  output: string;
  status: string;
  isError: boolean;
} {
  if (result.compile_output?.trim()) {
    return {
      output: result.compile_output,
      status: 'Compilation Error',
      isError: true,
    };
  }
  if (result.stderr?.trim()) {
    return {
      output: result.stderr,
      status: 'Runtime Error',
      isError: true,
    };
  }
  if (result.status?.id === 5) {
    return {
      output: 'Time Limit Exceeded (> 5 seconds)',
      status: 'Time Limit Exceeded',
      isError: true,
    };
  }
  return {
    output: result.stdout?.trim() || '(no output)',
    status: result.status?.description || 'Accepted',
    isError: false,
  };
}
