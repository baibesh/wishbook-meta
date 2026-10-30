// Downloads the free DB-IP country database (CC BY 4.0, https://db-ip.com) to geoip/country.mmdb.
// It is published monthly; early in a month the new file may not exist yet, so fall back a month.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const out = resolve(import.meta.dirname, '../geoip/country.mmdb');
const month = (back) => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - back);
  return d.toISOString().slice(0, 7);
};

for (const back of [0, 1]) {
  const url = `https://download.db-ip.com/free/dbip-country-lite-${month(back)}.mmdb.gz`;
  const response = await fetch(url);
  if (!response.ok) continue;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, gunzipSync(Buffer.from(await response.arrayBuffer())));
  console.log(`${url} -> ${out}`);
  process.exit(0);
}
console.error('could not download the DB-IP country database');
process.exit(1);
