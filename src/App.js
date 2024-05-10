import './css/App.css';
import GraphView from './GraphView';

function App() {
  return (
    <div className="outer-display">
      <header className="title-header">
        Minimax & Alpha Beta Pruning
      </header>
      <div className="bio">
        A view to see Minimax and  Alpha-Beta Pruning
      </div>
      <div className="graph">
        <GraphView></GraphView>
      </div>
    </div>
  );
}

export default App;
