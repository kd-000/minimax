import {react,useState, useEffect} from 'react'
import Tree from 'react-d3-tree';
import '../css/GraphView.css';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const GraphView = () => {

    // <Tree>
    const intialStart = {x: 750, y:100};
    const scale = {min: 0.5, max: 2}
    const separation = {siblings: 1.25, nonSiblings: 1.5}
    const [treeData, setTreeData] = useState(
        {
            id: 0,
            name: 2,
            pruned: false,
            isClicked :false,
            depth: 0,
            attributes: {
                alpha: '',
                beta: '',
                player: "Max",
            }
        }
    )

    // Foreign
    const nodeSize = {x: 110, y:120};
    const foreignObjectProps = {width: nodeSize.x, height: nodeSize.y, x:20, y: -10};
    
    // Flag for text bos
    const [isPruned, setIsPruned] = useState(false)


    // Options Variables
    const [minValue,setMinValue] = useState(-20)
    const [maxValue,setMaxValue] = useState(20)
    const [branch,setBranch] = useState(2)
    const [depth,setDepth] = useState(2)

    // Handles for Option variables
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

    const generateRandomId = () => {
        // Function to generate a random string as a ID
        return Math.random().toString(36).substr(2, 9); // 9 characters long
    };

    // Tracker of usedIds so there's no duplicate
    const [usedIds, setUsedIds] = useState([]);

    // Generate unique ID
    const generateId = () => {
        let id;
        do {
            id = generateRandomId();
        } while (usedIds.includes(id)); // Finds a unique ID
        setUsedIds([...usedIds, id]); 
        return id;
    };


    const generateRandomData = () => {
        const generateNode = (currentDepth, currentPlayer) => {

            // Generate New Node
            const node = {};
            node.id = generateId();
            node.isClicked = false;
            node.pruned = false;
            node.depth = currentDepth;

            // If a Leaf Node add a value
            if (currentDepth === depth || (currentDepth === 0 && depth === 0)) {
                node.name = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
            } else { //Otherwise add children and repeat
                const nextPlayer = currentPlayer === "Max" ? "Min" : "Max"; //Alternate player attribute
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
    
        return generateNode(0, "Max"); // Trigger
    };

    // Button trigger
    const regenerateTree = () => {
        setTreeData(generateRandomData());
    }

    // Sets all alpha/beta attributes to null in a tree
    const updateAlphaBetaAttributes = (node) => {
        if (node.attributes) {
            node.attributes.alpha = null;
            node.attributes.beta = null;
        }
    
        // If the current node has children, trigger function for them
        if (node.children) {
            node.children.forEach(child => updateAlphaBetaAttributes(child));
        }
    };
    

    const Minimax = (node, maximising) => {
        // If a Leaf Node return the value
        if (!node.children || node.children.length === 0) { 
            return node.name;
        }
        
        if (maximising) {
            let maxValue = -101;
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

    const Negamax = (node, maximising) => {
        // If a Leaf Node return the value
        if (!node.children || node.children.length === 0) { 
            return node.name;
        }
        
        if (maximising) {
            let maxValue = -101;
            for (let child of node.children) {
                const value = -Negamax(child, false);
                maxValue = Math.max(maxValue, value);
            }
            node.name = maxValue;
            return maxValue;
        } else {
            let minValue = 101;
            for (let child of node.children) {
                const value = -Negamax(child, true);
                minValue = Math.min(minValue, value);
            }
            node.name = minValue;
            return minValue;
        }

    }

    // Clean tree of values apart from leaf nodes
    const cleanNodeNames = (node) => {
        // If leaf node do nothing
        if (!node.children || node.children.length === 0) {
            return;
        } else {
            // If not, clean names & trigger function for children
            node.name = null;
            node.children.forEach(child => cleanNodeNames(child));
        }
    };
    
    const AlphaBetaPrune = (node, alpha, beta, maximising) => {
        // If leaf node return
        if (!node.children || node.children.length === 0) {
            return node.name;
        }
    
        if (maximising) {
            let maxValue = Number.NEGATIVE_INFINITY;

            // For each child, trigger function
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                const value = AlphaBetaPrune(child, alpha, beta, false);
                maxValue = Math.max(maxValue, value);
                alpha = Math.max(alpha, value); // Update alpha value

                // Prune the remaining nodes
                if (beta <= alpha) {
                    for (let j = i + 1; j < node.children.length; j++) {
                        setIsPruned(true) // Trigger text div
                        markPruned(node.children[j]); // Mark node and below as pruned
                    }
                    
                    break;
                }
            }
            node.name = maxValue;
            node.attributes.alpha = alpha; // Update alpha value for the node
            node.attributes.beta = beta; // Update beta value for the node
            return maxValue;
        } else {
            let minValue = Number.POSITIVE_INFINITY;

            // For each child, trigger function
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                const value = AlphaBetaPrune(child, alpha, beta, true);
                minValue = Math.min(minValue, value);
                beta = Math.min(beta, value); //Update beta value

                //Prune the remaining nodes
                if (beta <= alpha) {
                    for (let j = i + 1; j < node.children.length; j++) {
                        setIsPruned(true) // Trigger text div
                        markPruned(node.children[j]); // Mark node and below as pruned
                    }                    
                    break;
                }
            }
            node.name = minValue;
            node.attributes.alpha = alpha; // Update alpha value for the node
            node.attributes.beta = beta; // Update beta value for the node
            return minValue;
        }
    };
    
    // Mark node and all children below as prunes
    const markPruned = (node) => {
        node.pruned = true; 
        
        // Stop if leaf
        if (!node.children || node.children.length === 0) {
            return; 
        }

        // Triggers function on children
        node.children.forEach(child => markPruned(child));
    };



    const regenerateValues = () => {
        setIsPruned(false) // Reset text div

        const updateNodeValues = (node) => {
            
             // If leaf, redo value
            if (!node.children || node.children.length === 0) {
                node.name = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
                node.pruned = false;
            } else {
                // If node has children, trigger function
                node.name = null;
                node.pruned = false;
                node.attributes.alpha = null;
                node.attributes.beta = null;
                node.children.forEach(child => updateNodeValues(child));
            }
        };
    
        const updatedTreeData = JSON.parse(JSON.stringify(treeData));
        updateNodeValues(updatedTreeData);
        resetIsClicked(updatedTreeData);
        setTreeData(updatedTreeData);
    };
    
    // Button trigger
    const handleMinimax = () => {
        setIsPruned(false)
        const clonedTreeData = JSON.parse(JSON.stringify(treeData));
        Minimax(clonedTreeData, true); 
        updateAlphaBetaAttributes(clonedTreeData);
        resetPrunedNodes(clonedTreeData)
        resetIsClicked(clonedTreeData);
        setTreeData(clonedTreeData);
    }

        // Button trigger
        const handleNegamax = () => {
            setIsPruned(false)
            const clonedTreeData = JSON.parse(JSON.stringify(treeData));
            Negamax(clonedTreeData, true); 
            updateAlphaBetaAttributes(clonedTreeData);
            resetPrunedNodes(clonedTreeData)
            resetIsClicked(clonedTreeData);
            setTreeData(clonedTreeData);
        }

    // Button trigger
    const handleAlphaBeta = () => {
        setIsPruned(false)
        const clonedTreeData = JSON.parse(JSON.stringify(treeData)); 
        cleanNodeNames(clonedTreeData)
        AlphaBetaPrune(clonedTreeData, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, true); 
        setTreeData(clonedTreeData);
        resetIsClicked(clonedTreeData);
    }

    // Initial tree when starting up
    useEffect(() => {
        regenerateTree();
    }, [minValue, maxValue, branch, depth])

    // Editing a node
    const handleNodeValueChange = (event, nodeId) => {
        let newValue = parseInt(event.target.value);
        if (!isNaN(newValue)) {
            // Checks value is within bounds
            if (newValue > 100) {
                newValue = 100;
            } else if (newValue < -100) {
                newValue = -100;
            }
            const updatedTreeData = JSON.parse(JSON.stringify(treeData));

                // Find the node with the given ID and update its name attribute
                const updateNodeValue = (node) => {
                    if (node.id === nodeId) {
                        node.name = newValue;
                    }
                    if (node.children) {
                        node.name = null;
                        node.attributes.alpha = '';
                        node.attributes.beta = '';
                        node.children.forEach(child => updateNodeValue(child));
                    }
                };

                updateNodeValue(updatedTreeData);            
                resetPrunedNodes(updatedTreeData)
                setTreeData(updatedTreeData);
                
                return updatedTreeData;
        } else {
            // Handle invalid input (non-integer)
            console.error("Invalid input: Please enter an integer value.");
        }
    };

    const renderForeignObjectNode = ({nodeDatum, toggleNode, foreignObjectProps}) => (
        <g>
            <circle
                r={15}
                className={nodeDatum.pruned ? "node__pruned" : nodeDatum.depth % 2 == 0 ? "node__notpruned_max" : "node__notpruned_min"}
                onClick={() => handleNodeClick(nodeDatum.id)}
            ></circle>
            <foreignObject {...foreignObjectProps}>
                <div
                    style={{
                        backgroundColor: nodeDatum.name !== null && nodeDatum.attributes ? " #d7dbdd" : "transparent",
                        paddingTop: nodeDatum.name !== null && nodeDatum.attributes ? "8px " : "0px",
                        paddingRight: nodeDatum.name !== null && nodeDatum.attributes ? "8px " : "0px",
                        paddingBottom: nodeDatum.name !== null && nodeDatum.attributes ? "8px " : "0px",
                        width: nodeDatum.name !== null && nodeDatum.attributes && !nodeDatum.attributes.alpha ? "fit-content " : "unset",
                        paddingLeft: nodeDatum.name !== null && nodeDatum.attributes ? "8px" : "unset",
                        border: nodeDatum.name !== null && nodeDatum.attributes ? "2px white solid" : "0px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-start",
                        flexDirection: "column"
                    }}>
                    {!nodeDatum.children ? 
                        <input
                            type="number"
                            value={nodeDatum.name !== null ? nodeDatum.name : ''}
                            onChange={(event) => handleNodeValueChange(event, nodeDatum.id)}
                            className="input-style"
                            min="-100" max="100"/> : 
                        <h3 style={{width: '100%', textAlign: "left", margin: '0px' }}> {nodeDatum.name} <div style={{fontStyle: 'italic', fontSize: "calc(100% - 2px)"}}>{!nodeDatum.isClicked && nodeDatum.attributes && nodeDatum.attributes.player !== '' ? nodeDatum.attributes.player : null}</div>
                        </h3>}
                    
                    
                    {!nodeDatum.isClicked && ( <p style={{textAlign: "left", margin: '0px', marginLeft: '3px', fontSize: '15px', fontWeight: '600', color: '#555', height: nodeDatum.name !== null && (!nodeDatum.attributes || (nodeDatum.attributes && !nodeDatum.attributes.alpha)) ? "0px " : "unset",}}>
                        {nodeDatum.attributes && nodeDatum.attributes.alpha !== null && nodeDatum.attributes.alpha !== '' ? `α : ${nodeDatum.attributes.alpha}` : ''}<br/>
                        {nodeDatum.attributes && nodeDatum.attributes.alpha !== null && nodeDatum.attributes.beta !== '' ? `β : ${nodeDatum.attributes.beta}` : ''}
                    </p>)}
                    {/* Conditionally render buttons when the node is clicked */}
                    {nodeDatum.isClicked && (
                        <div>
                            <button className="in-node-buttons" onClick={() => handleAddChild(nodeDatum.id)}>Add</button>
                            <button className="in-node-buttons" onClick={() => handleDeleteNodeAndChildren(nodeDatum.id)}>Delete</button>
                        </div>
                    )}
                </div>
            </foreignObject>
        </g>
    );
    
    const handleNodeClick = (nodeId) => {
        setTreeData(prevTreeData => {
            const updatedTreeData = { ...prevTreeData };
            
            // Reset isClicked attribute for all nodes
            resetIsClicked(updatedTreeData);
    
            // Find the node with the given ID and set its isClicked attribute
            const toggleClicked = (node) => {
                if (node.id === nodeId) {
                    node.isClicked = true;
                }
                if (node.children) {
                    node.children.forEach(child => toggleClicked(child));
                }
            };
            toggleClicked(updatedTreeData);
            
            return updatedTreeData;
        });
    };

    // Reset isClicked attribute for all nodes
    const resetIsClicked = (node) => {
        node.isClicked = false;
        if (node.children) {
            node.children.forEach(child => resetIsClicked(child));
        }
    };    
    
    // Reset pruned attribute for all nodes
    const resetPrunedNodes = (node) => {
        node.pruned = false;
        if (node.children) {
            node.children.forEach(child => resetPrunedNodes(child));
        }
    };
    
    

    const handleAddChild = (parentId) => {
        const updatedTreeData = JSON.parse(JSON.stringify(treeData));
    
        // Find the parent node
        const findParentNode = (node) => {
            if (node.id === parentId) {
                return node;
            } else if (node.children) {
                for (let child of node.children) {
                    const foundNode = findParentNode(child);
                    if (foundNode) return foundNode;
                }
            }
            return null;
        };
        
        const parentNode = findParentNode(updatedTreeData);
    
        if (parentNode) {
            const randomValue = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
            const depth = parentNode.depth + 1;
            const childNode = {
                id: generateId(),
                name: randomValue,
                isClicked: false,
                pruned: false,
                depth: depth,
            };
            parentNode.name = null;
            parentNode.attributes = {};
            parentNode.attributes.alpha= '';
            parentNode.attributes.beta= '';
            parentNode.attributes.player = (parentNode.depth % 2 === 0) ? 'Max' : 'Min';
            parentNode.children = parentNode.children ? [...parentNode.children, childNode] : [childNode];
            
            // Update the treeData
            resetPrunedNodes(updatedTreeData)
            resetIsClicked(updatedTreeData);
            setTreeData(updatedTreeData);
        } else {
            console.error("Parent node not found");
        }
    };

    const handleDeleteNodeAndChildren = (childId) => {
        const updatedTreeData = JSON.parse(JSON.stringify(treeData));
        // Find the parent node
        const findParentNodeByChildId = (childId, node) => {
            if (node.children) {
                for (let child of node.children) {
                    if (child.id === childId) {
                        return node;
                    }
                    const parentNode = findParentNodeByChildId(childId, child);
                    if (parentNode) {
                        return parentNode;
                    }
                }
            }
            return null;
        };

        resetPrunedNodes(updatedTreeData)

        const parentNode = findParentNodeByChildId(childId, updatedTreeData);

        // Add children to parent's children
        if (parentNode || parentNode.children) {
            const childIndex = parentNode.children.findIndex(child => child.id === childId);
            if (childIndex !== -1) {
                parentNode.children.splice(childIndex, 1);
            }
        }
        if(parentNode.children.length == 0) {
            parentNode.children = null;
            parentNode.name = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
            parentNode.attributes = null;
        }
        resetIsClicked(updatedTreeData);
        setTreeData(updatedTreeData);
    }
    
    // Updating css for attribute pruned flag
    const getDynamicPathClass = ({source, target}) => {
    if (target && target.data && target.data.pruned) {
        return "pruned-path";
    } else {
        return "normal-path";
    }
    };

    return (
        <div className="outer-wrapper">
            
            <div className="inner-buttons">
                <div className='attributes'>
                <div className="options-header">
                    Options
                </div>
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
                    <div className='buttons'>
                        <button className="graph-buttons" onClick={regenerateTree}>Regenerate Tree</button> 
                    </div>
                </div>
                <div className='attributes'>
                    <div className='buttons'>
                        <button className="graph-buttons" onClick={regenerateValues}>Regenerate Values</button> 
                        <button className="graph-buttons" onClick={handleMinimax}>Minimax</button>
                        <button className="graph-buttons" onClick={handleNegamax}>Negamax</button>
                        <button className="graph-buttons" onClick={handleAlphaBeta}>Alpha Beta Pruning</button>
                    </div>
                </div>
                {/* {isPruned && <div style={{paddingLeft:'20px', paddingRight:'20px', paddingBottom:'20px', paddingTop:'0px !important', fontSize:'20px'}}>Your tree has had nodes pruned!</div>}  */}

            </div>

            <div className="wrapper-tree" style={{height: 'unset', width: '80%'}}>
                <Tree data={treeData} 
                orientation="vertical"
                translate= {intialStart}
                rootNodeClassName="node__root"
                branchNodeClassName="node__branch"
                leafNodeClassName="node__leaf"
                pathFunc="straight"
                scaleExtent={scale}
                separation = {separation}
                draggable
                onNodeClick
                pathClassFunc={getDynamicPathClass}
                renderCustomNodeElement={(rd3tProps) =>
                    renderForeignObjectNode({ ...rd3tProps, foreignObjectProps})
                }
                />
            </div>    
        </div>

    )    
}


export default GraphView;

