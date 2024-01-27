import 'reactflow/dist/style.css';

import { StaticImageData } from "next/image";
import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState,
} from "react";
import ReactFlow, { OnNodesChange, applyNodeChanges, Node, useReactFlow, OnMove, Viewport } from 'reactflow';
import { store } from "../store";
import { useStore } from "zustand";
import Background from "./background";
import { ImageNode } from './imageNode';
import { ChatNode } from './chatNode';


interface ImageProps {
  base: {
    src: string | StaticImageData;
    alt: string;
    width: number;
    height: number;
  };
  secondBase?: {
    src: string | StaticImageData;
    alt: string;
    width: number;
    height: number;
  };
  overlay?: {
    src: string | StaticImageData;
    alt: string;
    width: number;
    height: number;
  };
  viewport?: Viewport;
  onMove?: OnMove;
}

export type DraggableImageRef = {
  center: () => void;
};


export const DraggableImage = forwardRef<DraggableImageRef, ImageProps>(
  function DraggableImage(
    {
      base,
      overlay,
      secondBase,
      viewport,
      onMove
    },
    ref
  ) {

    const initialNodes: Node[] = [
      { id: '1', position: { x: 0, y: 0 }, data: { base, overlay, secondBase }, type: 'image' },


      { id: '2', position: { x: 0, y: 0 }, data: {}, type: 'chat' },
    ];

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const nodeTypes = useMemo(() => ({ image: ImageNode, chat: ChatNode }), []);

    const singleSnapshot = useStore(store, (state) => state.singleSnapshot);
    const setSingleSnapshot = useStore(store,
      (state) => state.setSingleSnapshot
    );

    const onNodesChange = useCallback<OnNodesChange>(
      (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
      [setNodes]
    );

    const { fitView, setViewport, getViewport } = useReactFlow();

    const center = useCallback(() => {
      fitView();

    }, [fitView]);


    useImperativeHandle(ref, () => ({
      center
    }), [center]);

    useEffect(() => {
      if (viewport) {
        setViewport(viewport)
      }
    }, [setViewport, viewport]);

    const onClick = useCallback(() => secondBase && setSingleSnapshot(singleSnapshot === "head" ? "baseline" : "head"), [secondBase, setSingleSnapshot, singleSnapshot]);

    return (
      <div className="h-full w-full flex-col flex items-center bg-surface-container-low rounded border border-outline-variant">
        <ReactFlow
          proOptions={{
            hideAttribution: true
          }}
          onPaneClick={onClick}
          minZoom={0.1}
          onWheelCapture={(e) => {
            if (e.shiftKey) {
              e.preventDefault();
              e.stopPropagation();
              const vp = getViewport();

              setViewport({
                x: vp.x - e.deltaX,
                y: vp.y - e.deltaY,
                zoom: vp.zoom,
              })
            }
          }}
          onNodeClick={onClick}
          nodesFocusable={false}
          zoomOnDoubleClick={false}
          nodesDraggable={false}
          nodes={nodes}
          nodeTypes={nodeTypes}
          maxZoom={10}
          onNodesChange={onNodesChange}
          fitView
          onMove={onMove} >
          <Background />
        </ReactFlow>
      </div>
    );
  }
);



