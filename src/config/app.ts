import { registerAs } from '@nestjs/config'

export default registerAs('app', () => ({
  name: process.env.APP_NAME,
  port: process.env.PORT ? +process.env.PORT : 3000,
  isDev: process.env.NODE_ENV === 'development',
  serverUrl: process.env.MVP_SERVER_URL
}))
