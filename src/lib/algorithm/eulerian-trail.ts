import { SimulationNodeDatum, SimulationLinkDatum } from "d3";

export interface Node extends SimulationNodeDatum {
  id: string;
}

export interface Edge extends SimulationLinkDatum<Node> {
  id: string;
  source: string | Node;
  target: string | Node;
}

interface Graph {
  [key: string]: string[];
}

export function calculateEulerianTrail(nodes: Node[], edges: Edge[]): Edge[] {
  // 그래프를 인접 리스트로 변환
  const graph: Graph = {};
  nodes.forEach((node) => {
    graph[node.id] = [];
  });

  edges.forEach((edge) => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    graph[sourceId].push(targetId);
    graph[targetId].push(sourceId); // 무방향 그래프
  });

  // 각 정점의 차수 계산
  const degree: { [key: string]: number } = {};
  nodes.forEach((node) => {
    degree[node.id] = graph[node.id].length;
  });

  // 오일러 경로 존재 확인
  const oddDegreeNodes = nodes.filter((node) => degree[node.id] % 2 !== 0);
  if (oddDegreeNodes.length !== 0 && oddDegreeNodes.length !== 2) {
    throw new Error("Eulerian trail does not exist");
  }

  // 시작 정점 선택
  const start = oddDegreeNodes.length === 2 ? oddDegreeNodes[0].id : nodes[0].id;

  // DFS로 오일러 경로 찾기
  const path: Edge[] = [];
  const edgeMap = new Map(edges.map((edge) => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    return [`${sourceId}-${targetId}`, edge];
  }));

  function findPath(current: string) {
    while (graph[current].length > 0) {
      const next = graph[current][0];

      // 간선 제거
      graph[current] = graph[current].filter((v) => v !== next);
      graph[next] = graph[next].filter((v) => v !== current);

      // 경로에 간선 추가
      const edge = edgeMap.get(`${current}-${next}`) || edgeMap.get(`${next}-${current}`);
      if (edge) {
        path.push(edge);
      }

      findPath(next);
    }
  }

  findPath(start);
  return path;
}
