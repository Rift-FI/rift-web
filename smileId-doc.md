Install Via NPM

Copy
npm install @smileid/web-components@<version>
Then, in your VueJS, AngularJS, or React component:


Copy
import "@smileid/web-components/smart-camera-web";

Usage
How to use the Smile ID Web Integration

Steps
Fetch the web token from your server, when ready

Configure the web integration

Test the Integration

Fetch the Web Token from your server
Using the Web Token endpoint set up on your server, fetch a web token for the client

This can take the form of a click event on your web site or application.


Copy
const baseAPIURL = `${your - API - server - URL}`;

const getWebToken = async (baseAPIURL) => {
  const fetchConfig = {};

  fetchConfig.cache = "no-cache";
  fetchConfig.mode = "cors";
  fetchConfig.headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  fetchConfig.method = "POST";

  const URL = `${baseAPIURL}/token/`;
  try {
    const response = await fetch(URL, fetchConfig);

    if (response.status === 200 || response.statusCode === 200) {
      const json = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      return json;
    }
  } catch (e) {
    console.log(`API: ${e.name}, ${e.message}`);
    throw e;
  }
};

const verifyWithSmileIdentityButton = document.querySelector(
  "#verify-with-smile-id",
);

verifyWithSmileIdentityButton.addEventListener(
  "click",
  async (e) => {
    e.preventDefault();

    verifyWithSmileIdentityButton.textContent = "Initializing session...";
    verifyWithSmileIdentityButton.disabled = true;

    const { token } = await getWebToken(baseAPIURL);
  },
  false,
);
Configure the Web Integration
With the web token, we can now configure our integration


Copy
const configureSmileIdentityWebIntegration = (token) => {
  SmileIdentity({
    token,
    product: "biometric_kyc",
    callback_url: `${your - API - server - URL}/callback`,
    environment: "sandbox",
    partner_details: {
      partner_id: `${your - smile - identity - partner - id}`,
      name: `${your - app - name}`,
      logo_url: `${your - app - logo - url}`,
      policy_url: `${your - data - privacy - policy - url}`,
      theme_color: "#000",
    },
    partner_params:{
        "sample_meta_data": "meta-data-value", //include meta data
        "sandbox_result" : "0" //mock sandbox result
    }, 
    onSuccess: () => {},
    onClose: () => {},
    onError: () => {},
  });
};

// ACTION: call the initialization function in the event handler
verifyWithSmileIdentityButton.addEventListener(
  "click",
  async (e) => {
    e.preventDefault();

    verifyWithSmileIdentityButton.textContent = "Initializing session...";
    verifyWithSmileIdentityButton.disabled = true;

    try {
      const { token } = await getWebToken(baseAPIURL);
      configureSmileIdentityWebIntegration(token);
    } catch (e) {
      throw e;
    }
  },
  false,
);
The API for configuring the integration is as follows

Key
Type
Required
Description
token

string

Yes

token generated on the server side using the get_web_token method in one of our server-to-server libraries

product

string

Yes

one of the Smile ID products.

"biometric_kyc" "doc_verification
"authentication"
"basic_kyc"
"smartselfie"
"enhanced_kyc"
"enhanced_document_verification"

"e_signature"

document_ids

array

Yes (for e_signature)

a list of previously uploaded document IDs

callback_url

string

Yes

a callback URL on your API server or wherever you prefer.

environment

string

Yes

one of "sandbox" or "live"

partner_details

object

Yes

customizations for your organization. details here

partner_params

object

No

a collection of partner additional information. All its contents are sent back to the partner but in a slightly different format. The objects key name is changed to PartnerParams. It can be used to hold meta data related to the user or the job.

Additionally, if you intend to mock the sandbox results, you should include the include the sandbox_result key as string value "0", "1" or "2"

onSuccess

function

No

function to handle successful completion of the verification.

onError*

function

No

function to handle errors with verification, called when end-user consent is denied

onClose

function

No

function to handle closing of the verification process

id_selection**

object

No

a mapping of country code to a selection of supported id types e.g.

{

"NG": ["BVN_MFA", "V_NIN"]

}

consent_required ***

object

Yes, for ID Types where user consent is required.

a mapping of country code to a selection of supported id types e.g.

{

"NG": ["BVN", "NIN"]

}

document_capture_modes

array

