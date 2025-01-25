import React from 'react';

type Props = {
    value: number;
};

const ProgressBar = (props: Props) => {
    return (
        <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                style={{
                    width: `${props.value}%`,
                }}
            ></div>
        </div>
    );
};

export default ProgressBar;
