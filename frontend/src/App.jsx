import React, { useState } from "react";

function App() {
  const [data, setData] = useState("");
  
  const handleInputChange = (e) => {
    setData(e.target.value);
  };

  return (
    <div>
      <h1>Action Recognition System</h1>
      <input
        type="text"
        value={data}
        onChange={handleInputChange}
        placeholder="Enter some data"
      />
      <button onClick={() => console.log(data)}>Submit</button>
    </div>
  );
}

export default App;
