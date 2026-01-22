/**
 * Minimal Scale Social SDK (v0)
 *
 * Usage (browser or node >= 18):
 *   import { ScaleSocialSdk } from "./ScaleSocialSdk";
 *   const sdk = new ScaleSocialSdk({ apiKey: "...", devEnv: "local" }); // devEnv: "local" | "dev" | (omit for prod)
 *   const res = await sdk.initialUpload({
 *     uid: "randomized-uid",
 *     assets: [{ url: "https://example.com/file.jpg" }],
 *     nonPii: { petName: "Buddy", location: "Austin, TX", dts: Date.now() }
 *   });
 */

export class ScaleSocialSdk {
    constructor({apiKey, devEnv} = {}) {
        if (!apiKey) throw new Error("apiKey is required");
        this.apiKey = apiKey;
        this.devEnv = devEnv || "";
        this.baseUrl = ScaleSocialSdk.resolveBaseUrl(this.devEnv);
    }

    static resolveBaseUrl(devEnv) {
        const env = (devEnv || "").toLowerCase().trim();
        if (env === "local") {
            return "http://127.0.0.1:5001/scale-social-dev/us-central1/";
        }
        if (env === "dev") {
            return "https://us-central1-scale-social-dev.cloudfunctions.net/";
        }
        // prod default
        return "https://us-central1-scale-social-84c7e.cloudfunctions.net/";
    }

    async _post(functionName, payload) {
        const resp = await fetch(`${this.baseUrl}${functionName}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(payload || {}),
        });

        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            const msg = json?.message || `Request failed (${resp.status})`;
            throw new Error(msg);
        }
        return json?.data;
    }

    /**
     * @param {Object} payload
     * @param {string} payload.uid - randomized UID (no PII)
     * @param {Array<{url?: string, base64?: string, filename?: string}>} payload.assets
     * @param {Object} [payload.nonPii]
     * @param {string} [payload.requestId] - optional idempotency key
     */
    async initialUpload(payload) {
        return await this._post("sdkInitialUpload", payload);
    }

    /**
     * Manually set/replace additionalEvaluation for an upload.
     *
     * @param {Object} payload
     * @param {Array<{uploadId: string, manualEvaluation: {evaluationType: string, evaluation: string, specifications?: string[]}}>} payload.updates
     */
    async addManualEvaluation(payload) {
        return await this._post("sdkManualEvaluation", payload);
    }
}

