/**
 * Scale Social Agent API client (read-only): brands, locations, app-usage
 * metrics and UGC assets, for agents and integrations.
 *
 * Usage (browser or node >= 18):
 *   import { ScaleSocialAgentApi } from "@scale-social/sdk/agent";
 *   const api = new ScaleSocialAgentApi({ apiKey: "ssk_...", baseUrl: "https://api-dev.scalesocialai.com" });
 *   const brands = await api.listBrands();
 *   const metrics = await api.getMetrics("cgcSessions", { brandParentId: brands[0].brandParentId });
 *
 * MCP clients connect to `api.mcpUrl` with the same key as a bearer token.
 */

export class ScaleSocialAgentApiError extends Error {
    constructor({code, message, status, details}) {
        super(message || code || `Request failed (${status})`);
        this.name = "ScaleSocialAgentApiError";
        this.code = code || "unknown";
        this.status = status;
        this.details = details;
    }
}

const encodeQueryValue = (value) => (Array.isArray(value) ? value.join(",") : String(value));

export class ScaleSocialAgentApi {
    constructor({apiKey, baseUrl, fetch: fetchImpl} = {}) {
        if (!apiKey) throw new Error("apiKey is required");
        if (!baseUrl) throw new Error("baseUrl is required");
        this.apiKey = apiKey;
        let trimmedBaseUrl = baseUrl;
        while (trimmedBaseUrl.endsWith("/")) trimmedBaseUrl = trimmedBaseUrl.slice(0, -1);
        this.baseUrl = trimmedBaseUrl;
        this._fetch = fetchImpl || globalThis.fetch;
        if (typeof this._fetch !== "function") throw new Error("A fetch implementation is required");
    }

    /** URL of the MCP endpoint; send the same key as `Authorization: Bearer`. */
    get mcpUrl() {
        return `${this.baseUrl}/mcp`;
    }

    /** Full `{data, meta}` envelope for a GET, or the error envelope as a thrown error. */
    async request(method, path, {query, body} = {}) {
        const url = new URL(`${this.baseUrl}${path}`);
        Object.entries(query || {}).forEach(([key, value]) => {
            if (value === undefined || value === null || value === "") return;
            url.searchParams.set(key, encodeQueryValue(value));
        });
        const headers = {Authorization: `Bearer ${this.apiKey}`, Accept: "application/json"};
        if (body !== undefined) headers["Content-Type"] = "application/json";
        const response = await this._fetch(url.toString(), {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new ScaleSocialAgentApiError({...json?.error, status: response.status});
        }
        return json;
    }

    async _get(path, query) {
        return (await this.request("GET", path, {query})).data;
    }

    async _post(path, body) {
        return (await this.request("POST", path, {body})).data;
    }

    /** What this key may do: scopes, brands, locations, rate limit. */
    async me() {
        return this._get("/v1/me");
    }

    async listBrands() {
        return (await this._get("/v1/brands")).brands;
    }

    async listLocations(brandParentId) {
        return (await this._get(`/v1/brands/${encodeURIComponent(brandParentId)}/locations`)).locations;
    }

    async listMetricSets() {
        return (await this._get("/v1/metrics/sets")).metricSets;
    }

    /**
     * @param {string} metricSet - `cgcFunnel` | `cgcSessions` | `eventSessions`
     * @param {Object} params - `brandParentId` (location sets), `eventId` (event sets),
     *   `locationIds` (array), `startDate`/`endDate` (YYYY-MM-DD), `granularity` ("total" | "day"),
     *   `includeLive`, `comparePrevious`
     */
    async getMetrics(metricSet, params = {}) {
        return this._get(`/v1/metrics/${encodeURIComponent(metricSet)}`, params);
    }

    /**
     * One page of assets. `params`: `brandParentId` (required), `locationIds`, `tags`,
     * `gradeMin` (60 | 75 | 90), `mediaType`, `orientation`, `sources`, `startDate`, `endDate`,
     * `rightsGrantedOnly`, `includeNotRecommended` (internal keys), `sort`, `cursor`, `limit`.
     * Returns `{assets, count, counts, nextCursor, filters, sort}`.
     */
    async searchAssets(params) {
        return this._get("/v1/assets", params);
    }

    /** Every matching asset, page by page. */
    async* iterateAssets(params) {
        let cursor = params?.cursor;
        do {
            const page = await this.searchAssets({...params, cursor});
            for (const asset of page.assets) yield asset;
            cursor = page.nextCursor;
        } while (cursor);
    }

    async getAsset(assetId) {
        return this._get(`/v1/assets/${encodeURIComponent(assetId)}`);
    }

    /**
     * Short-lived signed download URL (scope `assets:download`).
     * @param {string} assetId
     * @param {Object} [options] - `ttlMinutes` (1-1440, default 60), `variant` ("original" | "preview" | "thumbnail"),
     *   `allowUnreleased` (internal keys)
     * @returns {Promise<{assetId, variant, url, expiresAt, ttlMinutes, contentType, fileSizeBytes, rightsStatus, released}>}
     */
    async getAssetDownloadUrl(assetId, options = {}) {
        return this._post(`/v1/assets/${encodeURIComponent(assetId)}/download-url`, options);
    }
}
