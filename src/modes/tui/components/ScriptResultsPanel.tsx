import { useTheme } from '../../../shared/theme/ThemeProvider';
import type { ScriptExecutionResult, ScriptExecutionSummary } from '../../../types';

interface ScriptResultsPanelProps {
  results?: ScriptExecutionSummary;
}

export function ScriptResultsPanel({ results }: ScriptResultsPanelProps) {
  const { colors } = useTheme();

  const renderResult = (title: string, result: ScriptExecutionResult | undefined) => {
    if (!result) {
      return (
        <box style={{ flexDirection: 'column', marginBottom: 1 }}>
          <text fg={colors.text.muted}>{title}: not run</text>
        </box>
      );
    }

    return (
      <box
        style={{
          flexDirection: 'column',
          border: true,
          borderColor: result.success ? colors.syntax.success : colors.syntax.error,
          padding: 1,
          marginBottom: 1,
        }}
      >
        <text fg={result.success ? colors.syntax.success : colors.syntax.error}>
          <strong>
            {title}: {result.success ? 'passed' : 'failed'}
          </strong>
        </text>
        {result.error && <text fg={colors.syntax.error}>Error: {result.error}</text>}
        {(result.assertions ?? []).length > 0 && (
          <box style={{ flexDirection: 'column', marginTop: 1 }}>
            <text fg={colors.text.muted}>Tests</text>
            {(result.assertions ?? []).map((assertion, index) => (
              <text
                key={`${assertion.name}-${index}`}
                fg={assertion.passed ? colors.syntax.success : colors.syntax.error}
              >
                {assertion.passed ? '✓' : '✗'} {assertion.name}
                {assertion.message ? ` - ${assertion.message}` : ''}
              </text>
            ))}
          </box>
        )}
        {result.output.length > 0 && (
          <box style={{ flexDirection: 'column', marginTop: 1 }}>
            <text fg={colors.text.muted}>Console</text>
            {result.output.map((line, index) => (
              <text key={`${line}-${index}`} fg={colors.text.primary}>
                {line}
              </text>
            ))}
          </box>
        )}
      </box>
    );
  };

  if (!results?.beforeRequest && !results?.afterResponse) {
    return <text fg={colors.text.muted}>No scripts were run for this response.</text>;
  }

  return (
    <scrollbox>
      <box style={{ flexDirection: 'column' }}>
        {renderResult('Before Request', results.beforeRequest)}
        {renderResult('After Response', results.afterResponse)}
      </box>
    </scrollbox>
  );
}
