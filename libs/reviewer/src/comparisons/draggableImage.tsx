import 'reactflow/dist/style.css';

import {
  forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useRef, useState,
} from "react";
import ReactFlow, { OnNodesChange, applyNodeChanges, Node, useReactFlow, OnMove, Viewport } from 'reactflow';
import { useStore } from "zustand";
import Background from "./background";
import { ImageNode } from './imageNode';
import { StoreContext } from '../store';


interface ImageProps {
  base: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  secondBase?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  overlay?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  id: string;
  viewport?: Viewport;
  onMove?: OnMove;
}

export type DraggableImageRef = {
  center: () => void;
};


const nodeTypes = { image: ImageNode }

export const DraggableImage = forwardRef<DraggableImageRef, ImageProps>(
  function DraggableImage(
    {
      base,
      overlay,
      secondBase,
      viewport,
      onMove,
      id
    },
    ref
  ) {
    const store = useContext(StoreContext)!


    const [dragging, setDragging] = useState(false);

    const fitted = useRef(false);

    const [nodes, setNodes] = useState<Node[]>([{ id: id, position: { x: 0, y: 0 }, data: { base, overlay, secondBase }, type: 'image' }]);


    const updateImages = useRef(false);

    const singleSnapshot = useStore(store, (state) => state.singleSnapshot);
    const setSingleSnapshot = useStore(store,
      (state) => state.setSingleSnapshot
    );


    const { fitView, setViewport, getViewport } = useReactFlow();

    const onNodesChange = useCallback<OnNodesChange>(
      (changes) => {


        changes = changes.filter((change) => {
          return !((change.type === 'select' && change.id === "1"))

        });

        setNodes((nds) => applyNodeChanges(changes, nds))

        if (updateImages.current) {
          fitted.current = true;
          fitView();
          updateImages.current = false;
        }
      },
      [fitView]
    );


    const center = useCallback(() => {
      fitted.current = true;
      fitView();

    }, [fitView]);


    useImperativeHandle(ref, () => ({
      center
    }), [center]);


    useEffect(() => {
      if (viewport && !dragging) {
        setViewport(viewport)
      }
    }, [dragging, setViewport, viewport]);

    const onClick = useCallback((e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      Boolean(secondBase) && setSingleSnapshot(singleSnapshot === "head" ? "baseline" : "head")
    }, [secondBase, setSingleSnapshot, singleSnapshot]);

    const contextMenuCoords = useRef({ x: 0, y: 0 })

    useEffect(() => {

      setNodes((curr) => [
        { id: id, position: { x: 0, y: 0 }, width: curr.find(n => n.type === 'image')?.width, height: curr.find(n => n.type === 'image')?.height, data: { base, overlay, secondBase }, type: 'image' }
      ])

      updateImages.current = true;


    }, [base, id, overlay, secondBase]);

    useEffect(() => {
      center();
    }, [center]);

    return (
      <div className="h-full w-full flex-col flex items-center bg-surface-container-low rounded border border-outline-variant">
        <div className='w-full h-full'>


          <ReactFlow
            proOptions={{
              hideAttribution: true
            }}
            onPaneClick={onClick as any}
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
            nodesFocusable={false}
            zoomOnDoubleClick={false}
            nodesDraggable={false}
            nodes={nodes}
            nodeTypes={nodeTypes}
            onNodeClick={onClick as any}
            onContextMenu={(e) => {
              contextMenuCoords.current = { x: e.clientX, y: e.clientY };
            }}
            maxZoom={10}
            onNodesChange={onNodesChange}
            onPaneMouseEnter={() => { setDragging(true); }}
            onPaneMouseLeave={() => { setDragging(false); }}
            onMove={(...e) => {
              if (dragging || fitted.current) {
                onMove?.(...e);
                fitted.current = false;
              }
            }} >
            <Background />
          </ReactFlow>
        </div>
      </div >
    );
  }
);



