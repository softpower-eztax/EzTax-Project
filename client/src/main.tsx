import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { TaxProvider } from "./context/TaxContext";

createRoot(document.getElementById("root")!).render(
  <TaxProvider>
    <App />
  </TaxProvider>
);
