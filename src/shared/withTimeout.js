export const withTimeout = async (operation, timeoutMs, timeoutCode = 'ETIMEDOUT') => {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(
            new Error('Operation timed out'),
            { code: timeoutCode },
        )), timeoutMs);
    });

    try {
        return await Promise.race([
            typeof operation === 'function' ? operation() : operation,
            timeout,
        ]);
    } finally {
        clearTimeout(timer);
    }
};
