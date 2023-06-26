import { registerAs } from '@nestjs/config'

export default registerAs('subgraph', () => ({
  endpoints: {
    eth: process.env.ETH_SUBGRAPH_ENDPOINT,
    polygon: process.env.POLYGON_SUBGRAPH_ENDPOINT
  }
}))
