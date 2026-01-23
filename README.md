# @scale-social/sdk

JavaScript SDK for Scale Social integrations.

## Install

```bash
npm install @scale-social/sdk
```

## Usage

```js
import { ScaleSocialSdk } from "@scale-social/sdk";

const sdk = new ScaleSocialSdk({
  baseUrl: "url"  
  apiKey: "key",
});

const handleUpload = async () => {
  const result = await sdk.initialUpload({
    locationId: "id",
    uid: "uid",
    assets: [{ url: "url" }],
    nonPii: { petName: "Buddy", location: "Austin, TX", dts: Date.now() },
    // additionalEvaluation: {
    //   isEnabled: true,
    //   evaluationType: "is_puppy",
    //   specifications: ["puppy", "white", "labrador", "black"],
    //   evaluationOptions: ["highly_likely", "likely", "unlikely", "highly_unlikely"],
    // }
  });
  console.log(result);
};

const handleManualEvaluation = async () => {
  const result = await sdk.addManualEvaluation({
    updates: [
      // {
      //   uploadId: "id",
      //   manualEvaluation: {
      //     evaluationType: "is_puppy",
      //     evaluation: "present",
      //     specifications: ["puppy", "cute", "black", "labrador"],
      //   },
      // },
      {
        uploadId: "id",
        manualEvaluation: {
          evaluationType: "is_puppy",
          evaluation: "not present",
          specifications: ["dog", "doleful"],
        },
      },
    ],
  });
  console.log(result);
};
```

### SDK methods

- `sdk.initialUpload(payload)` → `sdkInitialUpload` Cloud Function (POST)
- `sdk.addManualEvaluation(payload)` → `sdkManualEvaluation` Cloud Function (POST)

## API Endpoints

All SDK endpoints are authenticated via an API key and expect `Content-Type: application/json`.
Send the key in one of these headers: `x-ssai-api-key`, `x-api-key`, `x-ssai-key`, or `Authorization: Bearer <apiKey>`.

### POST `/sdk/initial-upload`

Uploads assets (URLs or base64), runs the CGC pipeline, and returns upload metadata.

#### Request body

```json
{
  "uid": "randomized-user-id",
  "locationId": "brand-location-id",
  "assets": [
    { "url": "https://example.com/image.jpg" },
    { "base64": "data:image/png;base64,...", "filename": "photo.png" }
  ],
  "nonPii": {
    "source": "campaign-123",
    "sessionId": "abc-456"
  },
  "additionalEvaluation": {
    "isEnabled": true,
    "evaluationType": "adverse_event",
    "specifications": ["blood", "injury"],
    "evaluationOptions": ["present", "not_present"]
  }
}
```

#### Field details

- `uid` (string, required): Anonymous or hashed user identifier.
- `locationId` (string, required): Brand/location ID that owns the uploads.
- `assets` (array, required): Up to 10 assets per request.
  - Each asset must include either `url` or `base64`.
  - For `base64`, include `filename` (optional) to preserve the original name.
- `nonPii` (object, optional): Any non-PII metadata to store with the submission.
- `additionalEvaluation` (object, optional):
  - `isEnabled` (boolean, optional): Set false to disable evaluations for this request.
  - `evaluationType` (string, optional): If omitted, the brand default may apply.
  - `specifications` (string[], optional): Overrides preset specs when provided.
  - `evaluationOptions` (string[], optional): Overrides preset options when provided.

#### Response

```json
{
  "data": {
    "submissionId": "sdk_<brandParentId>_<id>",
    "uploads": [
      {
        "uploadId": "abcd1234",
        "autoRejectCode": 0,
        "evaluationScore": 82,
        "evaluationReason": "",
        "evaluationFeedback": "",
        "filePath": "brands/<brandParentId>/<locationId>/sdk/<file>",
        "downloadUrl": "https://...",
        "additionalEvaluation": {
          "adverse_event": {
            "evaluation": "present",
            "evaluationScore": 0,
            "evaluationReason": "",
            "evaluationFeedback": "",
            "manualEvaluation": "",
            "manualSpecifications": []
          }
        }
      }
    ]
  }
}
```

### POST `/sdk/manual-evaluation`

Overrides or sets `additionalEvaluation` on existing uploads.

#### Request body

```json
{
  "updates": [
    {
      "uploadId": "abcd1234",
      "manualEvaluation": {
        "evaluationType": "adverse_event",
        "evaluation": "present",
        "specifications": ["blood", "injury"]
      }
    }
  ]
}
```

#### Field details

- `updates` (array, required): Up to 500 updates per request.
  - `uploadId` (string, required)
  - `manualEvaluation` (object, required)
    - `evaluationType` (string, required): Alphanumeric/underscore only.
    - `evaluation` (string, required): Manual evaluation label.
    - `specifications` (string[], optional): Manual specification labels.

#### Response

```json
{
  "data": [
    { "uploadId": "abcd1234", "additionalEvaluation": { "...": {} } },
    { "uploadId": "wxyz9876", "error": "Upload not found" }
  ]
}
```
