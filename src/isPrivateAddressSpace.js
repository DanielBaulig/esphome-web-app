function stringAddressToBinaryAddress(s) {
  const bytes = s.split('.').map(BigInt);
  return (
    (bytes[0] << 24n) +
    (bytes[1] << 16n) +
    (bytes[2] << 8n) +
    bytes[3]
  );
}

function cidrSuffixToBitmask(suffix) {
  const suffixN = BigInt(suffix);
  return (2n ** suffixN << (32n - suffixN));
}

function binaryAddressToStringAddress(addrN) {
  return [
    String((addrN >> 24n) & 255n),
    String((addrN >> 16n) & 255n),
    String((addrN >> 8n) & 255n),
    String(addrN & 255n)
  ].join('.');
}

// We are not dealing with IPv6 for now
const privateAddressSpaceCIDRs = [
  '10.0.0.0/8',
  '100.64.0.0/10',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '169.254.0.0/16',
].map(
  cidr => cidr.split('/')
).map(
  ([netAddr, suffix]) => [
    stringAddressToBinaryAddress(netAddr),
    cidrSuffixToBitmask(suffix),
  ]
);

export default function isPrivateAddressSpace(addr) {
  const addrN = stringAddressToBinaryAddress(addr);
  return privateAddressSpaceCIDRs.some(
    ([netAddrN, netMask]) => (netAddrN & netMask) === (addrN & netMask)
  );
}
