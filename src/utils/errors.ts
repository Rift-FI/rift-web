export const handleError = (err: unknown): string => {
  let messageString: string;
  messageString = "";

  if (err instanceof Error) {
    messageString = err.message;
  } else if (err && typeof err == "object" && "message" in err) {
    messageString = String(err.message);
  } else if (typeof err == "string") {
    messageString = err;
  } else {
    messageString = "Something went wrong";
  }

  return messageString;
};
