import React from "react";
import Home from "@/pages/Home";

function App() {
  console.log("App component is rendering!");
  return (
    <div className="min-h-screen bg-gray-50">
      <Home />
    </div>
  );
}

export default App;