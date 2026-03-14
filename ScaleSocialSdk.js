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
    constructor({apiKey, baseUrl} = {}) {
        if (!apiKey) throw new Error("apiKey is required");
        if (!baseUrl) throw new Error("baseUrl is required");
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
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
     * @param {string} payload.locationId - Scale Social location ID for the SDK client
     * @param {Array<{url?: string, base64?: string, filename?: string}>} payload.assets
     * @param {Object} [payload.nonPii]
     * @returns {Promise<{data: {submissionId: string, uploads: Array<{uploadId: string, autoRejectCode: number, evaluationScore: number, evaluationReason: string, evaluationFeedback: string, filePath: string, downloadUrl: string, additionalEvaluation: Object}>}}>}
     */
    async initialUpload(payload) {
        return await this._post("sdkInitialUpload", payload);
    }

    /**
     * Manually set/replace additionalEvaluation for an upload.
     *
     * @param {Object} payload
     * @param {Array<{uploadId: string, manualEvaluation: {evaluationType: string, evaluation: string, specifications?: string[]}}>} payload.updates
     * @returns {Promise<{data: Array<{uploadId: string, additionalEvaluation?: Object, error?: string}>}>}
     */
    async addManualEvaluation(payload) {
        return await this._post("sdkManualEvaluation", payload);
    }
}

