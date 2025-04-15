import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app-container">
      <header>
        <h1>React + Express Application</h1>
      </header>
      
      <main>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            Count is {count}
          </button>
          <p>
            Your application is now working correctly!
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
