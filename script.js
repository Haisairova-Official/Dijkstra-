// 图数据结构
const graph = {
    nodes: [],
    edges: []
};

// 算法状态
let algorithmState = {
    isRunning: false,
    currentStep: 0,
    visited: new Set(),
    distances: {},
    previous: {},
    unvisited: new Set(),
    currentNode: null,
    startNode: null
};

// 操作模式
let mode = 'none'; // 'addNode', 'addEdge', 'none'
let selectedNodes = [];

// 获取DOM元素
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const addNodeBtn = document.getElementById('addNodeBtn');
const addEdgeBtn = document.getElementById('addEdgeBtn');
const runAlgorithmBtn = document.getElementById('runAlgorithmBtn');
const resetBtn = document.getElementById('resetBtn');
const startNodeSelect = document.getElementById('startNode');
const edgeWeightInput = document.getElementById('edgeWeight');

// 设置画布尺寸
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    drawGraph();
}

// 初始化
window.addEventListener('load', () => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
});

// 节点类
class Node {
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.radius = 25;
    }
    
    draw(ctx, state = 'unvisited') {
        let color;
        switch(state) {
            case 'start': color = '#00ff00'; break;
            case 'visited': color = '#ffcc00'; break;
            case 'current': color = '#ff6b6b'; break;
            default: color = '#4a90e2';
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.id.toString(), this.x, this.y);

        if (state === 'start') {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    isPointInside(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= this.radius;
    }
}

// 边类
class Edge {
    constructor(node1, node2, weight) {
        this.node1 = node1;
        this.node2 = node2;
        this.weight = weight;
    }
    
    draw(ctx) {
        const dx = this.node2.x - this.node1.x;
        const dy = this.node2.y - this.node1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / length;
        const uy = dy / length;
        
        const startX = this.node1.x + ux * this.node1.radius;
        const startY = this.node1.y + uy * this.node1.radius;
        const endX = this.node2.x - ux * this.node2.radius;
        const endY = this.node2.y - uy * this.node2.radius;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const arrow = 10;
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrow * Math.cos(angle - Math.PI / 6), endY - arrow * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrow * Math.cos(angle + Math.PI / 6), endY - arrow * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
        
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.weight.toString(), midX, midY - 10);
    }
}

// 绘制图
function drawGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    graph.edges.forEach(edge => edge.draw(ctx));

    graph.nodes.forEach(node => {
        let state = 'unvisited';
        if (algorithmState.isRunning) {
            if (node.id === algorithmState.startNode) state = 'start';
            else if (node.id === algorithmState.currentNode) state = 'current';
            else if (algorithmState.visited.has(node.id)) state = 'visited';
        }
        node.draw(ctx, state);
    });
}

// 添加节点
function addNode(x, y) {
    const id = graph.nodes.length > 0 ? Math.max(...graph.nodes.map(n => n.id)) + 1 : 0;
    graph.nodes.push(new Node(x, y, id));
    updateStartNodeSelect();
    drawGraph();
}

// 添加边
function addEdge(a, b, weight) {
    if (graph.edges.some(e => (e.node1.id === a.id && e.node2.id === b.id) || (e.node1.id === b.id && e.node2.id === a.id))) {
        alert('这条边已存在');
        return;
    }
    graph.edges.push(new Edge(a, b, weight));
    drawGraph();
}

// 更新起点选择器
function updateStartNodeSelect() {
    startNodeSelect.innerHTML = '<option value="">选择起始节点</option>';
    graph.nodes.forEach(node => {
        let op = document.createElement('option');
        op.value = node.id;
        op.textContent = `节点 ${node.id}`;
        startNodeSelect.appendChild(op);
    });
    startNodeSelect.disabled = graph.nodes.length === 0;
    runAlgorithmBtn.disabled = graph.nodes.length === 0;
}

// 重置画布
function resetCanvas() {
    graph.nodes = [];
    graph.edges = [];
    algorithmState = {
        isRunning: false,
        currentStep: 0,
        visited: new Set(),
        distances: {},
        previous: {},
        unvisited: new Set(),
        currentNode: null,
        startNode: null
    };
    selectedNodes = [];
    updateStartNodeSelect();
    drawGraph();
}

// 初始化 Dijkstra
function initDijkstra(startId) {
    algorithmState = {
        isRunning: true,
        visited: new Set(),
        distances: {},
        previous: {},
        unvisited: new Set(graph.nodes.map(n => n.id)),
        currentNode: startId,
        startNode: startId
    };

    graph.nodes.forEach(n => {
        algorithmState.distances[n.id] = n.id === startId ? 0 : Infinity;
        algorithmState.previous[n.id] = null;
    });

    drawGraph();
}

// 单步执行 Dijkstra
function nextDijkstraStep() {
    if (!algorithmState.isRunning || algorithmState.unvisited.size === 0) {
        algorithmState.isRunning = false;
        drawGraph();
        showResult();
        return;
    }

    let minNode = null;
    let minDist = Infinity;
    algorithmState.unvisited.forEach(id => {
        if (algorithmState.distances[id] < minDist) {
            minDist = algorithmState.distances[id];
            minNode = id;
        }
    });

    if (minNode === null) {
        algorithmState.isRunning = false;
        drawGraph();
        showResult();
        return;
    }

    algorithmState.currentNode = minNode;
    algorithmState.visited.add(minNode);
    algorithmState.unvisited.delete(minNode);

    const neighbors = getNeighbors(graph.nodes.find(n => n.id === minNode));
    neighbors.forEach(nb => {
        const edge = graph.edges.find(e => (e.node1.id === minNode && e.node2.id === nb.id) || (e.node2.id === minNode && e.node1.id === nb.id));
        if (!algorithmState.visited.has(nb.id)) {
            const alt = algorithmState.distances[minNode] + edge.weight;
            if (alt < algorithmState.distances[nb.id]) {
                algorithmState.distances[nb.id] = alt;
                algorithmState.previous[nb.id] = minNode;
            }
        }
    });

    drawGraph();
    setTimeout(nextDijkstraStep, 600);
}

function getNeighbors(node) {
    const neighbors = [];
    graph.edges.forEach(e => {
        if (e.node1.id === node.id) neighbors.push(e.node2);
        else if (e.node2.id === node.id) neighbors.push(e.node1);
    });
    return neighbors;
}

function showResult() {
    let out = "最短路径结果:\n\n";
    graph.nodes.forEach(n => {
        let d = algorithmState.distances[n.id];
        if (d === Infinity) out += `节点 ${n.id}: 不可达\n`;
        else {
            let path = [];
            let cur = n.id;
            while (cur !== null) {
                path.unshift(cur);
                cur = algorithmState.previous[cur];
            }
            out += `节点 ${n.id}: 距离=${d}, 路径=${path.join(" → ")}\n`;
        }
    });
    alert(out);
}

addNodeBtn.onclick = () => mode = 'addNode';
addEdgeBtn.onclick = () => { mode = 'addEdge'; selectedNodes = []; };
runAlgorithmBtn.onclick = () => {
    const start = parseInt(startNodeSelect.value);
    if (!isNaN(start)) initDijkstra(start), nextDijkstraStep();
};
resetBtn.onclick = resetCanvas;

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;

    if (mode === 'addNode') addNode(x, y);
    else if (mode === 'addEdge') {
        const target = graph.nodes.find(n => n.isPointInside(x, y));
        if (target) {
            selectedNodes.push(target);
            if (selectedNodes.length === 2) {
                addEdge(selectedNodes[0], selectedNodes[1], parseInt(edgeWeightInput.value) || 1);
                selectedNodes = [];
            }
        }
    }
});
