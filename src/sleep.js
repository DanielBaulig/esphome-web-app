export default async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
