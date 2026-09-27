import ipaddr from 'ipaddr.js';

const DENIED_RANGES = new Set([
  'unspecified', 'broadcast', 'multicast', 'linkLocal', 'loopback',
  'private', 'carrierGradeNat', 'reserved', 'uniqueLocal', 'ipv4Mapped',
]);

export function isPublicIp(value: string): boolean {
  if (!ipaddr.isValid(value)) return false;
  return !DENIED_RANGES.has(ipaddr.parse(value).range());
}

export function assertPublicIp(value: string): string {
  if (!isPublicIp(value)) throw new Error('IP_NON_PUBLIC');
  return ipaddr.parse(value).toNormalizedString();
}