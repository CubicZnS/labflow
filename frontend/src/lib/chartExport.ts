export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
export const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
export const PNG_EXPORT_SCALE = 2;

const DEFAULT_CHART_WIDTH = 640;
const DEFAULT_CHART_HEIGHT = 360;
const FILE_PREFIX = "labflow-";
const FALLBACK_BODY = "chart";
const MAX_FILE_BODY_LENGTH = 80;
const PNG_UNSUPPORTED_MESSAGE = "当前浏览器不支持 PNG 导出";

export type ChartExportFormat = "svg" | "png";
export type PngExportScale = 1 | 2 | 3;

export function normalizePngScale(value: unknown): PngExportScale {
  return value === 1 || value === 2 || value === 3
    ? value
    : PNG_EXPORT_SCALE;
}

export type ChartFileNameOptions = {
  format: ChartExportFormat;
  title?: string | null;
  xColumn: string;
  yColumn: string;
};

type SvgDimensions = { width: number; height: number };

function parseViewBox(svg: SVGSVGElement): SvgDimensions {
  const viewBox = svg.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.trim().split(/\s+/).map(Number);
    if (parts.length === 4) {
      const width = parts[2];
      const height = parts[3];
      if (
        Number.isFinite(width) &&
        Number.isFinite(height) &&
        width > 0 &&
        height > 0
      ) {
        return { width, height };
      }
    }
  }
  return { width: DEFAULT_CHART_WIDTH, height: DEFAULT_CHART_HEIGHT };
}

function cleanFileBody(source: string): string {
  const normalized = source
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[/\\:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.\-\s]+|[.\-\s]+$/g, "");
  return normalized.slice(0, MAX_FILE_BODY_LENGTH).replace(/^[.\-\s]+|[.\-\s]+$/g, "");
}

export function buildChartFileName(options: ChartFileNameOptions): string {
  const title = options.title?.trim() ?? "";
  const columnPair = `${options.xColumn}-${options.yColumn}`;
  const source = title.length > 0 ? title : columnPair;
  const body = cleanFileBody(source) || FALLBACK_BODY;
  return `${FILE_PREFIX}${body}.${options.format}`;
}

export function serializeChartSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const { width, height } = parseViewBox(svg);
  const viewBox = svg.getAttribute("viewBox");
  const [minX, minY] = viewBox
    ? viewBox.trim().split(/\s+/).map(Number).slice(0, 2)
    : [0, 0];
  const x = Number.isFinite(minX) ? minX : 0;
  const y = Number.isFinite(minY) ? minY : 0;

  clone.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    XLINK_NAMESPACE,
  );
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  if (viewBox) {
    clone.setAttribute("viewBox", viewBox);
  }

  clone.removeAttribute("class");
  for (const element of Array.from(clone.querySelectorAll("[class]"))) {
    element.removeAttribute("class");
  }

  const background = clone.ownerDocument.createElementNS(SVG_NAMESPACE, "rect");
  background.setAttribute("x", String(x));
  background.setAttribute("y", String(y));
  background.setAttribute("width", String(width));
  background.setAttribute("height", String(height));
  background.setAttribute("fill", "#ffffff");
  background.setAttribute("data-chart-background", "true");
  clone.insertBefore(background, clone.firstChild);

  return new XMLSerializer().serializeToString(clone);
}

export type ExportCanvasContext = {
  fillStyle: unknown;
  imageSmoothingEnabled?: boolean;
  fillRect: (x: number, y: number, width: number, height: number) => void;
  drawImage: (
    image: unknown,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ) => void;
};

export type ExportCanvas = {
  width: number;
  height: number;
  getContext: (contextId: "2d") => ExportCanvasContext | null;
};

export type ChartExportDeps = {
  createCanvas?: (width: number, height: number) => ExportCanvas | null;
  loadImage?: (url: string) => Promise<unknown>;
  createObjectURL?: (blob: Blob) => string;
  revokeObjectURL?: (url: string) => void;
  canvasToBlob?: (canvas: ExportCanvas, type: string) => Promise<Blob | null>;
  downloadBlob?: (blob: Blob, fileName: string) => void;
};

