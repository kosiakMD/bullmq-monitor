const env = (import.meta as any).env ?? {};
const useMocks = env.VITE_ENABLE_MOCKS === 'true';

export const EnvConfig = {
  dev: env.MODE === 'development',
  demo: useMocks,
  useMocks,
};
