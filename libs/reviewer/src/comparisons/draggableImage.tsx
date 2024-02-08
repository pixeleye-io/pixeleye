import 'reactflow/dist/style.css';

import { StaticImageData } from "next/image";
import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from "react";
import ReactFlow, { OnNodesChange, applyNodeChanges, Node, useReactFlow, OnMove, Viewport } from 'reactflow';
import { store } from "../store";
import { useStore } from "zustand";
import Background from "./background";
import { ImageNode } from './imageNode';
import { ChatNode } from './chatNode';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuTrigger } from '@pixeleye/ui';
import { ChevronDownIcon } from '@heroicons/react/24/outline';


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
  id: string;
  viewport?: Viewport;
  onMove?: OnMove;
}

export type DraggableImageRef = {
  center: () => void;
};


const nodeTypes = { image: ImageNode, chat: ChatNode }

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


    const [nodes, setNodes] = useState<Node[]>([]);


    const updateImages = useRef(false);

    const singleSnapshot = useStore(store, (state) => state.singleSnapshot);
    const setSingleSnapshot = useStore(store,
      (state) => state.setSingleSnapshot
    );


    const { fitView, setViewport, getViewport, screenToFlowPosition, addNodes } = useReactFlow();

    const onNodesChange = useCallback<OnNodesChange>(
      (changes) => {


        changes = changes.filter((change) => {
          return !((change.type === 'select' && change.id === "1"))

        });


        setNodes((nds) => applyNodeChanges(changes, nds))

        if (updateImages.current) {
          fitView();
          updateImages.current = false;
        }
      },
      [fitView]
    );


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

    const contextMenuCoords = useRef({ x: 0, y: 0 })

    useEffect(() => {

      setNodes([
        { id: id, position: { x: 0, y: 0 }, data: { base, overlay, secondBase }, type: 'image' }
      ])

      updateImages.current = true;


    }, [base, id, overlay, secondBase]);

    return (
      <div className="h-full w-full flex-col flex items-center bg-surface-container-low rounded border border-outline-variant">
        <ContextMenu>
          <ContextMenuTrigger disabled className='w-full h-full'>
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
              nodesFocusable={false}
              zoomOnDoubleClick={false}
              nodesDraggable={false}
              nodes={nodes}
              nodeTypes={nodeTypes}
              onNodeClick={onClick}
              onContextMenu={(e) => {
                contextMenuCoords.current = { x: e.clientX, y: e.clientY };
              }}
              maxZoom={10}
              onNodesChange={onNodesChange}
              onMove={onMove} >
              <Background />
            </ReactFlow>
          </ContextMenuTrigger>
          <ContextMenuPortal >
            <ContextMenuContent >
              <ContextMenuItem onClick={(e) => {

                const pos = screenToFlowPosition(contextMenuCoords.current);

                const randID = Math.random().toString(36).substring(7); // TODO - make this use the convo id after the convo is created


                addNodes([
                  {
                    id: randID,
                    type: 'chat',
                    position: pos,
                    data: { text: "" },
                    zIndex: 100
                  }
                ])



              }}>
                Comment
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenuPortal>
        </ContextMenu>
      </div >
    );
  }
);



