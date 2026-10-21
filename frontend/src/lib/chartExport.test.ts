import { describe, expect, it } from "vitest";
import {
  buildChartFileName,
  downloadChart,
  PNG_EXPORT_SCALE,
  serializeChartSvg,
  SVG_NAMESPACE,
  svgToPngBlob,
  XLINK_NAMESPACE,
  type ChartExportDeps,
  type ExportCanvas,
  type ExportCanvasContext,
} from "./chartExport";

function makeSvg(viewBox = "0 0 640 360"): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("class", "mt-3 h-auto w-full");
  const point = document.createElementNS(SVG_NAMESPACE, "circle");
  point.setAttribute("cx", "10");
  point.setAttribute("cy", "20");
  point.setAttribute("r", "4");
  point.setAttribute("class", "point");
  svg.appendChild(point);
  document.body.appendChild(svg);
  return svg;
}

function parseSvg(markup: string): Document {
  const document = new DOMParser().parseFromString(markup, "image/svg+xml");
  expect(document.querySelector("parsererror")).toBeNull();
  return document;
}

function pngDeps(overrides: Partial<ChartExportDeps> = {}) {
  const calls = {
    canvasWidth: 0,
    canvasHeight: 0,
    fillRect: [] as number[][],
    drawImage: [] as unknown[][],
    types: [] as string[],
    createdUrls: [] as Blob[],
    revoked: [] as string[],
    imageUrls: [] as string[],
  };
  const context: ExportCanvasContext = {
    fillStyle: "",
    fillRect: (x, y, width, height) => {
      calls.fillRect.push([x, y, width, height]);
    },
    drawImage: (image, dx, dy, dw, dh) => {
      calls.drawImage.push([image, dx, dy, dw, dh]);
    },
  };
  const canvas: ExportCanvas = {
    width: 0,
    height: 0,
    getContext: () => context,
  };
  const deps: ChartExportDeps = {
    createCanvas: (width, height) => {
      calls.canvasWidth = width;
      calls.canvasHeight = height;
      canvas.width = width;
      canvas.height = height;
      return canvas;
    },
    loadImage: async (url) => {
      calls.imageUrls.push(url);
      return { image: true };
    },
    createObjectURL: (blob) => {
      calls.createdUrls.push(blob);
      return "blob:chart";
    },
    revokeObjectURL: (url) => {
      calls.revoked.push(url);
    },
    canvasToBlob: async (_target, type) => {
      calls.types.push(type);
      return new Blob(["png"], { type });
    },
    ...overrides,
  };
  return { deps, calls, context, canvas };
}

describe("buildChartFileName", () => {
  it("prefers a trimmed title over column names", () => {
    expect(
      buildChartFileName({
        format: "svg",
        title: "  实验 数据  ",
        xColumn: "time_s",
        yColumn: "absorbance",
      }),
    ).toBe("labflow-实验-数据.svg");
  });

  it("falls back to x/y columns when the title is blank", () => {
    expect(
      buildChartFileName({
        format: "png",
        title: "   ",
        xColumn: "time_s",
        yColumn: "absorbance",
      }),
    ).toBe("labflow-time_s-absorbance.png");
  });

  it("cleans illegal characters, whitespace, and edge punctuation", () => {
    expect(
      buildChartFileName({
        format: "svg",
        title: '..--A/B\\C:D*E?F"G<H>I|J\n\t--..',
        xColumn: "x",
        yColumn: "y",
      }),
    ).toBe("labflow-A-B-C-D-E-F-G-H-I-J.svg");
  });

  it("collapses whitespace and trims leading/trailing dots and hyphens", () => {
    expect(
      buildChartFileName({
        format: "svg",
        title: "\t .. 实验\n数据 -- . ",
        xColumn: "x",
        yColumn: "y",
      }),
    ).toBe("labflow-实验-数据.svg");
  });

  it("falls back to labflow-chart when cleaning leaves nothing", () => {
    expect(
      buildChartFileName({
        format: "svg",
        title: "...---   ",
        xColumn: "",
        yColumn: "",
      }),
    ).toBe("labflow-chart.svg");
  });

  it("limits the cleaned body to 80 characters without truncating prefix or extension", () => {
    const name = buildChartFileName({
      format: "png",
      title: "数".repeat(120),
      xColumn: "x",
      yColumn: "y",
    });
    expect(name.startsWith("labflow-")).toBe(true);
    expect(name.endsWith(".png")).toBe(true);
    expect(name.slice("labflow-".length, -".png".length)).toHaveLength(80);
    expect(name).toBe(`labflow-${"数".repeat(80)}.png`);
  });

  it("is deterministic and keeps Chinese characters", () => {
    const options = {
      format: "svg" as const,
      title: "中文 标题_2026",
      xColumn: "x",
      yColumn: "y",
    };
    expect(buildChartFileName(options)).toBe("labflow-中文-标题_2026.svg");
    expect(buildChartFileName(options)).toBe(buildChartFileName(options));
  });
});

