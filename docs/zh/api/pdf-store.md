# PDF Store API

PDF Store (`lib/pdf-store.ts`) 是一个 Zustand 存储，管理应用程序中所有 PDF 相关的状态。

## 导入

```typescript
import { usePDFStore } from "@/lib/pdf-store";
```

## 状态

### 文档状态

| 属性          | 类型                  | 描述                  |
| ------------- | --------------------- | --------------------- |
| `pdfUrl`      | `string \| null`      | 当前 PDF 的 URL       |
| `numPages`    | `number`              | 总页数                |
| `currentPage` | `number`              | 当前页码（从 1 开始） |
| `metadata`    | `PDFMetadata \| null` | PDF 元数据            |
| `outline`     | `PDFOutlineNode[]`    | 文档大纲/目录         |
| `isLoading`   | `boolean`             | 加载状态              |

### 视图状态

| 属性        | 类型        | 默认值       | 描述                       |
| ----------- | ----------- | ------------ | -------------------------- |
| `zoom`      | `number`    | `1`          | 缩放级别 (0.5-5)           |
| `rotation`  | `number`    | `0`          | 页面旋转 (0, 90, 180, 270) |
| `viewMode`  | `ViewMode`  | `"single"`   | 查看模式                   |
| `fitMode`   | `FitMode`   | `"fitWidth"` | 适应模式                   |
| `themeMode` | `ThemeMode` | `"auto"`     | 主题模式                   |

### UI 状态

| 属性              | 类型      | 默认值  | 描述             |
| ----------------- | --------- | ------- | ---------------- |
| `isFullscreen`    | `boolean` | `false` | 全屏状态         |
| `showThumbnails`  | `boolean` | `true`  | 显示缩略图侧边栏 |
| `showOutline`     | `boolean` | `false` | 显示大纲侧边栏   |
| `showAnnotations` | `boolean` | `true`  | 显示注释         |
| `isSelectionMode` | `boolean` | `false` | 文本选择模式     |

### 注释

| 属性                      | 类型                | 描述          |
| ------------------------- | ------------------- | ------------- |
| `annotations`             | `Annotation[]`      | 所有注释      |
| `annotationHistory`       | `AnnotationHistory` | 撤销/重做历史 |
| `selectedAnnotationColor` | `string`            | 当前注释颜色  |
| `selectedStrokeWidth`     | `number`            | 当前笔触宽度  |

### 书签

| 属性        | 类型         | 描述     |
| ----------- | ------------ | -------- |
| `bookmarks` | `Bookmark[]` | 用户书签 |

### 搜索

| 属性                  | 类型             | 描述         |
| --------------------- | ---------------- | ------------ |
| `searchQuery`         | `string`         | 当前搜索查询 |
| `searchResults`       | `SearchResult[]` | 搜索结果     |
| `currentSearchIndex`  | `number`         | 当前结果索引 |
| `caseSensitiveSearch` | `boolean`        | 区分大小写   |

## 类型

### ViewMode

```typescript
type ViewMode = "single" | "continuous" | "twoPage";
```

### FitMode

```typescript
type FitMode = "custom" | "fitWidth" | "fitPage";
```

### Annotation

```typescript
interface Annotation {
  id: string;
  type: "highlight" | "comment" | "shape" | "text" | "drawing" | "image";
  pageNumber: number;
  content?: string;
  color: string;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  path?: Array<{ x: number; y: number }>;
  strokeWidth?: number;
  timestamp: number;
}
```

### Bookmark

```typescript
interface Bookmark {
  id: string;
  pageNumber: number;
  title: string;
  timestamp: number;
}
```

## 操作

### 导航操作

```typescript
// 设置当前页
setCurrentPage: (page: number) => void

// 导航到下一页
nextPage: () => void

// 导航到上一页
previousPage: () => void

// 跳转到特定页
goToPage: (page: number) => void
```

### 缩放操作

```typescript
// 设置缩放级别
setZoom: (zoom: number) => void

// 按步长放大
zoomIn: () => void

// 按步长缩小
zoomOut: () => void

// 重置缩放到 100%
resetZoom: () => void
```

### 视图操作

```typescript
// 设置查看模式
setViewMode: (mode: ViewMode) => void

// 设置适应模式
setFitMode: (mode: FitMode) => void

// 设置主题模式
setThemeMode: (mode: ThemeMode) => void

// 切换全屏
toggleFullscreen: () => void

// 设置旋转
setRotation: (rotation: number) => void
```

### 注释操作

```typescript
// 添加注释
addAnnotation: (annotation: Annotation) => void

// 更新注释
updateAnnotation: (id: string, updates: Partial<Annotation>) => void

// 删除注释
deleteAnnotation: (id: string) => void

// 撤销上一个注释操作
undoAnnotation: () => void

// 重做已撤销的操作
redoAnnotation: () => void

// 清除所有注释
clearAnnotations: () => void
```

### 书签操作

```typescript
// 添加书签
addBookmark: (bookmark: Bookmark) => void

// 更新书签
updateBookmark: (id: string, updates: Partial<Bookmark>) => void

// 删除书签
deleteBookmark: (id: string) => void
```

## 使用示例

### 基本用法

```typescript
function PageNavigator() {
  const currentPage = usePDFStore((state) => state.currentPage);
  const numPages = usePDFStore((state) => state.numPages);
  const nextPage = usePDFStore((state) => state.nextPage);

  return (
    <div>
      <span>{currentPage} / {numPages}</span>
      <button onClick={nextPage}>下一页</button>
    </div>
  );
}
```

### 选择性订阅

```typescript
// 仅在 zoom 变化时重新渲染
const zoom = usePDFStore((state) => state.zoom);

// 使用浅比较订阅多个值
import { shallow } from "zustand/shallow";

const { currentPage, numPages } = usePDFStore(
  (state) => ({
    currentPage: state.currentPage,
    numPages: state.numPages,
  }),
  shallow
);
```

### 组件外部的操作

```typescript
// 获取操作而不订阅
const addBookmark = usePDFStore.getState().addBookmark;

// 在事件处理器中使用
function handleAddBookmark() {
  addBookmark({
    id: nanoid(),
    pageNumber: usePDFStore.getState().currentPage,
    title: "我的书签",
    timestamp: Date.now(),
  });
}
```

### 持久化

存储自动将这些字段持久化到 localStorage：

- `themeMode`
- `viewMode`
- `recentFiles`
- `bookmarks`
- 水印设置
- 滚动设置
