const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const user_id = "aditi_20050322";
const email_id = "aditi.bansal.btech2023@sitpune.edu.in";
const enrollment_number = "230329027";

function treeBuild(node, graph, path = new Set()) {
    if (path.has(node)) {
        return { [node]: {} };
    }

    path.add(node);
    const ob = {};
    ob[node] = {};

    for (const c of graph[node] || []) {
        ob[node] = {
            ...ob[node],
            ...treeBuild(c, graph, path)
        };
    }

    path.delete(node);
    return ob;
}

const buildTree = treeBuild;

function depth(node, graph, path = new Set()) {
    if (path.has(node)) {
        return 0;
    }

    path.add(node);
    if (!graph[node] || graph[node].length === 0) {
        path.delete(node);
        return 1;
    }
    let maxDepth = 0;
    for (const c of graph[node]) {
        maxDepth = Math.max(maxDepth, depth(c, graph, path));
    }
    path.delete(node);
    return 1 + maxDepth;
}

const getDepth = depth;

function hasCycle(node, graph, visited, p) {
    visited.add(node);
    p.add(node);

    for (const c of graph[node] || []) {
        if (p.has(c)) {
            return true;
        }
        if (!visited.has(c)) {
            if (hasCycle(c, graph, visited, p)) {
                return true;
            }
        }
    }
    p.delete(node);
    return false;
}

const hasCycleDFS = hasCycle;

function component(start, undiectedGraph, visited) {
    const stack = [start];
    const componentNodes = [];
    while (stack.length > 0) {
        const node = stack.pop();
        componentNodes.push(node);
        for (const c of undiectedGraph[node] || []) {
            if (!visited.has(c)) {
                visited.add(c);
                stack.push(c);
            }
        }
    }
    return componentNodes;
}

const getComponent = component;

app.post('/api/graph', (req, res) => {
    const edges = req.body.edges;
    if (!Array.isArray(edges)) {
        return res.status(400).json({ error: "Edges should be an array" });
    }

    const invalid_entries = [];
    const duplicate_edges = [];
    const duplicateSet = new Set();
    const usedEdges = new Set();

    const graph = {};
    const nodes = new Set();
    const childSet = new Set();
    const childParent = new Map();

    for (let edge of edges) {
        edge = String(edge).trim();

        const match = edge.match(/^([A-Z])->([A-Z])$/);

        if (!match) {
            invalid_entries.push(edge);
            continue;
        }

        const parent = match[1];
        const child = match[2];

        if (parent === child) {
            invalid_entries.push(edge);
            continue;
        }

        if (usedEdges.has(edge)) {
            duplicateSet.add(edge);
            continue;
        }

        usedEdges.add(edge);

        if (childParent.has(child)) {
            continue;
        }

        childParent.set(child, parent);

        if (!graph[parent]) graph[parent] = [];
        if (!graph[child]) graph[child] = [];

        graph[parent].push(child);

        nodes.add(parent);
        nodes.add(child);
        childSet.add(child);
    }

    duplicate_edges.push(...duplicateSet);

    const undirected = {};
    for (const node of nodes) undirected[node] = [];

    for (const parent in graph) {
        for (const child of graph[parent]) {
            undirected[parent].push(child);
            undirected[child].push(parent);
        }
    }

    const visitedComponents = new Set();
    const hierarchies = [];

    let total_trees = 0;
    let total_cycles = 0;
    let largest_tree_root = "";
    let largestDepth = 0;

    const sortedNodes = [...nodes].sort();

    for (const node of sortedNodes) {
        if (visitedComponents.has(node)) continue;

        const component = getComponent(node, undirected, visitedComponents).sort();

        let roots = component.filter(n => !childSet.has(n));
        let root = roots.length > 0 ? roots.sort()[0] : component[0];

        const visited = new Set();
        const path = new Set();

        let cycle = false;
        for (const n of component) {
            if (!visited.has(n)) {
                if (hasCycleDFS(n, graph, visited, path)) {
                    cycle = true;
                    break;
                }
            }
        }

        if (cycle) {
            hierarchies.push({
                root,
                tree: {},
                has_cycle: true
            });
            total_cycles++;
        } else {
            const tree = buildTree(root, graph);
            const depth = getDepth(root, graph);

            hierarchies.push({
                root,
                tree,
                depth
            });

            total_trees++;

            if (
                depth > largestDepth ||
                (depth === largestDepth && (largest_tree_root === "" || root < largest_tree_root))
            ) {
                largestDepth = depth;
                largest_tree_root = root;
            }
        }
    }

    res.json({
        user_id: user_id,
        email_id: email_id,
        enrollment_number: enrollment_number,
        hierarchies,
        invalid_entries,
        duplicate_edges,
        summary: {
            total_trees,
            total_cycles,
            largest_tree_root
        }
    });
});

app.get("/", (req, res) => {
    res.send("BackendAPI is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});