describe("serializeChartSvg", () => {
  it("adds namespaces, explicit dimensions, a white background, and removes classes", () => {
    const svg = makeSvg();
    const before = svg.outerHTML;
    const markup = serializeChartSvg(svg);
    const parsed = parseSvg(markup);
    const root = parsed.documentElement;

    expect(root.getAttribute("xmlns")).toBe(SVG_NAMESPACE);
    expect(root.getAttribute("xmlns:xlink")).toBe(XLINK_NAMESPACE);
    expect(root.getAttribute("width")).toBe("640");
    expect(root.getAttribute("height")).toBe("360");
    expect(root.getAttribute("viewBox")).toBe("0 0 640 360");
    expect(root.hasAttribute("class")).toBe(false);
    expect(parsed.querySelector("circle")?.hasAttribute("class")).toBe(false);

    const background = root.firstElementChild;
    expect(background?.tagName.toLowerCase()).toBe("rect");
    expect(background?.getAttribute("x")).toBe("0");
    expect(background?.getAttribute("y")).toBe("0");
    expect(background?.getAttribute("width")).toBe("640");
    expect(background?.getAttribute("height")).toBe("360");
    expect(background?.getAttribute("fill")).toBe("#ffffff");
    expect(parsed.querySelector("circle")?.getAttribute("cx")).toBe("10");
    expect(svg.outerHTML).toBe(before);
    expect(svg.querySelector("rect")).toBeNull();
    expect(svg.hasAttribute("xmlns")).toBe(false);
    expect(svg.getAttribute("class")).toBe("mt-3 h-auto w-full");
  });

  it("uses the viewBox dimensions and origin for non-default view boxes", () => {
    const svg = makeSvg("-10 -20 800 400");
    const parsed = parseSvg(serializeChartSvg(svg));
    const root = parsed.documentElement;
    const background = root.firstElementChild;

    expect(root.getAttribute("width")).toBe("800");
    expect(root.getAttribute("height")).toBe("400");
    expect(background?.getAttribute("x")).toBe("-10");
    expect(background?.getAttribute("y")).toBe("-20");
    expect(background?.getAttribute("width")).toBe("800");
    expect(background?.getAttribute("height")).toBe("400");
  });

  it("is stable across repeated calls", () => {
    const svg = makeSvg();
    expect(serializeChartSvg(svg)).toBe(serializeChartSvg(svg));
  });
});

describe("svgToPngBlob", () => {
  it("renders at 2x with a white background and returns a PNG blob", async () => {
    const { deps, calls, context } = pngDeps();
    const blob = await svgToPngBlob("<svg/>", 640, 360, deps);

    expect(PNG_EXPORT_SCALE).toBe(2);
    expect(calls.canvasWidth).toBe(640 * PNG_EXPORT_SCALE);
    expect(calls.canvasHeight).toBe(360 * PNG_EXPORT_SCALE);
    expect(context.fillStyle).toBe("#ffffff");
    expect(calls.fillRect).toEqual([
      [0, 0, 640 * PNG_EXPORT_SCALE, 360 * PNG_EXPORT_SCALE],
    ]);
    expect(calls.drawImage).toHaveLength(1);
    expect(calls.drawImage[0].slice(1)).toEqual([
      0,
      0,
      640 * PNG_EXPORT_SCALE,
      360 * PNG_EXPORT_SCALE,
    ]);
    expect(calls.types).toEqual(["image/png"]);
    expect(calls.imageUrls).toEqual(["blob:chart"]);
    expect(calls.createdUrls[0].type).toBe("image/svg+xml;charset=utf-8");
    expect(calls.revoked).toEqual(["blob:chart"]);
    expect(blob.type).toBe("image/png");
  });

  it("throws a Chinese error and revokes when there is no 2D context", async () => {
    const { deps, calls } = pngDeps({
      createCanvas: () => ({
        width: 0,
        height: 0,
        getContext: () => null,
      }),
    });
    await expect(svgToPngBlob("<svg/>", 640, 360, deps)).rejects.toThrow(
      "当前浏览器不支持 PNG 导出",
    );
    expect(calls.revoked).toEqual(["blob:chart"]);
  });

  it("throws a Chinese error and revokes when toBlob returns null", async () => {
    const { deps, calls } = pngDeps({
      canvasToBlob: async () => null,
    });
    await expect(svgToPngBlob("<svg/>", 640, 360, deps)).rejects.toThrow(
      "当前浏览器不支持 PNG 导出",
    );
    expect(calls.revoked).toEqual(["blob:chart"]);
  });

  it("revokes the object URL and throws when image loading fails", async () => {
    const { deps, calls } = pngDeps({
      loadImage: async () => {
        throw new Error("加载失败");
      },
    });
    await expect(svgToPngBlob("<svg/>", 640, 360, deps)).rejects.toThrow(
      /PNG 导出失败/,
    );
    expect(calls.revoked).toEqual(["blob:chart"]);
  });
});

describe("downloadChart", () => {
  it("downloads an SVG with a deterministic file name", async () => {
    const svg = makeSvg();
    const downloads: { blob: Blob; fileName: string }[] = [];
    const fileName = await downloadChart(
      {
        svg,
        format: "svg",
        title: "实验 曲线",
        xColumn: "time_s",
        yColumn: "absorbance",
      },
      {
        downloadBlob: (blob, name) => {
          downloads.push({ blob, fileName: name });
        },
      },
    );

    expect(fileName).toBe("labflow-实验-曲线.svg");
    expect(downloads).toHaveLength(1);
    expect(downloads[0].fileName).toBe(fileName);
    expect(downloads[0].blob.type).toBe("image/svg+xml;charset=utf-8");
  });

  it("downloads a PNG blob and returns the actual file name", async () => {
    const svg = makeSvg("0 0 800 400");
    const { deps, calls } = pngDeps();
    const downloads: { blob: Blob; fileName: string }[] = [];
    const fileName = await downloadChart(
      {
        svg,
        format: "png",
        title: "",
        xColumn: "time_s",
        yColumn: "absorbance",
      },
      {
        ...deps,
        downloadBlob: (blob, name) => {
          downloads.push({ blob, fileName: name });
        },
      },
    );

    expect(fileName).toBe("labflow-time_s-absorbance.png");
    expect(calls.canvasWidth).toBe(1600);
    expect(calls.canvasHeight).toBe(800);
    expect(downloads).toHaveLength(1);
    expect(downloads[0].blob.type).toBe("image/png");
  });
});
