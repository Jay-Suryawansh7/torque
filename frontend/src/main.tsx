import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ClerkProvider>
  </StrictMode>
);
