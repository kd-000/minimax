import {react,useState, useEffect} from 'react'
import Tree from 'react-d3-tree';
import '../css/GraphView.css';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const GraphView = () => {

    const [minValue,setMinValue] = useState(-20)
    const [maxValue,setMaxValue] = useState(20)
    const [branch,setBranch] = useState(2)
    const nodeSize = {x: 110, y:120};
    const [usedIds, setUsedIds] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const foreignObjectProps = { width: nodeSize.x, height: nodeSize.y, x:20, y: -10 };
    const [depth,setDepth] = useState(2)
    const [isPruned, setIsPruned] = useState(false)
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
                player: "max",
            }
        }
    )

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
        // Function to generate a random string of characters as ID
        return Math.random().toString(36).substr(2, 9); // 9 characters long
    };

    const generateId = () => {
        // Generate unique ID for each node
        let id;
        do {
            id = generateRandomId();
        } while (usedIds.includes(id));
        setUsedIds([...usedIds, id]);
        return id;
    };

    const generateRandomData = () => {
        const generateNode = (currentDepth, currentPlayer) => {
            const node = {};
            node.id = generateId();
            node.isClicked = false;
            node.pruned = false;
            node.depth = currentDepth;
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

    const updateAlphaBetaAttributes = (node) => {
        // Set alpha and beta attributes to an empty string
        if (node.attributes) {
            node.attributes.alpha = null;
            node.attributes.beta = null;
        }
    
        // If the current node has children, recursively update their attributes
        if (node.children) {
            node.children.forEach(child => updateAlphaBetaAttributes(child));
        }
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

    const cleanNodeNames = (node) => {
        // If the node is a leaf node, set its name to null
        if (!node.children || node.children.length === 0) {
            return;
        } else {
            // If the node has children, recursively traverse the children and update their names
            node.name = null;
            node.children.forEach(child => cleanNodeNames(child));
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
                        setIsPruned(true)
                        markPruned(node.children[j]); // Mark each remaining node as pruned
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
                        setIsPruned(true)
                        markPruned(node.children[j]); // Mark each remaining node as pruned
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
    
    
    const markPruned = (node) => {
        node.pruned = true; // Mark current node as pruned
        // Recursively mark all descendant nodes as pruned
        if (!node.children || node.children.length === 0) {
            return; // If node is a leaf, no need to mark children
        }
        node.children.forEach(child => markPruned(child));
    };


    const regenerateTree = () => {
        setTreeData(generateRandomData());
    }

    const regenerateValues = () => {
        // Function to recursively update the values of nodes in the tree
        const updateNodeValues = (node) => {
            if (!node.children || node.children.length === 0) {
                // If node is a leaf node, generate a random value within the specified range
                node.name = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
                node.pruned = false;
            } else {
                // If node has children, recursively update their values
                node.name = null;
                node.pruned = false;
                node.attributes.alpha = null;
                node.attributes.beta = null;
                node.children.forEach(child => updateNodeValues(child));
            }
        };
    
        // Clone the tree data
        const updatedTreeData = JSON.parse(JSON.stringify(treeData));
        // Update the values of nodes
        updateNodeValues(updatedTreeData);
        // Set the state with the updated tree data
        resetIsClicked(updatedTreeData);
        setTreeData(updatedTreeData);
    };
    

    const handleMinimax = () => {
        setIsPruned(false)
        const clonedTreeData = JSON.parse(JSON.stringify(treeData));
        Minimax(clonedTreeData, true); 
        updateAlphaBetaAttributes(clonedTreeData);
        resetPrunedNodes(clonedTreeData)
        resetIsClicked(clonedTreeData);
        setTreeData(clonedTreeData);
    }

    const handleAlphaBeta = () => {
        setIsPruned(false)
        const clonedTreeData = JSON.parse(JSON.stringify(treeData)); 
        cleanNodeNames(clonedTreeData)
        AlphaBetaPrune(clonedTreeData, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, true); 
        setTreeData(clonedTreeData);
        resetIsClicked(clonedTreeData);
    }

    useEffect(() => {
        regenerateTree();
    }, [minValue, maxValue, branch, depth])

    useEffect(() => {
        regenerateTree(-20,20,2,3);
    }, []);

    const handleNodeValueChange = (event, nodeId) => {
        let newValue = parseInt(event.target.value); // Convert input value to integer
        if (!isNaN(newValue)) { // Check if the input is a valid integer
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
            // You can add further logic here, such as displaying an error message to the user
        }
    };

    const renderForeignObjectNode = ({nodeDatum, toggleNode, foreignObjectProps}) => (
        <g>
            <circle
                r={15}
                className={nodeDatum.pruned ? "node__pruned" : "node__notpruned"}
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
            const resetIsClicked = (node) => {
                node.isClicked = false;
                if (node.children) {
                    node.children.forEach(child => resetIsClicked(child));
                }
            };
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

    const resetIsClicked = (node) => {
        // Set the isClicked attribute of the current node to false
        node.isClicked = false;
    
        // If the current node has children, recursively call resetIsClicked on each child
        if (node.children) {
            node.children.forEach(child => resetIsClicked(child));
        }
    };    
    
    const resetPrunedNodes = (node) => {
        // Set the pruned property of the current node to false
        node.pruned = false;
    
        // If the current node has children, recursively call resetPrunedNodes on each child
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
            parentNode.name = null; // Set parent node's name to null
            parentNode.attributes = {};
            parentNode.attributes.alpha= '';
            parentNode.attributes.beta= '';
            parentNode.attributes.player = (depth % 2 === 0) ? 'max' : 'min';
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
            // If the current node has children, check if any of its children match the childId
            if (node.children) {
                for (let child of node.children) {
                    // If the child's ID matches, return the current node as its parent
                    if (child.id === childId) {
                        return node;
                    }
                    // Recursively search for the child node in the current node's children
                    const parentNode = findParentNodeByChildId(childId, child);
                    // If the parent node is found, return it
                    if (parentNode) {
                        console.log(updatedTreeData)
                        return parentNode;
                    }
                }
            }
            // If the child node is not found in the current subtree, return null
            return null;
        };
        resetPrunedNodes(updatedTreeData)
        const parentNode = findParentNodeByChildId(childId, updatedTreeData);
        console.log(parentNode)

        if (parentNode || parentNode.children) {
            // Find the index of the child node with the given ID
            const childIndex = parentNode.children.findIndex(child => child.id === childId);
            // If the child node with the given ID is found, remove it from the children array
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
    

      
    const getDynamicPathClass = ({source, target}) => {
    if (target && target.data && target.data.pruned) {
        return "pruned-path"; // If the target node is pruned, return the class for pruned paths
    } else {
        return "normal-path"; // Otherwise, return the class for normal paths
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
                        <button className="graph-buttons" onClick={handleAlphaBeta}>Alpha Beta Pruning</button>
                    </div>
                </div>
                {isPruned && <div style={{paddingLeft:'20px', paddingRight:'20px', paddingBottom:'20px', paddingTop:'0px !important', fontSize:'20px'}}>Your tree has had nodes pruned!</div>} 

            </div>

            <div className="wrapper-tree" style={{height: '80vh', width: '80%'}}>
                <Tree data={treeData} 
                orientation="vertical"
                rootNodeClassName="node__root"
                branchNodeClassName="node__branch"
                leafNodeClassName="node__leaf"
                pathFunc="straight"
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

