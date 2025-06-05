import Sphere, { Environment } from "@stratosphere-network/wallet";

const sphere = new Sphere({
  environment: Environment.DEVELOPMENT,
  apiKey: "sk_4b7b5b5dd8025ec94c1ab4eb79edfd13b41e9d5f6c8504200e0267f4d316a2c3",
  timeout: 30000, // TODO: move to env file
});
// TODO: remove; This is just for testing
sphere.setBearerToken(
  "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODU5N2QxYy1mYzc4LTRhYjAtODYzNC03YzU5OGFiZDZjZTUiLCJlbWFpbCI6Ijc3ODQ4NjMxMTQ4ODg5MDAwIiwiYWRkcmVzcyI6IjB4ZUIwY2ExZUE5YWZjMTk3OWU0YzE1OUQ2Q0ZlNDBCYmUxMWJBMWQwQSIsImJ0Y0FkZHJlc3MiOiJkdW1teWJ0Y2FkZHJlc3MxMjM0NTY3ODkiLCJpYXQiOjE3NDg5MzgzMzZ9.suGG1LELK-rowY_FOH6F9nibBEGbZ_tVo71-LAWJ5qhaGFg2u0yLE7l3gGIA9q-p1pYGvF5slbuw7Ca6yFQnQg"
);

export default sphere;
