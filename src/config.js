const config = (await import.meta.glob('../esphome-web.json', {eager: true}))['../esphome-web.json'] || {};

export const title = config.title || 'ESPHome Web App';
export const filters = config.filters || [];
export const insecureOrigin = config.insecureOrigin;
