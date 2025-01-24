declare module 'wav-encoder' {
    const WavEncoder: {
        encode: (options: { sampleRate: number; channelData: Float32Array[] }) => Promise<ArrayBuffer>;
    };
    export default WavEncoder;
}
