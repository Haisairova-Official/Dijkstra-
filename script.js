document.addEventListener("DOMContentLoaded", () => {

const graph = { nodes: [], edges: [] };
let mode = "none";
let selectedNodes = [];

let algorithm = {
    running: false,
    dist: {},
    prev: {},
    unvisited: new Set(),
    visited: new Set(),
    current: null,
    start: null
};

const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    draw();
}
window.addEventListener("load", resize);
window.addEventListener("resize", resize);

class Node{
    constructor(x,y,id){this.x=x;this.y=y;this.id=id;this.r=25;}
    hit(x,y){return Math.hypot(this.x-x,this.y-y)<=this.r;}
    draw(state){
        let c = {start:"#00ff00",current:"#ff6b6b",visited:"#ffcc00",unvisited:"#4a90e2"}[state];
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
        ctx.fillStyle=c; ctx.fill();
        ctx.strokeStyle="#fff"; ctx.stroke();
        ctx.fillStyle="#000"; ctx.font="bold 14px sans-serif";
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(this.id,this.x,this.y);
    }
}

class Edge{
    constructor(a,b,w){this.a=a;this.b=b;this.w=w;}
    draw(){
        ctx.strokeStyle="#fff"; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(this.a.x,this.a.y); ctx.lineTo(this.b.x,this.b.y); ctx.stroke();
        let mx=(this.a.x+this.b.x)/2, my=(this.a.y+this.b.y)/2;
        ctx.fillStyle="#fff"; ctx.fillText(this.w,mx,my-10);
    }
}

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    graph.edges.forEach(e=>e.draw());
    graph.nodes.forEach(n=>{
        let st="unvisited";
        if(n.id===algorithm.start) st="start";
        if(n.id===algorithm.current) st="current";
        if(algorithm.visited.has(n.id)) st="visited";
        n.draw(st);
    });
}

function addNode(x,y){
    const id = graph.nodes.length ? graph.nodes.at(-1).id+1 : 0;
    graph.nodes.push(new Node(x,y,id));
    refreshStartSelect(); draw();
}

function addEdge(a,b,w){
    if(graph.edges.some(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a))) return;
    graph.edges.push(new Edge(a,b,w));
    draw();
}

function refreshStartSelect(){
    const sel=document.getElementById("startNode");
    sel.innerHTML='<option value="">未选择</option>';
    graph.nodes.forEach(n=>{
        sel.innerHTML+=`<option value="${n.id}">节点 ${n.id}</option>`;
    });
    sel.disabled = graph.nodes.length===0;
    document.getElementById("runAlgorithmBtn").disabled = graph.nodes.length===0;
}

function neighbors(node){
    return graph.edges.flatMap(e => e.a===node?e.b:(e.b===node?e.a:[]));
}

function initDijkstra(start){
    algorithm.running=true;
    algorithm.start=start;
    algorithm.visited.clear();
    algorithm.unvisited=new Set(graph.nodes.map(n=>n.id));
    graph.nodes.forEach(n=>{
        algorithm.dist[n.id]=n.id===start?0:Infinity;
        algorithm.prev[n.id]=null;
    });
}

function step(){
    if(!algorithm.running) return;
    let min = [...algorithm.unvisited].reduce((m,id)=>algorithm.dist[id]<algorithm.dist[m]?id:m, [...algorithm.unvisited][0]);
    algorithm.current=min;
    algorithm.unvisited.delete(min);
    algorithm.visited.add(min);

    neighbors(graph.nodes.find(n=>n.id===min)).forEach(nb=>{
        if(algorithm.visited.has(nb.id)) return;
        let w = graph.edges.find(e=>(e.a.id===min&&e.b.id===nb.id)||(e.b.id===min&&e.a.id===nb.id)).w;
        let alt = algorithm.dist[min]+w;
        if(alt<algorithm.dist[nb.id]) algorithm.dist[nb.id]=alt, algorithm.prev[nb.id]=min;
    });

    draw();
    if(algorithm.unvisited.size===0) return showResult();
    setTimeout(step,600);
}

function showResult(){
    algorithm.running=false;
    let msg="最短路径结果：\n\n";
    graph.nodes.forEach(n=>{
        let d=algorithm.dist[n.id];
        if(d===Infinity){msg+=`节点 ${n.id}: 不可达\n`; return;}
        let p=[],c=n.id;while(c!==null)p.unshift(c),c=algorithm.prev[c];
        msg+=`节点 ${n.id}: 距离=${d} 路径=${p.join(" → ")}\n`;
    });
    alert(msg);
}

canvas.addEventListener("click",e=>{
    let r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    if(mode==="addNode") return addNode(x,y);
    if(mode==="addEdge"){
        let hit = graph.nodes.find(n=>n.hit(x,y));
        if(hit){selectedNodes.push(hit); if(selectedNodes.length===2){
            addEdge(selectedNodes[0],selectedNodes[1], parseInt(edgeWeight.value)||1);
            selectedNodes=[];
        }}
    }
});

addNodeBtn.onclick=()=>mode="addNode";
addEdgeBtn.onclick=()=>{mode="addEdge"; selectedNodes=[];};
runAlgorithmBtn.onclick=()=>{
    const id=parseInt(startNode.value);
    if(isNaN(id))return;
    initDijkstra(id); step();
};
resetBtn.onclick=()=>{
    graph.nodes=[]; graph.edges=[];
    selectedNodes=[]; mode="none"; refreshStartSelect(); draw();
};

});
