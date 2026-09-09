// frontend/src/utils/loadRazorpay.js

const RAZORPAY_SCRIPT_URL =
  "https://checkout.razorpay.com/v1/checkout.js";

/**
 * Dynamically loads the Razorpay Checkout script.
 *
 * Returns:
 *   true  -> Razorpay SDK loaded successfully
 *   false -> SDK failed to load
 */
export const loadRazorpay = () => {
  return new Promise((resolve) => {
    // Already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if the script is already being loaded
    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        resolve(true);
      });

      existingScript.addEventListener("error", () => {
        resolve(false);
      });

      return;
    }

    // Create Razorpay script
    const script = document.createElement("script");

    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout SDK.");
      resolve(false);
    };

    document.body.appendChild(script);
  });
};