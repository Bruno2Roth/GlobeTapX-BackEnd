const endpointMetrics = new Map();

export const recordRequestMetric = (method, path, durationMs, statusCode) => {
    const key = `${method} ${path}`;
    const previous = endpointMetrics.get(key) || {
        count: 0,
        totalMs: 0,
        minMs: Number.POSITIVE_INFINITY,
        maxMs: 0,
        statusCounts: {},
    };

    previous.count += 1;
    previous.totalMs += durationMs;
    previous.minMs = Math.min(previous.minMs, durationMs);
    previous.maxMs = Math.max(previous.maxMs, durationMs);
    previous.statusCounts[statusCode] = (previous.statusCounts[statusCode] || 0) + 1;
    endpointMetrics.set(key, previous);
};
