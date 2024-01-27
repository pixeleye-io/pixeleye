import { memo } from 'react';
import { shallow } from 'zustand/shallow';

import { useStore, type ReactFlowState, type BackgroundProps } from 'reactflow';

const selector = (s: ReactFlowState) => ({ transform: s.transform, patternId: `pattern-${s.rfId}` });

function Background({
    id,
    gap = 50,
    size,
    offset = 2
}: BackgroundProps) {

    const { transform, patternId } = useStore(selector, shallow);
    const patternSize = size || 1;
    const gapXY: [number, number] = Array.isArray(gap) ? gap : [gap, gap];
    const scaledGap: [number, number] = [gapXY[0] * transform[2] * 0.75 || 1, gapXY[1] * transform[2] * 0.75 || 1];
    const scaledSize = patternSize * transform[2];

    const patternOffset = [scaledSize / offset, scaledSize / offset]

    const _patternId = `${patternId}${id ? id : ''}`;

    const radius = scaledSize / offset


    return (
        <svg
            className={'absolute w-full h-full top-0 left-0'}
        >
            <pattern
                id={_patternId}
                x={transform[0] * 0.75 % scaledGap[0]}
                y={transform[1] * 0.75 % scaledGap[1]}
                width={scaledGap[0]}
                height={scaledGap[1]}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(-${patternOffset[0]},-${patternOffset[1]})`}
            >
                <circle cx={radius} cy={radius} r={radius} fill="currentColor" className={'text-on-surface-variant/75'} />
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill={`url(#${_patternId})`} />
            <rect transform={`translate(-${scaledGap[0] / 2}, -${scaledGap[1] / 2})`} width="100%" height="100%" fill={`url(#${_patternId})`} />
        </svg>
    );
}

Background.displayName = 'Background';

export default memo(Background);