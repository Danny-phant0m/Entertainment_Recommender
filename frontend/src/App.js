import './App.css';
import { Routes, Route } from 'react-router-dom';
import MovieCard from './componets/MoviePoster';
import Recommendations from './componets/recommendations'; 

function App() {
  return (
      <Routes>
        <Route path="/" element={<MovieCard />} />
        <Route path="/recommendations" element={<Recommendations />} />
      </Routes>
);
}

export default App;
