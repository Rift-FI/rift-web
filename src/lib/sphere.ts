import Sphere, { Environment } from "@stratosphere-network/wallet";

const sphere = new Sphere({
  environment: Environment.DEVELOPMENT,
  apiKey: "sk_0649f261327a11b68374d6d6b15bbfb0eb039e505d93b6db85f91678eaa374fd",
  timeout: 30000,
});

export default sphere;
