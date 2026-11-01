import { urlText } from '../../lib/page-url-state';
export const catalogUrlSchema = { q: urlText(200), category: { ...urlText(80), defaultValue: 'all' }, status: { ...urlText(80), defaultValue: 'all' } };
/** Only bounded screen state enters client props; unrelated query parameters stay private. */
export function catalogSearch(parameters: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, field] of Object.entries(catalogUrlSchema)) {
    const value = parameters[key];
    if (typeof value === 'string' && field.accept(value)) params.set(key, value);
  }
  const course = parameters.course;
  if (typeof course === 'string' && /^[1-9]\d{0,14}$/.test(course)) params.set('course', course);
  return params.toString();
}
