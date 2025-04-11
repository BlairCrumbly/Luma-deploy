declare module 'cal-heatmap' {
    export default class CalHeatmap {
      constructor();
      paint(options: object, plugins?: any[]): void;
      destroy(): void;
      next(): void;
      previous(): void;
      fill(data: object): void;
    }
  }
  
  declare module '@cal-heatmap/tooltip' {
    export default class Tooltip {
      constructor(options?: object);
    }
  }
  