function defaultCreateCanvas(width: number, height: number): ExportCanvas | null {
  if (typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas as unknown as ExportCanvas;
}

function defaultLoadImage(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片加载失败"));
    image.src = url;
  });
}

function defaultCreateObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

function defaultRevokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}

function defaultCanvasToBlob(
  canvas: ExportCanvas,
  type: string,
): Promise<Blob | null> {
  const element = canvas as unknown as HTMLCanvasElement;
  if (typeof element.toBlob !== "function") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    element.toBlob((blob) => resolve(blob), type);
  });
}

function defaultDownloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function readableExportError(error: unknown): Error {
  if (error instanceof Error) {
    if (error.message === PNG_UNSUPPORTED_MESSAGE) {
      return error;
    }
    if (error.message.trim().length > 0) {
      return new Error(`PNG 导出失败：${error.message}`);
    }
  }
  return new Error("PNG 导出失败，请重试");
}

export async function svgToPngBlob(
  markup: string,
  width: number,
  height: number,
  deps: ChartExportDeps = {},
  pngScale: PngExportScale = PNG_EXPORT_SCALE,
): Promise<Blob> {
  const createCanvas = deps.createCanvas ?? defaultCreateCanvas;
  const loadImage = deps.loadImage ?? defaultLoadImage;
  const createObjectURL = deps.createObjectURL ?? defaultCreateObjectURL;
  const revokeObjectURL = deps.revokeObjectURL ?? defaultRevokeObjectURL;
  const canvasToBlob = deps.canvasToBlob ?? defaultCanvasToBlob;
  const scale = normalizePngScale(pngScale);
  const pixelWidth = Math.round(width * scale);
  const pixelHeight = Math.round(height * scale);
  let objectUrl: string | null = null;

  try {
    const imageBlob = new Blob([markup], {
      type: "image/svg+xml;charset=utf-8",
    });
    objectUrl = createObjectURL(imageBlob);
    const image = await loadImage(objectUrl);

    const canvas = createCanvas(pixelWidth, pixelHeight);
    if (!canvas) {
      throw new Error(PNG_UNSUPPORTED_MESSAGE);
    }
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(PNG_UNSUPPORTED_MESSAGE);
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pixelWidth, pixelHeight);
    context.imageSmoothingEnabled = true;
    context.drawImage(image, 0, 0, pixelWidth, pixelHeight);

    const blob = await canvasToBlob(canvas, "image/png");
    if (!blob) {
      throw new Error(PNG_UNSUPPORTED_MESSAGE);
    }
    return blob;
  } catch (error) {
    throw readableExportError(error);
  } finally {
    if (objectUrl) {
      revokeObjectURL(objectUrl);
    }
  }
}

export type DownloadChartOptions = {
  svg: SVGSVGElement;
  format: ChartExportFormat;
  title?: string | null;
  xColumn: string;
  yColumn: string;
  pngScale?: PngExportScale;
};

export async function downloadChart(
  options: DownloadChartOptions,
  deps: ChartExportDeps = {},
): Promise<string> {
  const fileName = buildChartFileName({
    format: options.format,
    title: options.title,
    xColumn: options.xColumn,
    yColumn: options.yColumn,
  });
  const downloadBlob = deps.downloadBlob ?? defaultDownloadBlob;
  const markup = serializeChartSvg(options.svg);

  if (options.format === "svg") {
    const blob = new Blob([markup], {
      type: "image/svg+xml;charset=utf-8",
    });
    downloadBlob(blob, fileName);
    return fileName;
  }

  const { width, height } = parseViewBox(options.svg);
  const blob = await svgToPngBlob(
    markup,
    width,
    height,
    deps,
    normalizePngScale(options.pngScale),
  );
  downloadBlob(blob, fileName);
  return fileName;
}
