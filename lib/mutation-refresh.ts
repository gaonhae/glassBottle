type SearchParamsLike = {
  get(name: string): string | null;
};

export function getMutationRefreshMarker(
  pathname: string,
  searchParams: SearchParamsLike,
  watchedParams: readonly string[]
) {
  const matchedParams: string[] = [];

  for (const param of watchedParams) {
    const value = searchParams.get(param);

    if (!value) {
      continue;
    }

    matchedParams.push(`${param}=${value}`);
  }

  if (matchedParams.length === 0) {
    return "";
  }

  return `${pathname}?${matchedParams.join("&")}`;
}
