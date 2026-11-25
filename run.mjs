import { join } from 'node:path';
import { z } from '@cairul/pdk';
import {
  list,
  locations,
  lineLocations,
  option,
  repeat,
  report,
  reportsIn,
  requireExclusive,
  selectors,
  value,
} from '@cairul/pdk/runner';
import { junit } from '@cairul/pdk/reports';

export default {
  settings: { implementation: z.enum(['js', 'jvm', 'ruby']).default('js') },
  select: selectors({ features: list, locations: lineLocations, namePattern: value, tags: value, profiles: list }),
  build(select, temp, { implementation }) {
    requireExclusive(select.features, select.locations);
    if (select.profiles && implementation === 'jvm')
      throw new Error('Choose the JVM runner profile with fixed command arguments.');
    const paths = select.features ?? locations(select.locations);
    const shared = [
      ...option('--name', select.namePattern),
      ...option('--tags', select.tags),
      ...repeat('--profile', select.profiles),
    ];
    const output = join(temp, 'result.xml');
    switch (implementation) {
      case 'jvm':
        return { args: ['--plugin', 'junit:' + output, ...shared, ...paths], read: report('result.xml', junit) };
      case 'ruby':
        return {
          command: ['cucumber'],
          args: ['--format', 'junit', '--out', temp, ...shared, ...paths],
          read: reportsIn('.xml', junit),
        };
      default:
        return {
          command: ['cucumber-js'],
          args: ['--format', 'junit:' + output, ...shared, ...paths],
          read: report('result.xml', junit),
        };
    }
  },
};
