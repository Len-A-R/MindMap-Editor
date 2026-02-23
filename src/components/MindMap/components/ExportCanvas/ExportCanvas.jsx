import React, { useRef, useEffect, useState } from "react";

const ExportCanvas = ({ nodes, connections, onRender }) => {
  const canvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isReady || nodes.length === 0) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      // Вычисляем границы
      const xs = nodes.map((n) => n.x);
      const ys = nodes.map((n) => n.y);
      const padding = 100;
      const minX = Math.min(...xs) - padding;
      const maxX = Math.max(...xs) + padding;
      const minY = Math.min(...ys) - padding;
      const maxY = Math.max(...ys) + padding;

      const width = maxX - minX;
      const height = maxY - minY;

      console.log("Canvas size:", width, "x", height);

      if (width <= 0 || height <= 0) {
        console.log("Invalid canvas size");
        return;
      }

      // Увеличиваем разрешение
      const scale = 2;
      canvas.width = Math.max(Math.floor(width * scale), 100);
      canvas.height = Math.max(Math.floor(height * scale), 100);

      // Сбрасываем трансформации
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(scale, scale);
      ctx.translate(-minX, -minY);

      // Фон
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(minX, minY, width, height);

      // Рисуем parent-child связи
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      nodes.forEach((node) => {
        if (!node.parentId) return;
        const parent = nodes.find((n) => n.id === node.parentId);
        if (!parent || node.isDetached) return;

        ctx.beginPath();
        const dx = node.x - parent.x;
        const dy = node.y - parent.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 0.3;

        ctx.moveTo(parent.x, parent.y);
        ctx.quadraticCurveTo(
          parent.x + dr,
          parent.y,
          (parent.x + node.x) / 2,
          (parent.y + node.y) / 2,
        );
        ctx.quadraticCurveTo(node.x - dr, node.y, node.x, node.y);
        ctx.stroke();
      });

      // Рисуем пользовательские связи
      connections.forEach((conn) => {
        const from = nodes.find((n) => n.id === conn.from);
        const to = nodes.find((n) => n.id === conn.to);
        if (!from || !to) return;

        ctx.beginPath();
        ctx.strokeStyle = conn.style?.color || "#f59e0b";
        ctx.lineWidth = 2;

        if (conn.style?.dashed !== false) {
          ctx.setLineDash([5, 5]);
        } else {
          ctx.setLineDash([]);
        }

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 0.3;

        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(
          from.x + dr,
          from.y,
          (from.x + to.x) / 2,
          (from.y + to.y) / 2,
        );
        ctx.quadraticCurveTo(to.x - dr, to.y, to.x, to.y);
        ctx.stroke();

        // Текст связи
        if (conn.text) {
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;

          ctx.font = "12px Inter, sans-serif";
          const textWidth = ctx.measureText(conn.text).width;

          ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
          ctx.fillRect(midX - textWidth / 2 - 4, midY - 10, textWidth + 8, 20);

          ctx.fillStyle = conn.style?.color || "#f59e0b";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(conn.text, midX, midY);
        }
      });

      // РИСУЕМ УЗЛЫ
      console.log("Drawing", nodes.length, "nodes");

      nodes.forEach((node, index) => {
        console.log(
          "Drawing node",
          index,
          ":",
          node.id,
          node.text,
          "at",
          node.x,
          node.y,
        );

        const nodeWidth = node.style?.width || 140;
        const padding = node.style?.padding || 12;
        const fontSize = node.style?.fontSize || 14;

        const text = node.text || "Новый узел";
        const lines = text.split("\n");
        const lineCount = lines.length;
        const lineHeight = fontSize * 1.2;
        const nodeHeight = Math.max(
          lineHeight * lineCount + padding * 2,
          fontSize + padding * 2,
        );

        const bgColor =
          node.style?.backgroundColor ||
          (node.parentId ? "#1e293b" : "#3b82f6");
        const borderWidth = node.style?.borderWidth || 0;
        const borderColor =
          borderWidth > 0 ? node.style?.borderColor || "#3b82f6" : bgColor;

        // Рисуем форму
        ctx.fillStyle = bgColor;

        if (node.style?.shape === "circle") {
          const r = Math.max(nodeWidth, nodeHeight) / 2;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fill();

          if (borderWidth > 0) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = borderWidth;
            ctx.stroke();
          }
        } else if (node.style?.shape === "diamond") {
          const size = Math.max(nodeWidth, nodeHeight);
          ctx.save();
          ctx.translate(node.x, node.y);
          ctx.rotate(Math.PI / 4);

          if (borderWidth > 0) {
            ctx.fillStyle = borderColor;
            ctx.fillRect(
              -size / 2 - borderWidth / 2,
              -size / 2 - borderWidth / 2,
              size + borderWidth,
              size + borderWidth,
            );
          }

          ctx.fillStyle = bgColor;
          ctx.fillRect(-size / 2, -size / 2, size, size);
          ctx.restore();
        } else {
          // Прямоугольник
          const radius = node.style?.borderRadius || 8;

          if (borderWidth > 0) {
            ctx.fillStyle = borderColor;
            ctx.beginPath();
            ctx.roundRect(
              node.x - nodeWidth / 2 - borderWidth / 2,
              node.y - nodeHeight / 2 - borderWidth / 2,
              nodeWidth + borderWidth,
              nodeHeight + borderWidth,
              radius + 1,
            );
            ctx.fill();
          }

          ctx.fillStyle = bgColor;
          ctx.beginPath();
          ctx.roundRect(
            node.x - nodeWidth / 2,
            node.y - nodeHeight / 2,
            nodeWidth,
            nodeHeight,
            radius,
          );
          ctx.fill();
        }

        // Рисуем текст
        ctx.fillStyle = node.style?.color || "#ffffff";
        const fontStyle = node.style?.fontStyle === "italic" ? "italic " : "";
        const fontWeight = node.style?.fontWeight === "bold" ? "bold " : "";
        ctx.font = `${fontStyle}${fontWeight}${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const startY = node.y - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, i) => {
          ctx.fillText(line, node.x, startY + i * lineHeight);
        });
      });
      onRender(canvas);
      setIsReady(true);
    }, 100); // Небольшая задержка для гарантии загрузки


    return () => clearTimeout(timer)
  }, [nodes, connections, onRender, isReady])

  // Сброс при изменении данных
  useEffect(() => {
    setIsReady(false)
  }, [nodes.length, connections.length])

  return <canvas ref={canvasRef} style={{ display: 'none' }} />
}

export default ExportCanvas
