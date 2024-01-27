import 'reactflow/dist/style.css';

import { StaticImageData } from "next/image";
import {
  forwardRef, useCallback, useContext, useEffect, useId, useImperativeHandle, useMemo, useState,
} from "react";
import ReactFlow, { NodeProps, OnNodesChange, applyNodeChanges, Node, useReactFlow, OnMove, Viewport } from 'reactflow';
import NextImage from "next/image";
import { cx } from "class-variance-authority";
import { StoreContext, store } from "../store";
import { useStore } from "zustand";
import Background from "./background";


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

interface ImageNodeData {
  base: {
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
  secondBase?: {
    src: string | StaticImageData;
    alt: string;
    width: number;
    height: number;
  };
}

function ImageNode({ data: {
  base,
  overlay,
  secondBase
} }: NodeProps<ImageNodeData>) {

  const store = useContext(StoreContext)

  const optimize = useStore(store, (state) => state.optimize);
  const showOverlay = useStore(store, (state) => state.showDiff);
  const singleSnapshot = useStore(store, (state) => state.singleSnapshot);


  return (
    <div className="active:cursor-grabbing">
      <NextImage
        key={`base - ${base.src.toString()}`}
        quality={100}
        priority
        className={cx(
          "pointer-events-none select-none",
          singleSnapshot !== "head" && "hidden",
          showOverlay && overlay && "brightness-[50%]"
        )}
        draggable={false}
        alt={base.alt}
        src={base.src}
        unoptimized={!optimize}
        placeholder={optimize ? "blur" : "empty"}
      />
      {secondBase && (
        <NextImage
          key={`second - base - ${secondBase.src.toString()}`}
          quality={100}
          priority
          className={cx(
            "pointer-events-none select-none",
            singleSnapshot === "head" && "hidden",
          )}
          draggable={false}
          alt={secondBase.alt}
          src={secondBase.src}
          placeholder={optimize ? "blur" : "empty"}
          unoptimized={!optimize}
        />
      )}
      {overlay && (
        <NextImage
          key={`overlay - ${overlay.src.toString()}`}
          priority
          quality={100}
          className={cx(
            (!showOverlay || singleSnapshot !== "head") && "opacity-0",
            "pointer-events-none select-none absolute inset-0",
          )}
          draggable={false}
          alt={overlay.alt}
          src={overlay.src}
          placeholder={optimize ? "blur" : "empty"}
          unoptimized={!optimize}
        />
      )}
    </div>

  )
}


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

    const initialNodes = [
      { id: '1', position: { x: 0, y: 0 }, data: { base, overlay, secondBase }, type: 'image' }];

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const nodeTypes = useMemo(() => ({ image: ImageNode }), []);

    const singleSnapshot = useStore(store, (state) => state.singleSnapshot);
    const setSingleSnapshot = useStore(store,
      (state) => state.setSingleSnapshot
    );

    const onNodesChange = useCallback<OnNodesChange>(
      (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
      [setNodes]
    );

    const { fitView, setViewport } = useReactFlow();

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
        <ReactFlow proOptions={{
          hideAttribution: true
        }} onPaneClick={onClick} onWheelCapture={(e) => {
          if (e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();

            setViewport({
              x: (viewport?.x || 0) + e.deltaX,
              y: (viewport?.y || 0) + e.deltaY,
              zoom: viewport?.zoom || 1,
            })
          }
        }} onNodeClick={onClick} nodesFocusable={false} zoomOnDoubleClick={false} nodesDraggable={false} nodes={nodes} nodeTypes={nodeTypes} maxZoom={10} onNodesChange={onNodesChange} fitView onMove={onMove} >
          <Background />
        </ReactFlow>
      </div>
    );
  }
);



