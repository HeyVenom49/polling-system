export function pollRoom(pollId: string): string {
  return `poll:${pollId}`;
}

/** Creators/admins only — used for unpublished live results. */
export function pollCreatorRoom(pollId: string): string {
  return `poll:${pollId}:creators`;
}
