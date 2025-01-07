import { BASEURL, ENDPOINTS } from "./config";

export const createReferralLink = async (): Promise<string | void> => {
  try {
   
    const response = await fetch(`${BASEURL}${ENDPOINTS.createReferralLink}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`, 
      },
    });

   
    if (response.ok) {
      const referralLink = await response.json();
      return referralLink; 
    } else if (response.status === 401) {
      throw new Error("Unauthorized. Please log in again.");
    } else {
      throw new Error("Failed to create referral link.");
    }
  } catch (error) {
    console.error("Error creating referral link:", error);
  }
};


export const earnFromReferral = async (code: string): Promise<string | void> => {
  try {
   
    const response = await fetch(`${BASEURL}${ENDPOINTS.incentivize}?code=${code}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`, 
      },
    });

    
    if (response.ok) {
      const data = await response.json();
      return data.message; 
    } else if (response.status === 401) {
      throw new Error("Unauthorized. Please log in again.");
    } else if (response.status === 400) {
      const errorMessage = await response.text();
      throw new Error(errorMessage); 
    } else {
      throw new Error("Failed to process referral earnings.");
    }
  } catch (error) {
    console.error("Error earning from referral:", error);
  }
};