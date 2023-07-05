import { ErcType } from 'nftscan-api'

export const AssetTypeEnum: Record<string, number> = {
  [ErcType.ERC_721]: 1,
  [ErcType.ERC_1155]: 2
}

export function formatHex(hex_str: string | number | bigint, btyes = 32) {
  let s = ''
  if (typeof hex_str == 'string') {
    s = BigInt(hex_str).toString(16)
  } else {
    s = hex_str.toString(16)
  }
  const len = btyes * 2 - s.length
  if (len > 0) {
    return '0x' + Array.from({ length: len + 1 }).join('0') + s
  } else {
    return '0x' + s
  }
}
