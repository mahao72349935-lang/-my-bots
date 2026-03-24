export function normalizeMockData(raw: unknown): unknown[] | null {
	if (raw == null) return null;
	return Array.isArray(raw) ? raw : [raw];
}
