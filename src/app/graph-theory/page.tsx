"use client";

import { useState } from "react";
import EulerianTrailVisualization from "@/container/graph-theory/eulerian-trail";
import type { Node, Edge } from "@/lib/algorithm/eulerian-trail";
import { read, utils } from "xlsx";

export default function GraphTheoryPage() {
  const [generationType, setGenerationType] = useState<"auto" | "manual">(
    "auto"
  );
  const [numNodes, setNumNodes] = useState(5);
  const [numEdges, setNumEdges] = useState(9);
  const [requireSolution, setRequireSolution] = useState(true);
  const [matrix, setMatrix] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [graphData, setGraphData] = useState<{
    nodes: Node[];
    edges: Edge[];
  } | null>(null);
  const [visualizationKey, setVisualizationKey] = useState(0);

  // 자동 생성 로직
  const generateRandomGraph = () => {
    const nodes: Node[] = Array.from({ length: numNodes }, (_, i) => ({
      id: String(i + 1),
    }));

    const edges: Edge[] = [];
    let edgeId = 1;

    if (requireSolution) {
      // 오일러 트레일이 존재하도록 그래프 생성
      // 1. 두 개의 홀수 차수 정점 선택 (시작점과 끝점)
      const startNode = nodes[0];
      const endNode = nodes[nodes.length - 1];

      // 2. 모든 노드를 연결하는 경로 생성 (연결성 보장)
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
          id: `e${edgeId++}`,
          source: nodes[i].id,
          target: nodes[i + 1].id,
        });
      }

      // 3. 나머지 엣지를 추가하되, 시작점과 끝점만 홀수 차수가 되도록 함
      const nodeDegrees = new Map(nodes.map((node) => [node.id, 1])); // 초기 차수 1 (시작-끝 경로로 인해)
      nodeDegrees.set(startNode.id, 1);
      nodeDegrees.set(endNode.id, 1);

      while (edges.length < numEdges) {
        const source = Math.floor(Math.random() * nodes.length);
        const target = Math.floor(Math.random() * nodes.length);
        const sourceNode = nodes[source];
        const targetNode = nodes[target];

        // 같은 노드이거나 이미 연결된 경우 스킵
        if (
          source === target ||
          edges.some(
            (e) =>
              (e.source === sourceNode.id && e.target === targetNode.id) ||
              (e.source === targetNode.id && e.target === sourceNode.id)
          )
        ) {
          continue;
        }

        // 엣지 추가 시 차수 변화 계산
        const newSourceDegree = (nodeDegrees.get(sourceNode.id) || 0) + 1;
        const newTargetDegree = (nodeDegrees.get(targetNode.id) || 0) + 1;

        // 시작점과 끝점이 아닌 노드는 짝수 차수를 유지해야 함
        if (
          (sourceNode !== startNode &&
            sourceNode !== endNode &&
            newSourceDegree % 2 !== 0) ||
          (targetNode !== startNode &&
            targetNode !== endNode &&
            newTargetDegree % 2 !== 0)
        ) {
          continue;
        }

        // 엣지 추가 및 차수 업데이트
        edges.push({
          id: `e${edgeId++}`,
          source: sourceNode.id,
          target: targetNode.id,
        });
        nodeDegrees.set(sourceNode.id, newSourceDegree);
        nodeDegrees.set(targetNode.id, newTargetDegree);
      }
    } else {
      // 완전히 랜덤한 그래프 생성
      while (edges.length < numEdges) {
        const source = Math.floor(Math.random() * nodes.length);
        const target = Math.floor(Math.random() * nodes.length);

        if (
          source !== target &&
          !edges.some(
            (e) =>
              (e.source === nodes[source].id &&
                e.target === nodes[target].id) ||
              (e.source === nodes[target].id && e.target === nodes[source].id)
          )
        ) {
          edges.push({
            id: `e${edgeId++}`,
            source: nodes[source].id,
            target: nodes[target].id,
          });
        }
      }
    }

    setGraphData({ nodes, edges });
  };

  // 행렬 입력 파싱
  const parseMatrix = (matrixStr: string) => {
    try {
      const rows = matrixStr.trim().split(";");
      const matrix = rows.map((row) => row.split(",").map(Number));

      if (matrix.length === 0 || matrix.length !== matrix[0].length) {
        throw new Error("Invalid matrix format");
      }

      const nodes: Node[] = Array.from({ length: matrix.length }, (_, i) => ({
        id: String(i + 1),
      }));

      const edges: Edge[] = [];
      let edgeId = 1;

      for (let i = 0; i < matrix.length; i++) {
        for (let j = i + 1; j < matrix[i].length; j++) {
          if (matrix[i][j] === 1) {
            edges.push({
              id: `e${edgeId++}`,
              source: nodes[i].id,
              target: nodes[j].id,
            });
          }
        }
      }

      setGraphData({ nodes, edges });
    } catch (error) {
      console.error("Failed to parse matrix:", error);
      alert("Invalid matrix format. Please use format like: 0,1,0;1,0,1;0,1,0");
    }
  };

  // XLSX 파일 파싱
  const parseXLSX = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json<number[]>(worksheet, { header: 1 });

      const nodes: Node[] = Array.from({ length: jsonData.length }, (_, i) => ({
        id: String(i + 1),
      }));

      const edges: Edge[] = [];
      let edgeId = 1;

      for (let i = 0; i < jsonData.length; i++) {
        for (let j = i + 1; j < jsonData[i].length; j++) {
          if (jsonData[i][j] === 1) {
            edges.push({
              id: `e${edgeId++}`,
              source: nodes[i].id,
              target: nodes[j].id,
            });
          }
        }
      }

      setGraphData({ nodes, edges });
    } catch (error) {
      console.error("Failed to parse XLSX:", error);
      alert("Failed to parse XLSX file. Please check the format.");
    }
  };

  const handleGenerate = () => {
    if (generationType === "auto") {
      generateRandomGraph();
    } else {
      if (file) {
        parseXLSX(file);
      } else if (matrix.trim()) {
        parseMatrix(matrix);
      } else {
        alert("Please provide either a matrix or an XLSX file");
        return;
      }
    }
    setVisualizationKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Graph Theory</h1>
      <h2 className="text-2xl font-bold mb-4">Eulerian Trail</h2>

      {/* 생성 방식 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Generation Type
        </label>
        <div className="flex gap-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              value="auto"
              checked={generationType === "auto"}
              onChange={(e) =>
                setGenerationType(e.target.value as "auto" | "manual")
              }
            />
            <span className="ml-2">Automatic Generation</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              value="manual"
              checked={generationType === "manual"}
              onChange={(e) =>
                setGenerationType(e.target.value as "auto" | "manual")
              }
            />
            <span className="ml-2">Manual Input</span>
          </label>
        </div>
      </div>

      {/* 자동 생성 옵션 */}
      {generationType === "auto" && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Nodes: {numNodes}
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={numNodes}
              onChange={(e) => {
                const newNumNodes = Number(e.target.value);
                setNumNodes(newNumNodes);
                // 엣지 수 조정
                const minEdges = newNumNodes - 1;
                const maxEdges = requireSolution
                  ? Math.min(
                      Math.floor((newNumNodes * (newNumNodes - 1)) / 2),
                      // 시작점과 끝점은 홀수 차수, 나머지는 짝수 차수여야 함
                      minEdges + 2 * Math.floor((newNumNodes - 2) / 2)
                    )
                  : Math.floor((newNumNodes * (newNumNodes - 1)) / 2);

                if (numEdges < minEdges) {
                  setNumEdges(minEdges);
                } else if (numEdges > maxEdges) {
                  setNumEdges(maxEdges);
                }
              }}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Edges: {numEdges}
            </label>
            <input
              type="range"
              min={numNodes - 1}
              max={
                requireSolution
                  ? Math.min(
                      Math.floor((numNodes * (numNodes - 1)) / 2),
                      // 시작점과 끝점은 홀수 차수, 나머지는 짝수 차수여야 함
                      numNodes - 1 + 2 * Math.floor((numNodes - 2) / 2)
                    )
                  : Math.floor((numNodes * (numNodes - 1)) / 2)
              }
              value={numEdges}
              onChange={(e) => setNumEdges(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={requireSolution}
                onChange={(e) => {
                  setRequireSolution(e.target.checked);
                  // 솔루션 요구사항이 변경될 때 엣지 수 조정
                  if (e.target.checked) {
                    const maxEdges = Math.min(
                      Math.floor((numNodes * (numNodes - 1)) / 2),
                      numNodes - 1 + 2 * Math.floor((numNodes - 2) / 2)
                    );
                    if (numEdges > maxEdges) {
                      setNumEdges(maxEdges);
                    }
                  }
                }}
                className="form-checkbox"
              />
              <span className="ml-2">Require Solution Existence</span>
            </label>
          </div>
        </div>
      )}

      {/* 수동 입력 옵션 */}
      {generationType === "manual" && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjacency Matrix Input
            </label>
            <textarea
              value={matrix}
              onChange={(e) => setMatrix(e.target.value)}
              placeholder="Enter adjacency matrix (e.g., 0,1,0;1,0,1;0,1,0)"
              className="w-full h-32 p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Upload XLSX File
            </label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* 생성 버튼 */}
      <button
        onClick={handleGenerate}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-6"
      >
        Generate Graph
      </button>

      <EulerianTrailVisualization
        key={visualizationKey}
        nodes={graphData?.nodes}
        edges={graphData?.edges}
      />
    </div>
  );
}