No

a list containing camera or upload or both values if you intend to provide both options for document image acquisition.

{

"document_capture_modes":["camera","upload"]

}

if you do not provide the document_capture_modes list, the component defaults to the camera option.

allow_agent_mode

boolean

No

Whether to allow Agent Mode or not. If allowed, a button will be displayed allowing toggling between the back camera and front camera. If not allowed, only the front camera will be used. To use agent mode, the new design should be opted for by setting use_new_component: true

* - onError function can take one argument of the shape { message: <message>, data: <object with details> }

** - id_selection list is checked against those enabled for your partner account. this is limited in cases of basic_kyc, enhanced_kyc, enhanced_document_verification, and biometric_kyc.

If you pass only one country and id type in theid_selection object, the id type selection screen will not be displayed in the web integration instance

*** - consent_required list is subject to the ID Authority configuration. Some ID Authorities require end-user consent, and that requirement overrides this setting.

partner_details configuration reference
Key
Type
Required
Description
name

string

Yes

Application Name

partner_id

string

Yes

Smile ID Partner ID

policy_url

string

Yes

URL to data privacy policy

logo_url

string

Yes

URL to App Logo (best in 1:1 aspect ratio)

theme_color

string

No

a valid CSS Color Code for accent colors. When specified with the use_new_component: true, the color will be applied to header texts and buttons. Refer to theme color

Test the Integration
After configuring the integration, you can walk through an example.







Theme Color

Color theming
Please see the trouble shooting guide here for situations where the camera is not loading.
Usage
Add the component
After installation and necessary imports:

Add the desired images capture markup to your page/component:

Selfie only
ID Document only
Selfie and Document

Copy
<selfie-capture-screens></selfie-capture-screens>
For basic color theming, add the theme-color attribute to the component with a valid css hex value


Copy
<smart-camera-web theme-color="#7AAAFA"></smart-camera-web>
Selfie Capture
Initially, you'll see this instruction screen (unless this is turned off), guiding the user on best practices for good selfie capture, this will be followed by the selfie capture screen prompting the user to present their face and a review screen:


Instructions screen

Take selfie screen

Selfie review screen
To turn off the instruction screen, add the hide-instructions attribute to the component


Copy
<smart-camera-web hide-instructions></smart-camera-web>
Document Capture
If the capture-id attribute is used, you will be presented with additional screens for document capture (front, back (optional by adding hide-back-of-id attribute), review):


Document instruction screen

Document capture screen

Document review screen
Capture front of document only

Copy
<!-- Example: Capture front of document only -->
<document-capture-screens hide-back-of-id></document-capture-screens>

Copy
<!-- Example: Capture selfie and front of document only -->
<smart-camera-web capture-id hide-back-of-id></smart-camera-web>
Handle events
Handle the smart-camera-web.publish event:

When the user approves the captured image, a smart-camera-web.publish event is dispatched. The event returns a CustomEvent payload in e.detail.

Here's a script example to handle the event and send data to a backend endpoint:


Copy
<script>
  const app = document.querySelector("smart-camera-web");

  const postContent = async (data) => {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

    try {
      const response = await fetch("/", options);
      const json = await response.json();

      return json;
    } catch (e) {
      throw e;
    }
  };

  app.addEventListener("smart-camera-web.publish", async (e) => {
    try {
      const response = await postContent(e.detail);

      console.log(response);
    } catch (e) {
      console.error(e);
    }
  });
</script>
Note: when using the selfie-capture-screens listen to the selfie-capture-screens.publish event to get the selfie and liveness images.

For document-capture-screens listen to the document-capture-screens.publish event for the document image.

More details here

Process request on backend
The provided backend endpoint uses the NodeJS Server to Server library and ExpressJS:


Copy
const express = require("express");
const { v4: UUID } = require("uuid");

if (process.env.NODE_ENV === "development") {
  const dotenv = require("dotenv");

  dotenv.config();
}

const SIDCore = require("smile-identity-core");
const SIDSignature = SIDCore.Signature;
const SIDWebAPI = SIDCore.WebApi;

const app = express();

app.use(express.json({ limit: "500kb" }));
app.use(express.static("public"));

