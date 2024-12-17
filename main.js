import fs from 'fs';
import Graph from 'graphology';
import {largestConnectedComponentSubgraph} from 'graphology-components';
import louvain from 'graphology-communities-louvain';
import weightedSize from 'graphology-metrics/graph/weighted-size.js';

const file = fs.readFileSync('graph.json')

var graph = Graph.from(JSON.parse(file))


graph.forEachNode((node) => {
    if(graph.degree(node) === 0){
        graph.dropNode(node);
    }
});


const largest_comp = largestConnectedComponentSubgraph(graph);


const com = louvain(largest_comp);

const M = weightedSize(largest_comp);

var community_total_weight = {}

largest_comp.forEachEdge((edge, attributes, source, target) => {
    community_total_weight[com[source]] =  (community_total_weight[com[source]] || 0) + 1;
    community_total_weight[com[target]] =  (community_total_weight[com[target]] || 0) + 1;
})

var list_communities = []
for (const [key, value] of Object.entries(community_total_weight)) {
    list_communities.push(key)
}

largest_comp.forEachNode((node) => {
    var communities_weight = {}
    var node_degree = 0
    largest_comp.forEachNeighbor((node), neighbor => {
        node_degree += 1;
        communities_weight[com[neighbor]] = (communities_weight[com[neighbor]] || 0) + 1;
    })
    var list_deltas = [];
    for(const community in list_communities){
        if(community != com[node]){
            var nodeCommunityDegree = communities_weight[community] ? communities_weight[community] : 0
            var delta = undirectedModularityDelta(M, community_total_weight[community], node_degree, nodeCommunityDegree)
            list_deltas.push(delta)
        }
    }
    largest_comp.updateNode(node, attr => {
        return {
          ...attr,
          delta: Math.min(...list_deltas) ? -Math.min(...list_deltas) : 0
        };
      });
    }
)

console.log(largest_comp)

function undirectedModularityDelta(
    M, // volume total de lien, somme du poids de tous les arcs
    communityTotalWeight, // somme du poids de tous les arcs où au moins un des noeuds est dans la communauté
    nodeDegree, // poids avec chaque voisin / nombre de voisins si pas de poids
    nodeCommunityDegree // poids du noeud avec chaque communauté / nombre de liens avec chaque communauté si pas de poids
  ) {
    return (
      nodeCommunityDegree / (2 * M) -
      (communityTotalWeight * nodeDegree) / (2 * (M * M))
    );
  }
