import type { ReactNode } from 'react';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { formatBytes } from '../../../core/services';
import type { ResponseState } from '../../../types';

interface RequestStatsModalProps {
  response: ResponseState;
}

function formatMs(value?: number): string {
  return typeof value === 'number' ? `${value}ms` : '-';
}

function StatRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <box style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 0.5 }}>
      <text fg={colors.text.muted}>{label}</text>
      <text fg={colors.text.primary}>{value}</text>
    </box>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <box
      style={{
        flexDirection: 'column',
        border: true,
        borderColor: colors.border.default,
        borderStyle: 'rounded',
        padding: 1,
        marginBottom: 1,
      }}
    >
      <text fg={colors.accent.primary}>
        <strong>{title}</strong>
      </text>
      <box style={{ flexDirection: 'column', marginTop: 1 }}>{children}</box>
    </box>
  );
}

export function RequestStatsModal({ response }: RequestStatsModalProps) {
  const { colors } = useTheme();
  const stats = response.stats;

  if (!stats) {
    return (
      <box style={{ flexDirection: 'column', height: '100%', padding: 1 }}>
        <text fg={colors.text.muted}>No request stats are available for this response.</text>
      </box>
    );
  }

  return (
    <scrollbox style={{ flexGrow: 1 }}>
      <box style={{ flexDirection: 'column', padding: 1 }}>
        <Section title="Timing">
          <StatRow label="Total response time" value={formatMs(stats.timings.totalMs)} />
          <StatRow label="Time to first byte" value={formatMs(stats.timings.ttfbMs)} />
          <StatRow label="Download time" value={formatMs(stats.timings.downloadMs)} />
        </Section>

        <Section title="Size">
          <StatRow label="Request headers" value={formatBytes(stats.requestSize.headersBytes)} />
          <StatRow label="Request body" value={formatBytes(stats.requestSize.bodyBytes)} />
          <StatRow label="Request total" value={formatBytes(stats.requestSize.totalBytes)} />
          <StatRow label="Response headers" value={formatBytes(stats.responseSize.headersBytes)} />
          <StatRow label="Response body" value={formatBytes(stats.responseSize.bodyBytes)} />
          <StatRow label="Response total" value={formatBytes(stats.responseSize.totalBytes)} />
          {typeof stats.responseSize.contentLengthHeader === 'number' && (
            <StatRow
              label="Content-Length"
              value={formatBytes(stats.responseSize.contentLengthHeader)}
            />
          )}
        </Section>

        <Section title="Network">
          <StatRow label="URL" value={stats.network.url} />
          {stats.network.finalUrl && <StatRow label="Final URL" value={stats.network.finalUrl} />}
          <StatRow label="Protocol" value={stats.network.protocol} />
          <StatRow label="Host" value={stats.network.host} />
          <StatRow label="Port" value={stats.network.port ?? '-'} />
          <StatRow label="Redirected" value={stats.network.redirected ? 'yes' : 'no'} />
          {stats.network.errorType && (
            <StatRow label="Error type" value={stats.network.errorType} />
          )}
        </Section>
      </box>
    </scrollbox>
  );
}
