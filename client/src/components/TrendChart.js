import React from "react";

// data: [{ semester, avg }], already sorted ascending by semester
export default function TrendChart({ data }) {
    if (!data || data.length === 0) return null;

    const width = 560;
    const height = 180;
    const padX = 36;
    const padY = 24;

    const maxAvg = Math.max(100, ...data.map((d) => d.avg));
    const minAvg = 0;

    const xFor = (i) =>
        data.length === 1
            ? width / 2
            : padX + (i * (width - padX * 2)) / (data.length - 1);

    const yFor = (avg) =>
        height - padY - ((avg - minAvg) / (maxAvg - minAvg)) * (height - padY * 2);

    const points = data.map((d, i) => [xFor(i), yFor(d.avg)]);
    const path = points
        .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
        .join(" ");

    // Gridlines at 0 / 50 / 100
    const gridValues = [0, 50, 100];

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height={height}
            role="img"
            aria-label="Average marks by semester"
        >
            {gridValues.map((v) => (
                <g key={v}>
                    <line
                        x1={padX}
                        x2={width - padX}
                        y1={yFor(v)}
                        y2={yFor(v)}
                        stroke="var(--paper-line)"
                        strokeWidth="1"
                    />
                    <text
                        x={4}
                        y={yFor(v) + 4}
                        fontSize="10"
                        fontFamily="IBM Plex Mono, monospace"
                        fill="var(--muted)"
                    >
                        {v}
                    </text>
                </g>
            ))}

            <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" />

            {points.map(([x, y], i) => (
                <g key={i}>
                    <circle cx={x} cy={y} r="4.5" fill="var(--accent)" />
                    <text
                        x={x}
                        y={height - 4}
                        fontSize="10.5"
                        textAnchor="middle"
                        fontFamily="IBM Plex Mono, monospace"
                        fill="var(--muted)"
                    >
                        Sem {data[i].semester}
                    </text>
                    <text
                        x={x}
                        y={y - 12}
                        fontSize="11"
                        textAnchor="middle"
                        fontFamily="IBM Plex Mono, monospace"
                        fill="var(--charcoal)"
                    >
                        {data[i].avg.toFixed(1)}
                    </text>
                </g>
            ))}
        </svg>
    );
}