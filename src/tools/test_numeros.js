import path from 'path';
import { fileURLToPath } from 'url';
import Service from '../application/services/numerosEmergenciaService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  try {
    const svc = new Service({
      remoteUrl: process.env.REMOTE_EM_API_URL || 'https://gleeful-halva-f173ab.netlify.app/emergency-numbers.json'
    });

    console.log('Fetching all countries...');
    const all = await svc.getAll();
    console.log('Total countries:', Array.isArray(all) ? all.length : 'unexpected');

    const sample = ['AR','AU','US','AQ','XR'];
    for (const c of sample) {
      const one = await svc.getCountry(c);
      console.log(c, one ? Object.keys(one).length : 'not found');
    }
  } catch (err) {
    console.error('Test failed:', err && err.stack ? err.stack : err);
    process.exit(2);
  }
})();
