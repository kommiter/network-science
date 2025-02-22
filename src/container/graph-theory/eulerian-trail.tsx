"use client";

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import type {
  DragBehavior,
  D3DragEvent,
  Selection,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from "d3";
import {
  calculateEulerianTrail,
  Node,
  Edge,
} from "@/lib/algorithm/eulerian-trail";

const EulerianTrailVisualization: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 800;
  const height = 600;

  useEffect(() => {
    if (!svgRef.current) return;

    // 샘플 데이터
    const nodes: Node[] = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }];

    const edges: Edge[] = [
      { source: "1", target: "2", id: "e1" },
      { source: "2", target: "3", id: "e2" },
      { source: "3", target: "4", id: "e3" },
      { source: "4", target: "1", id: "e4" },
    ];

    // SVG 초기화
    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll("*").remove(); // 기존 요소 제거
    svg.attr("width", width).attr("height", height);

    // Zoom 기능 추가
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform.toString());
      });

    svg.call(zoom);

    // 컨테이너 생성 (zoom을 위해)
    const container = svg.append("g");

    // Force simulation 설정
    const simulation = d3
      .forceSimulation<Node>(nodes)
      .force(
        "link",
        d3
          .forceLink<Node, SimulationLinkDatum<Node>>(edges)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody<Node>().strength(-300))
      .force("center", d3.forceCenter<Node>(width / 2, height / 2))
      .force("collision", d3.forceCollide<Node>().radius(20));

    // 엣지 그리기
    const edgeElements = container
      .append("g")
      .attr("class", "edges")
      .selectAll<SVGLineElement, SimulationLinkDatum<Node>>("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-width", 2);

    // 드래그 동작 정의
    const drag: DragBehavior<SVGGElement, Node, unknown> = d3
      .drag<SVGGElement, Node>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

    function dragstarted(
      event: D3DragEvent<SVGGElement, Node, unknown>,
      d: Node
    ) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragged(event: D3DragEvent<SVGGElement, Node, unknown>, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(
      event: D3DragEvent<SVGGElement, Node, unknown>,
      d: Node
    ) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // 노드 그룹 생성
    const nodeGroups = container
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, Node>("g")
      .data(nodes)
      .join("g")
      .call(drag);

    // 노드 원 그리기
    nodeGroups.append("circle").attr("r", 15).attr("fill", "steelblue");

    // 노드 라벨 추가
    nodeGroups
      .append("text")
      .text((d) => d.id)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", "white")
      .attr("font-size", "12px");

    // Force simulation 업데이트
    simulation.on("tick", () => {
      edgeElements
        .attr("x1", (d) => {
          const source = d.source as Node;
          return source.x ?? 0;
        })
        .attr("y1", (d) => {
          const source = d.source as Node;
          return source.y ?? 0;
        })
        .attr("x2", (d) => {
          const target = d.target as Node;
          return target.x ?? 0;
        })
        .attr("y2", (d) => {
          const target = d.target as Node;
          return target.y ?? 0;
        });

      nodeGroups.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // 오일러 경로 계산 및 하이라이트
    try {
      const path = calculateEulerianTrail(nodes, edges);

      // 순차적으로 경로 하이라이트
      path.forEach((edge, index) => {
        const edgeElement = edgeElements.filter((d) => {
          const sourceId =
            typeof d.source === "string" ? d.source : (d.source as Node).id;
          const targetId =
            typeof d.target === "string" ? d.target : (d.target as Node).id;
          const edgeSourceId =
            typeof edge.source === "string" ? edge.source : edge.source.id;
          const edgeTargetId =
            typeof edge.target === "string" ? edge.target : edge.target.id;

          return (
            (sourceId === edgeSourceId && targetId === edgeTargetId) ||
            (sourceId === edgeTargetId && targetId === edgeSourceId)
          );
        });

        edgeElement
          .transition()
          .delay(index * 1000)
          .duration(500)
          .attr("stroke", "red")
          .attr("stroke-width", 4);

        // 노드도 순차적으로 하이라이트
        const sourceNode = nodeGroups.filter((d) => d.id === edge.source);
        const targetNode = nodeGroups.filter((d) => d.id === edge.target);

        sourceNode
          .select("circle")
          .transition()
          .delay(index * 1000)
          .duration(500)
          .attr("fill", "red");

        targetNode
          .select("circle")
          .transition()
          .delay(index * 1000 + 500)
          .duration(500)
          .attr("fill", "red");
      });
    } catch (error) {
      console.error("Failed to calculate Eulerian trail:", error);
    }

    // 클린업 함수
    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Eulerian Trail Visualization</h1>
      <svg
        ref={svgRef}
        className="border border-gray-300 rounded-lg bg-white"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </div>
  );
};

export default EulerianTrailVisualization;
