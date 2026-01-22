"use client";

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { X, GripVertical } from 'lucide-react';

interface DraggablePanelProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  defaultPosition?: { x: number; y: number };
  width?: string;
  className?: string;
  icon?: ReactNode;
}

export default function DraggablePanel({
  children,
  isOpen,
  onClose,
  title,
  defaultPosition = { x: 100, y: 100 },
  width = 'w-96',
  className = '',
  icon
}: DraggablePanelProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset position when panel opens
  useEffect(() => {
    if (isOpen) {
      setPosition(defaultPosition);
    }
  }, [isOpen, defaultPosition]);

  // Handle mouse move
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep panel within viewport bounds
      const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 400);
      const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 300);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={`fixed ${width} bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden z-50 ${className}`}
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-white/60" />
          {icon}
          <span className="font-semibold text-white">{title}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

// Hook for managing multiple draggable panels
export function useDraggablePanels() {
  const [panels, setPanels] = useState<{
    [key: string]: { x: number; y: number };
  }>({});

  const getPosition = (panelId: string, defaultPos: { x: number; y: number }) => {
    return panels[panelId] || defaultPos;
  };

  const setPanelPosition = (panelId: string, pos: { x: number; y: number }) => {
    setPanels(prev => ({
      ...prev,
      [panelId]: pos
    }));
  };

  return { getPosition, setPanelPosition };
}
