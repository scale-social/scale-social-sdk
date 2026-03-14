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

const initialUploadResult = await sdk.initialUpload({
  locationId: "<locationId>",
  uid: "<user id>",
  assets: [{ url: "<asset url>" }],
  nonPii: {
    petName: "Buddy",
    source: "campaign-123",
    sessionId: "abc-456",
  },
  // additionalEvaluation: {
  //  isEnabled: true,
  //   evaluationType: "is_puppy",
  //   specifications: ["puppy", "white", "labrador", "black"],
  //   evaluationOptions: ["highly_likely", "likely", "unlikely", "highly_unlikely"],
  // },
});

console.log(initialUploadResult);
// {
//   data: {
//     submissionId: "<submissionId>",
//     uploads: [
//       {
//         additionalEvaluation: {
//           is_puppy: {
//             evaluation: "likely" | "unlikely",
//             specifications: ["puppy", "white", "labrador", "black"] | []
//           }
//         },
//         autoRejectCode: 0,
//         downloadUrl: "<processed asset url>",
//         evaluationFeedback: "<feedback text>",
//         evaluationReason: "<reason text>",
//         evaluationScore: <score>,
//         filePath: "<storage file path>",
//         uploadId: "<uploadId>"
//       }
//     ]
//   }
// }

// Use this value for manual review:
// initialUploadResult.data.uploads[0].uploadId

const manualEvaluationResult = await sdk.addManualEvaluation({
  updates: [
    {
      uploadId: initialUploadResult.data.uploads[0].uploadId,
      manualEvaluation: {
        evaluationType: "is_puppy",
        evaluation: "not present",
        specifications: ["dog", "doleful"],
      },
    },
  ],
});

console.log(manualEvaluationResult);
// {
//   data: [
//     {
//       additionalEvaluation: {
//         is_puppy: {
//           evaluation: "likely" | "unlikely",
//           manualEvaluation: "present" | "not present",
//           manualSpecifications: ["dog", "doleful"],
//           specifications: ["puppy", "black", "labrador"]
//         }
//       },
//       uploadId: "<uploadId>"
//     }
//   ]
// }
```

### SDK methods

- `sdk.initialUpload(payload)` → `sdkInitialUpload` SDK helper method
- `sdk.addManualEvaluation(payload)` → `sdkManualEvaluation` SDK helper method

## API Endpoints

All SDK endpoints are authenticated via an API key and expect `Content-Type: application/json`.
Send the key in one of these headers: `x-ssai-api-key`, `x-api-key`, `x-ssai-key`, or `Authorization: Bearer <apiKey>`.

### POST `/sdkInitialUploadHttp`

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
    "evaluationType": "is_puppy",
    "specifications": ["puppy", "white", "labrador", "black"],
    "evaluationOptions": ["highly_likely", "likely", "unlikely", "highly_unlikely"]
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
        "additionalEvaluation": {
          "is_puppy": {
            "evaluation": "likely | unlikely",
            "specifications": ["puppy", "white", "labrador", "black"]
          }
        },
        "autoRejectCode": 0,
        "downloadUrl": "<processed asset url>",
        "evaluationFeedback": "<feedback text>",
        "evaluationReason": "<reason text>",
        "evaluationScore": "<score>",
        "filePath": "<storage file path>",
        "uploadId": "<uploadId>"
      }
    ]
  }
}
```

### POST `/sdkManualEvaluationHttp`

Overrides or sets `additionalEvaluation` on existing uploads.

#### Request body

```json
{
  "updates": [
    {
      "uploadId": "abcd1234",
      "manualEvaluation": {
        "evaluationType": "is_puppy",
        "evaluation": "not present",
        "specifications": ["dog", "doleful"]
      }
    }
  ]
}
```

#### Field details

- `updates` (array, required): Up to 500 updates per request.
  - `uploadId` (string, required) [from `data.uploads[i].uploadId` in the results of /sdkInitialUploadHttp, not the `submissionId`.]
  - `manualEvaluation` (object, required)
    - `evaluationType` (string, required): Alphanumeric/underscore only.
    - `evaluation` (string, required): Manual evaluation label.
    - `specifications` (string[], optional): Manual specification labels.

#### Response

```json
{
  "data": [
    {
      "uploadId": "abcd1234",
      "additionalEvaluation": {
        "is_puppy": {
          "evaluation": "likely",
          "manualEvaluation": "not present",
          "manualSpecifications": ["dog", "doleful"],
          "specifications": ["puppy", "black", "labrador"]
        }
      }
    },
    { "uploadId": "wxyz9876", "error": "Upload not found" }
  ]
}
```
