export function courseIdFromSearch(search: string): string | null {
  return new URLSearchParams(search).get("course");
}

export function urlWithoutCourse(href: string): string | null {
  const url = new URL(href);
  if (!url.searchParams.has("course")) return null;

  url.searchParams.delete("course");
  return url.href;
}
