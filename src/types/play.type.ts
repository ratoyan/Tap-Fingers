export interface BoxType {
    id: number | any;
    size: [number, number];
    color: string;
    rotation: number;
    x: number;
    y: number;
    duration?: number;
    isBoom?: boolean
}