app.post("/", async (req, res, next) => {
  try {
    const { PARTNER_ID, API_KEY, SID_SERVER } = process.env;
    const connection = new SIDWebAPI(
      PARTNER_ID,
      "/callback",
      API_KEY,
      SID_SERVER,
    );

    const partner_params_from_server = {
      user_id: `user-${UUID()}`,
      job_id: `job-${UUID()}`,
      job_type: 4, // job_type is the product which enrolls a user using their selfie
    };

    const {
      images,
      partner_params: { libraryVersion },
    } = req.body;

    const options = {
      return_job_status: true,
    };

    const partner_params = Object.assign({}, partner_params_from_server, {
      libraryVersion,
    });

    const result = await connection.submit_job(
      partner_params,
      images,
      {},
      options,
    );

    res.json(result);
  } catch (e) {
    console.error(e);
  }
});

// NOTE: This can be used to process responses. don't forget to add it as a callback option in the `connection` config on L22
// https://docs.usesmileid.com/further-reading/faqs/how-do-i-setup-a-callback
app.post("/callback", (req, res, next) => {});

app.listen(process.env.PORT || 4000);
This approach can also be achieved using other Server to Server libraries.

Handling Events
Selfie and liveness images
To receive the images after they have been captured, you can listen to the custom event selfie-capture-screens.publish. The data posted to this event has the structure:


Copy
{
  "detail": {
    "images": [{ "image": "base64 image", "image_type_id": "" }],
    "meta": {
      "version": "version of the library in use"
    }
  }
}
Handling the publish event:

Copy
document
  .querySelector("selfie-capture-screens")
  .addEventListener("selfie-capture-screens.publish", function (event) {
    console.log(event.detail);
  });
Handling the cancel event

Copy
document
  .querySelector("selfie-capture-screens")
  .addEventListener("selfie-capture-screens.cancelled", function (event) {
    console.log(event.detail);
  });
Handling the back event

Copy
document
  .querySelector("selfie-capture-screens")
  .addEventListener("selfie-capture-screens.back", function (event) {
    console.log(event.detail);
  });
Document image
Capture events emit document-capture-screens.publish, providing captured images and metadata:


Copy
{
  "detail": {
    "images": [{ "image": "base64-encoded image", "image_type_id": "" }],
    "meta": {
      "version": "library version"
    }
  }
}
Handling the publish event

Copy
document
  .querySelector("document-capture-screens")
  .addEventListener("document-capture-screens.publish", function (event) {
    console.log(event.detail);
  });
Handling the cancel event

Copy
document
  .querySelector("document-capture-screens")
  .addEventListener("document-capture-screens.cancelled", function (event) {
    console.log(event.detail);
  });
Handling the back event

Copy
document
  .querySelector("document-capture-screens")
  .addEventListener("document-capture-screens.back", function (event) {
    console.log(event.detail);
  });
Compatibility
SmartCameraWeb is compatible with most JavaScript frameworks and libraries. For integration with ReactJS, refer to this tutorial due to React-WebComponents compatibility issues.

Please see the trouble shooting guide here for situations where the camera is not loading.

Support
Tested on the latest versions of Chrome, Edge, Firefox, and Safari. If compatibility issues arise on certain browsers, please notify us.



claback url 
The job result will be sent to the callback url you provided, it will look as follows:


Copy
{
  "Actions": {
    "Liveness_Check": "Passed",
    "Register_Selfie": "Approved",
    "Selfie_Provided": "Passed",
    "Verify_ID_Number": "Verified",
    "Human_Review_Compare": "Passed",
    "Return_Personal_Info": "Returned",
    "Selfie_To_ID_Card_Compare": "Not Applicable",
    "Human_Review_Update_Selfie": "Not Applicable",
    "Human_Review_Liveness_Check": "Passed",
    "Selfie_To_ID_Authority_Compare": "Completed",
    "Update_Registered_Selfie_On_File": "Not Applicable",
    "Selfie_To_Registered_Selfie_Compare": "Not Applicable"
  },
  "ConfidenceValue": "99",
  "PartnerParams": {
    "job_id": "KE_TEST_100",
    "job_type": "1",
    "user_id": "KE_TESTTEST_100"
  },
  "ResultCode": "1210",
  "ResultText": "Enroll User",
  "SmileJobID": "0000056574",
  "Source": "WebAPI",
  "timestamp": "2021-05-06T08:48:50.763Z",
  "signature": "----signature-----"
}