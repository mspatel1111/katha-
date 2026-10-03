export function createOrderIdentity(now = Date.now()) {
  const nonce = crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();
  return {
    orderId: `KAT${now.toString(36).toUpperCase()}${nonce}`,
    receipt: `katha_${now}_${nonce.toLowerCase()}`,
  };
}
