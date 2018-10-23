export interface Config {
  getAllLocalMembers?: boolean;
  showType?: "export" | "member";
  sacle?: number;
  fileMaxDepth?: number;
  tableStyle?: {
    headerHeight?: number;
    itemHeight?: number;
    textPadding?: number;
    itemPadding?: number;
    headerFontSize?: number;
    itemFontSize?: number;
  };
  connectPathStyle?: {
    color?: string;
    strokeDasharray?: string;
    arrowSize?: number;
  };
  fileStyle?: {
    widthPadding?: number;
    heightPadding?: number;
    headerHeight?: number;
    headerFontSize?: number;
    tableOffset?: number;
    fileOffset?: number;
  };
  contentStyle?: {
    background?: string;
    padding?: number;
  };
  theme?: {
    accent: string;
  };
  maxShowTypeLength?: number;
}

export const config: Config = {
    getAllLocalMembers: true,
    showType: "member",
    fileMaxDepth: 0,
    tableStyle: {
      itemPadding: 12,
      textPadding: 20,
      headerHeight: 36,
      itemHeight: 28,
      headerFontSize: 14,
      itemFontSize: 12
    },
    fileStyle: {
      widthPadding: 8,
      heightPadding: 16,
      headerHeight: 24,
      headerFontSize: 12,
      tableOffset: 36,
      fileOffset: 48
    },
    connectPathStyle: {
      color: "#333",
      strokeDasharray: "4 2",
      arrowSize: 6
    },
    contentStyle: {
      background: "#e5e5e5",
      padding: 24
    },
    theme: {
      accent: "#005aa0"
    },
    maxShowTypeLength: 20
  }

  export default config;
