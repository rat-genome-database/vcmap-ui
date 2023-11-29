interface IAppConfig {
  API_BASE_URL: string;
  LOG_LEVEL?: string;
}

declare module '@/../config/app.config' {
  const config: IAppConfig;
  export = config;
}