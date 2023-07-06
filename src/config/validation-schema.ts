import Joi from 'joi'
import pkg from '~/package.json'

export default Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().default(pkg.name),
  RATE_LIMITER_LOGGER: Joi.boolean().default(true),
  RATE_LIMITER_POINTS: Joi.number().default(1000000),
  RATE_LIMITER_DURATION: Joi.number().default(10 * 60),
  NFT_SCAN_API_KEY: Joi.string().required(),
  NFT_SCAN_API_BASE_URL: Joi.string().required(),
  ETH_SUBGRAPH_ENDPOINT: Joi.string().required(),
  POLYGON_SUBGRAPH_ENDPOINT: Joi.string().required()
})
