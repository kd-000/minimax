import {react,useState, useEffect} from 'react'
import Tree from 'react-d3-tree';
import './css/GraphView.css';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const GraphView = () => {

    const [minValue,setMinValue] = useState(-20)
    const [maxValue,setMaxValue] = useState(20)
    const [branch,setBranch] = useState(2)
    const [depth,setDepth] = useState(2)
    const [treeData, setTreeData] = useState(
        {
            name: 2,
            attributes: {
                alpha: '',
                beta: '',
                player: "max",
            }
        }
    )

    function minimax (depth, node, isMax) {
        
    }

    const handleBranchChange = (newValue) => {
        setBranch(newValue);
    };

    const handleDepthChange = (newValue) => {
        setDepth(newValue);
    };

    const handleMinMaxChange = ([min, max]) => {
        setMinValue(min)
        setMaxValue(max)
    }

    const generateRandomData = () => {
        const generateNode = (currentDepth, currentPlayer) => {
            const node = {};
    
            if (currentDepth === depth || (currentDepth === 0 && depth === 0)) {
                //If current depth is equal to the desired depth or depth is 0, set name and player attribute
                node.name = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
            } else {
                const nextPlayer = currentPlayer === "max" ? "min" : "max"; //Alternate player attribute
                node.name= null;
                node.children = Array.from({ length: branch }, () => generateNode(currentDepth + 1, nextPlayer));
                node.attributes = {
                    alpha: '',
                    beta: '',
                    player: currentPlayer, 
                };
            }
    
            return node;
        };
    
        return generateNode(0, "max"); 
    };

    const Minimax = (node, maximising) => {
        if (!node.children || node.children.length === 0) {
            //If node is a leaf node, calculate and store Minimax value
            node.name = node.name;
            return node.name;
        }
    
        if (maximising) {
            let maxValue = -101 ;
            for (let child of node.children) {
                const value = Minimax(child, false);
                maxValue = Math.max(maxValue, value);
            }
            node.name = maxValue;
            return maxValue;
        } else {
            let minValue = 101;
            for (let child of node.children) {
                const value = Minimax(child, true);
                minValue = Math.min(minValue, value);
            }
            node.name = minValue;
            return minValue;
        }
    };
    
    const AlphaBetaPrune = (node, alpha, beta, maximising) => {
        if (!node.children || node.children.length === 0) {
            //If node is a leaf node, calculate and store the value
            node.name = node.name;
            return node.name;
        }
    
        if (maximising) {
            let maxValue = Number.NEGATIVE_INFINITY;
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                const value = AlphaBetaPrune(child, alpha, beta, false);
                maxValue = Math.max(maxValue, value);
                alpha = Math.max(alpha, value); //Update alpha value
                if (beta <= alpha) {
                    //Prune the remaining nodes
                    for (let j = i + 1; j < node.children.length; j++) {
                        node.children[j].pruned = true; //Mark pruned nodes
                    }
                    break;
                }
            }
            node.name = maxValue;
            node.attributes.alpha = alpha; // pdate alpha value for the node
            node.attributes.beta = beta; //Update beta value for the node
            return maxValue;
        } else {
            let minValue = Number.POSITIVE_INFINITY;
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                const value = AlphaBetaPrune(child, alpha, beta, true);
                minValue = Math.min(minValue, value);
                beta = Math.min(beta, value); //Update beta value
                if (beta <= alpha) {
                    //Prune the remaining nodes
                    for (let j = i + 1; j < node.children.length; j++) {
                        node.children[j].pruned = true; //Mark pruned nodes
                    }
                    break;
                }
            }
            node.name = minValue;
            node.attributes.alpha = alpha; //Update alpha value for the node
            node.attributes.beta = beta; //Update beta value for the node
            return minValue;
        }
    };
    
    
    


    const regenerateTree = () => {
        setTreeData(generateRandomData());
    }

    const handleMinimax = () => {
        const clonedTreeData = JSON.parse(JSON.stringify(treeData));
        Minimax(clonedTreeData, true); 
        setTreeData(clonedTreeData);
    }

    const handleAlphaBeta = () => {
        const clonedTreeData = JSON.parse(JSON.stringify(treeData)); 
        AlphaBetaPrune(clonedTreeData, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, true); 
        setTreeData(clonedTreeData);
    }

    useEffect(() => {
        regenerateTree();
    }, [minValue, maxValue, branch, depth])

    useEffect(() => {
        regenerateTree(-20,20,2,3);
    }, []);

    return (
        <div className="outer-wrapper">
            
            <div className="inner-buttons">
            <div className="options-header">
                    Options
                </div>
                
                <div className='attributes'>
                    <div className='slider-option'>
                        Branch
                        <div className="slider-values">
                        <Slider
                            value={branch}
                            onChange={handleBranchChange}
                            min={1}
                            max={4}
                            step={1}
                            className="custom-slider"
                        />
                        <div className="slider-value">
                            {branch}
                        </div>
                        </div>
                    </div>
                    <div className='slider-option'>
                        Depth
                        <div className="slider-values">
                        <Slider
                            value={depth}
                            onChange={handleDepthChange}
                            min={0}
                            max={4}
                            step={1}
                            className="custom-slider"
                        />
                            <div className="slider-value">
                            {depth}
                        </div>
                        </div>
                    </div>
                    <div className='slider-option'>
                        Min & Max Value
                        <div className="slider-values">
                            <Slider
                                range
                                pushable
                                value={[minValue,maxValue]}
                                onChange={handleMinMaxChange}
                                min={-100}
                                max={100}
                                step={1}
                                className="custom-slider"
                            />
                            <div className="slider-value">
                                [{minValue},{maxValue}] 
                            </div>
                        </div>
                    </div>
                </div>
                <div className='buttons'>
                    <button className="graph-buttons" onClick={regenerateTree}>Regenerate Tree</button> 
                    <button className="graph-buttons" onClick={handleMinimax}>Minimax</button>
                    <button className="graph-buttons" onClick={handleAlphaBeta}>Alpha Beta Pruning</button>
                </div>

            </div>

            <div className="wrapper-tree" style={{height: '80vh', width: '80%'}}>
                <Tree data={treeData} 
                orientation="vertical"
                rootNodeClassName="node__root"
                branchNodeClassName="node__branch"
                leafNodeClassName="node__leaf"
                pathFunc="straight"
                onNodeClick
                />
            </div>    
        </div>

    )    
}


export default GraphView;

