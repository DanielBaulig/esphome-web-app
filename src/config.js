const config = (await import.meta.glob('../esphome-web.json', {eager: true}))['../esphome-web.json'] || {};

export const title = config.title || 'ESPHome Link';
export const filters = config.filters || [];
