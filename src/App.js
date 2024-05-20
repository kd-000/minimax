import './css/App.css';
import GraphView from './components/GraphView';
import Banner from './components/banner'
import BackButton from './components/backButton';
import {react,useState, useEffect} from 'react'

function App() {
  const [windowHeight, setWindowHeight] = useState(window.innerHeight - 50);

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight - 50);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
      <div className="outer-display" style={{ height: windowHeight }}>
      <BackButton></BackButton>
      <header className="title-header">
        Minimax & Alpha Beta Pruning
      </header>
      <div className="bio">
        A view to see Minimax and  Alpha-Beta Pruning
      </div>
      <div className="graph">
        <GraphView></GraphView>
      </div>
      <Banner></Banner>
      </div>
  );
}

export default App;
