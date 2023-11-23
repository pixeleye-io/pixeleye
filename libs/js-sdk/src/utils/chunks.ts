export function splitIntoChunks<T>(array: T[], chunkSize: number): T[][] {
  return array.flatMap((_, i) =>
    i % chunkSize === 0 ? [array.slice(i, i + chunkSize)] : []
  );
}
