import Sphere, { Environment } from "@stratosphere-network/wallet";


const sphere = new Sphere({
    environment: Environment.DEVELOPMENT,
    apiKey: "sk_0f59befbbc1083d0b85944ca761335f9602cfcffad01e2f498508b8f17485418" // TODO: move to env file
})
// TODO: remove; This is just for testing
// sphere.setBearerToken("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiOTgzNzI3YzEtYjBjMy00Yjc2LTlhZGMtZWJmODU3YzkyYjMzIiwidXNlcm5hbWUiOiJkZW1vQGdsb2JhbGxpbmtwbHVzLmNvbSIsImV4cCI6MTcxNTc5NjQwMCwiZW1haWwiOiJkZW1vQGdsb2JhbGxpbmtwbHVzLmNvbSIsIm9yaWdfaWF0IjoxNzE1NzYwNDAwfQ.wURRN60-eAUariMmyIh-R1WQ41n-M349TTly-FB5z6o")
export default sphere