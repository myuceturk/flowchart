# Flow Diagram Builder — Proje Detay Raporu

> **Tarih:** 29 Mart 2026
> **Versiyon:** 0.0.0
> **Branch:** main
> **Son commit:** `2eb577e` — Bug fix, performance optimization

---

## 1. Proje Genel Bakışı

**Flow Diagram Builder**, React 19 + TypeScript + React Flow üzerine inşa edilmiş, profesyonel bir web tabanlı diyagram oluşturma uygulamasıdır. Hedef, Miro benzeri sürükle-bırak arayüzüyle karmaşık iş akışları, süreç diyagramları ve sistem mimarileri oluşturmaktır.

Uygulama iki parçadan oluşur:
- **Frontend:** React/TypeScript SPA (Vite ile derleme)
- **Backend:** Node.js Express API (in-memory, geliştirme ortamı için)

---

## 2. Teknoloji Yığını

### Frontend
| Paket | Versiyon | Amaç |
|---|---|---|
| react | 19.2.4 | UI framework |
| react-dom | 19.2.4 | DOM render |
| reactflow | 11.11.4 | Diyagram motoru |
| typescript | ~5.9.3 | Tip güvenliği |
| zustand | 5.0.12 | State yönetimi |
| vite | 8.0.1 | Build aracı |
| lucide-react | 1.7.0 | İkon kütüphanesi |
| html-to-image | 1.11.13 | PNG dışa aktarma |
| jspdf | 4.2.1 | PDF dışa aktarma |
| uuid | 13.0.0 | Benzersiz ID üretimi |

### Backend
| Paket | Versiyon | Amaç |
|---|---|---|
| express | 5.2.1 | HTTP sunucusu |
| cors | 2.8.6 | Cross-origin desteği |
| uuid | 13.0.0 | ID üretimi |

### Derleme Yapılandırması
- **TypeScript:** strict mod, ES2023 hedef, bundler resolution
- **Vite:** React plugin, ESM output
- **ESLint:** TypeScript + React hooks kuralları

---

## 3. Dizin Yapısı

```
flowchardapp/
├── backend/
│   ├── server.js                   # Express API, in-memory depolama
│   └── package.json
├── src/
│   ├── main.tsx                    # Uygulama giriş noktası
│   ├── App.tsx                     # Kök bileşen, ThemeProvider sarmalayıcı
│   ├── index.css                   # Global CSS değişkenleri ve temel stiller
│   │
│   ├── app/
│   │   ├── hooks/
│   │   │   └── useDiagramBootstrap.ts   # URL/localStorage'dan diyagram yükleme
│   │   └── services/
│   │       ├── diagramPersistence.ts    # API ve localStorage kalıcılık servisi
│   │       └── flowViewport.ts          # Viewport yardımcıları
│   │
│   ├── components/
│   │   ├── Canvas.tsx                   # Canvas sarmalayıcı
│   │   ├── Header.tsx                   # Üst navigasyon çubuğu
│   │   ├── Sidebar.tsx                  # Sol panel (araçlar + node kategorileri)
│   │   ├── TemplateGallery.tsx          # Şablon seçim modalı
│   │   ├── ExportMenu.tsx               # Dışa/içe aktarma menüsü
│   │   ├── ThemePanel.tsx               # Tema özelleştirici
│   │   ├── EmptyState.tsx               # Boş kanvas UI
│   │   ├── NodeSearch.tsx               # Node arama modalı
│   │   ├── SelectionToolbar.tsx         # Seçim araç çubuğu
│   │   ├── ContextMenu.tsx              # Sağ tık menüsü
│   │   ├── ResizeHandles.tsx            # Node boyutlandırma tutamaçları
│   │   ├── SidebarItem.tsx              # Sidebar öğe bileşeni
│   │   ├── SidebarCategory.tsx          # Sidebar kategori sarmalayıcı
│   │   ├── dragShapes.ts                # Sürükleme önizleme SVG yardımcıları
│   │   └── canvas/
│   │       ├── CanvasView.tsx           # React Flow kanvas sarmalayıcı
│   │       ├── components/
│   │       │   └── AlignmentGuides.tsx  # Hizalama yardımcı çizgileri
│   │       └── hooks/
│   │           ├── useCanvasContextMenu.ts
│   │           ├── useCanvasKeyboardShortcuts.ts
│   │           ├── useCanvasNodeDnD.ts
│   │           ├── useNodeAlignmentGuides.ts
│   │           └── usePluginCanvasActionContext.ts
│   │
│   ├── nodes/
│   │   ├── nodeRegistry.ts              # Node tanımları ve fabrika
│   │   ├── nodeDesignSystem.ts          # Renk token'ları ve tasarım sistemi
│   │   ├── nodeIcons.tsx                # İkon tanımları
│   │   ├── types.ts                     # Node tip tanımları
│   │   ├── createNodeComponent.tsx      # Node bileşeni fabrikası
│   │   ├── NodeBase.tsx                 # Temel node wrapper
│   │   ├── NodeShell.tsx                # Node kabuğu (editör, handles)
│   │   ├── NodeActionToolbar.tsx        # Node üzeri araç çubuğu
│   │   ├── NodeTypeDropdown.tsx         # Node tip değiştirici dropdown
│   │   ├── decisionHandles.ts           # Decision node handle mantığı
│   │   ├── nodes.css                    # Node stilleri
│   │   ├── index.ts
│   │   └── [25 adet node bileşeni]
│   │
│   ├── edges/
│   │   ├── LabeledEdge.tsx              # Özel etiketli kenar bileşeni
│   │   ├── EdgeActionToolbar.tsx        # Kenar etiket düzenleme araç çubuğu
│   │   ├── types.ts
│   │   ├── edges.css
│   │   └── index.ts
│   │
│   ├── store/
│   │   ├── useDiagramStore.ts           # Diyagram state (nodes/edges)
│   │   ├── useUIStore.ts                # UI state (seçim, araçlar, modallar)
│   │   ├── useHistoryStore.ts           # Undo/Redo geçmişi
│   │   ├── store.utils.ts               # Store yardımcıları ve başlangıç state'i
│   │   └── selectors/
│   │       └── index.ts                 # Optimize edilmiş Zustand selector'ları
│   │
│   ├── theme/
│   │   ├── useThemeStore.ts             # Tema state'i ve kalıcılık
│   │   ├── theme.ts                     # Tema tanımları ve yardımcılar
│   │   ├── ThemeProvider.tsx            # Tema context sağlayıcısı
│   │   └── index.ts
│   │
│   ├── plugins/
│   │   ├── pluginSystem.ts              # Çekirdek plugin mimarisi
│   │   └── plugins/
│   │       └── examplePlugin.tsx        # Örnek plugin
│   │
│   ├── hooks/
│   │   ├── useDiagramCommands.ts        # Undo/copy/paste/delete komutları
│   │   └── useAutoSave.ts               # localStorage otomatik kaydetme
│   │
│   ├── utils/
│   │   ├── exportUtils.ts               # PNG/PDF/JSON dışa/içe aktarma
│   │   ├── nodeUtils.ts                 # Node manipülasyon yardımcıları
│   │   ├── alignment.ts                 # Node hizalama ve yaslama
│   │   ├── autoLayout.ts                # Otomatik yerleşim algoritması
│   │   └── animations.ts               # Animasyon yapılandırması
│   │
│   ├── data/
│   │   └── templates.ts                 # Hazır diyagram şablonları
│   │
│   └── types/
│       └── index.ts                     # Global TypeScript tipleri
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── package.json
└── README.md
```

---

## 4. Mimari Detayları

### 4.1 State Yönetimi (Zustand)

Uygulama 4 ayrı Zustand store kullanır. Her store belirli bir sorumluluk alanına sahiptir:

#### `useDiagramStore.ts` — Diyagram State
- `nodes: Node<NodeData>[]` — Kanvastaki tüm node'lar
- `edges: Edge[]` — Tüm bağlantılar
- `diagramId: string | null` — Bulut diyagram ID'si
- `onNodesChange()` — React Flow node değişiklik handler'ı
- `onEdgesChange()` — React Flow kenar değişiklik handler'ı
- `onConnect()` — Yeni bağlantı oluşturma
- `addNode()` — Yeni node ekle
- `updateNode()` — Node datasını güncelle
- `updateNodeDimensions()` — Node boyutu değiştir (rAF ile optimize)
- `updateNodeColor()` — Node rengini değiştir
- `updateNodeType()` — Node tipini değiştir
- `deleteNodesAndEdges()` — Seçimi sil
- `duplicateNodesAndEdges()` — Node'ları klonla
- `alignNodes()` — Grid'e hizala
- `nudgeNodes()` — Node'ları piksel kaydır
- `setDiagram()` — Toplu node/edge set et
- `createSnapshot()` — Geçmiş için anlık görüntü al

**`store/slices/diagramSlice.ts`** — diagramStore için slice mantığı (büyük operasyonlar buraya ayrılmış)

#### `useUIStore.ts` — Arayüz State
- `selectedNodeIds: string[]` — Seçili node ID'leri
- `selectedEdgeIds: string[]` — Seçili kenar ID'leri
- `activeTool: string` — Aktif araç ('select' | 'hand' | node tipi)
- `clipboard: ClipboardPayload | null` — Kopyalama tamponu
- `sidebarCollapsed: boolean` — Sidebar durumu
- `activeCategory: string | null` — Açık sidebar kategorisi
- `contextMenu: ContextMenuState` — Sağ tık menü durumu
- `helperLines: HelperLines` — Hizalama yardımcı çizgileri (+ spacing indicators)
- `isEditingLabel: boolean` — Etiket düzenleme modu
- `isSearchOpen: boolean` — Node arama modalı
- `isTemplateGalleryOpen: boolean` — Şablon modalı

#### `useHistoryStore.ts` — Undo/Redo
- `past: DiagramSnapshot[]` — Önceki anlık görüntüler (max 50)
- `future: DiagramSnapshot[]` — Yineleme anlık görüntüleri
- `pushSnapshot()` — State kaydet
- `undo()` — Geri al
- `redo()` — Yeniden yap

#### `useThemeStore.ts` — Tema Yönetimi
- `preference: 'light' | 'dark' | 'system'` — Kullanıcı tercihi
- `mode: 'light' | 'dark'` — Aktif mod
- `customTheme: CustomTheme` — Renk özelleştirmesi
- localStorage'a persist edilir

### 4.2 Store Selektörler (`store/selectors/index.ts`)

Performans için kritik optimize edilmiş selektörler:

```typescript
// Modül seviyesinde cache: nodes array referansı değişmediği sürece Map yeniden oluşturulmaz
let _cachedNodesArray: readonly Node[] | null = null;
let _cachedNodesMap: Map<string, Node> | null = null;

function getNodesMap(nodes: Node[]): Map<string, Node>
```

- **`selectNodeEditingUIState`** — `selectedNodeIds` yerine türetilmiş `isSingleNodeSelected` boolean'ı döner; her node seçim değişikliğinde değil sadece 0→1 veya 2→1 geçişinde yeniden render tetikler
- **`selectEdgeEditingUIState`** — Kenar bileşenleri için aynı optimizasyon
- **`useNodeData(nodeId)`** — `nodes.find()` yerine O(1) Map araması kullanır
- **`useContextMenuNodeType(nodeId)`** — Sadece sağ tıklanan node'un tipine subscribe olur; tüm nodes array'ine değil
- **`useEdgeEditingState()`** — Kenar düzenleme state'i

### 4.3 Node Sistemi

#### 25 Yerleşik Node Tipi

| Kategori | Node Tipleri |
|---|---|
| Flowchart | process, decision, startEnd, inputOutput, document, database, subprocess, manualInput |
| Product | user, screen, apiCall, success, error |
| Technical | server, databaseAdvanced, queue, microservice, externalApi |
| Content | text, stickyNote, image, annotation |
| Advanced | group, container, swimlane, connector |

#### Node Veri Yapısı
```typescript
Node<NodeData> {
  id: string;
  type: AppNodeType;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  data: {
    label: string;
    color?: string | null;
    preset?: 'default' | 'text' | 'sticky';
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: number;
  }
}
```

#### Node Kayıt Sistemi (`nodeRegistry.ts`)
- Tüm node tiplerine ait meta veriler, ikonlar, varsayılan boyutlar
- Plugin sistemi ile genişletilebilir
- `createNodeComponent.tsx` — factory ile node bileşenleri oluşturur
- `nodeDesignSystem.ts` — kategori başına renk token'ları (border, icon, glow, shadow, tone)

#### Özel SVG Tabanlı Node'lar
Bazı node'lar standart dikdörtgen yerine özel SVG şekli kullanır:
- **DatabaseNode** — Silindir şekli (SVG ellipse + rect)
- **DocumentNode** — Dalgalı alt kenar (SVG path)
- **DecisionNode** — Baklava (diamond) şekli
- **SwimlaneNode** — Yatay şeritler

### 4.4 Kenar (Edge) Sistemi

#### `LabeledEdge.tsx`
- React Flow'un `BaseEdge` + `EdgeLabelRenderer` üzerine inşa
- Bezier eğrisi yolu (`getBezierPath`)
- Merkezi tıklanabilir etiket
- Animasyonlu akış efekti (CSS `stroke-dasharray`)
- Kaynak node rengine göre renklendirme

#### `EdgeActionToolbar.tsx`
- Seçili kenarda görünen araç çubuğu
- Etiket ekleme/düzenleme
- Renk değiştirme
- Kenarı sil

### 4.5 Kanvas Sistemi (`CanvasView.tsx`)

React Flow üzerine sarmalanmış ana kanvas bileşeni:
- **Snap-to-grid:** 15px ızgara
- **Modül seviyesi sabitler:** `SNAP_GRID`, `DEFAULT_EDGE_OPTIONS` — her render'da yeni nesne oluşturmayı önler
- **Viewport culling:** 200+ node için `onlyRenderVisibleElements=true`
- **rAF ile seçim throttle:** box-select sırasında 120+ event/sn yerine ≤60/sn
- **MiniMap:** özel renkler, zoom/pan desteği
- **Controls:** zoom/pan butonları
- **Hizalama kılavuzları:** sürükleme sırasında
- **Klavye kısayolları**
- **Sağ tık menüsü**
- **Otomatik yerleşim**

### 4.6 Plugin Sistemi (`pluginSystem.ts`)

```typescript
PluginDefinition {
  name: string;
  nodes?: CustomNodeDefinition[];
  actions?: PluginAction[];
  toolbarItems?: PluginToolbarItem[];
  sidebarItems?: PluginSidebarItem[];
}
```

- Yerleşik tiplerin üzerine yazılmasını engelleyen sandbox
- `requestIdleCallback` ile asenkron yükleme
- Action handler çözümlemesi
- Özel node'lar react flow node tipine kaydedilir

### 4.7 Diyagram Kalıcılığı

#### Otomatik Kayıt (`useAutoSave.ts`)
- State değişikliklerinde localStorage'a 500ms debounce ile yazar
- Anahtar: `flowchart-autosave`

#### Bulut Kayıt (`diagramPersistence.ts`)
- `POST /diagram` — Yeni diyagram oluştur
- `GET /diagram/:id` — Diyagramı yükle
- `PUT /diagram/:id` — Diyagramı güncelle
- API Base URL: `http://localhost:3001`

#### Başlangıç Yükleme (`useDiagramBootstrap.ts`)
1. URL'de `?id=` parametresi varsa API'dan yükle
2. Yoksa localStorage'dan otomatik kayıdı yükle
3. İkisi de yoksa boş kanvas

### 4.8 Dışa/İçe Aktarma (`exportUtils.ts`)

| Format | Fonksiyon | Detay |
|---|---|---|
| PNG | `exportToPng()` | 2x retina, SVG stili dahil |
| PDF | `exportToPdf()` | Otomatik yön, SVG→görüntü |
| JSON | `exportToJson()` | Tam diyagram serileştirme |
| JSON Import | `importFromJson()` | Dosyadan yükleme |

### 4.9 Hizalama Sistemi

#### `useNodeAlignmentGuides.ts`
- Sürükleme sırasında diğer node'lara hizalama çizgileri gösterir
- **150 node limiti:** Üzerinde guide hesaplaması devre dışı bırakılır
- **500px yakınlık filtresi:** 50-150 node arası için aday seti daraltılır
- Spacing indicator'ları: eşit aralık önerisi

#### `alignment.ts`
- Sol, sağ, orta, üst, alt, orta (dikey), eşit dağıt

#### `autoLayout.ts`
- Hiyerarşik yerleşim algoritması
- Tek tuşla tüm diyagramı düzenler

---

## 5. Klavye Kısayolları

| Kısayol | Eylem |
|---|---|
| Ctrl+A | Tüm node'ları seç |
| Ctrl+C | Seçimi kopyala |
| Ctrl+V | Panodan yapıştır |
| Ctrl+Z | Geri al |
| Ctrl+Y / Ctrl+Shift+Z | Yeniden yap |
| Delete / Backspace | Seçimi sil |
| Escape | Modalları kapat, seçimi iptal et |
| Space (basılı) | Pan modu |
| Ok tuşları | Seçili node'ları 1px kaydır |
| Shift+Ok | Seçili node'ları 10px kaydır |

---

## 6. Tema Sistemi

### Tema Modları
- `light` — Açık mod
- `dark` — Koyu mod
- `system` — İşletim sistemi tercihine uy

### Özelleştirilebilir Renkler
- **Primary:** Ana vurgu rengi (varsayılan: #2563eb açık / #38bdf8 koyu)
- **Background:** Kanvas arka planı
- **Node:** Node yüzey rengi
- **Grid:** Nokta grid rengi

### CSS Mimarisi
- CSS Custom Properties (`--theme-*`) ile tema-aware stiller
- `color-mix()` fonksiyonu ile dinamik renkler
- Backdrop-filter blur ile cam efekti (glassmorphism)
- Motion değişkenleri: cubic-bezier(0.4, 0, 0.2, 1), 120/180/240ms

---

## 7. Backend API

`backend/server.js` — Express.js, in-memory depolama (production'da kalıcı değil):

```
POST   /diagram          → Yeni diyagram oluştur, ID döner
GET    /diagram/:id      → Diyagramı getir
PUT    /diagram/:id      → Diyagramı güncelle
```

**Önemli Not:** Backend yeniden başlatıldığında tüm veriler silinir. Gerçek kullanım için veritabanı entegrasyonu gereklidir.

---

## 8. Git Geçmişi ve Commit'ler

### Commit 1: `8eb72ab` — Initial commit
Proje iskelet kurulumu.

### Commit 2: `0dbdac7` — Initial commit: Set up flowchart application structure and core features
**28 Mart 2026, 23:58**

Tüm temel altyapı oluşturuldu:
- Tüm 25 node bileşeni
- Zustand store'ları (diagram, UI, history, theme)
- React Flow kanvas entegrasyonu
- Plugin sistemi
- Dışa/içe aktarma altyapısı
- Hizalama ve otomatik yerleşim araçları
- Şablon galerisi (5 şablon)
- Backend Express API
- Tema sistemi
- Tüm CSS dosyaları

### Commit 3: `2eb577e` — Bug fix, performance optimization
**29 Mart 2026, 01:36**

26 dosyada 738 ekleme / 454 silme. Aşağıda detaylı açıklanmıştır.

---

## 9. Bug Fix & Performans Optimizasyonları (Commit 2eb577e)

Bu commit'te yapılan değişiklikler iki kategoriye ayrılır: **hata düzeltmeleri** ve **performans iyileştirmeleri**.

### 9.1 Store Selektör Optimizasyonları (`store/selectors/index.ts`)

**Problem:** Her node bileşeni `selectedNodeIds` array'ine subscribe oluyordu. Herhangi bir seçim değişikliğinde tüm node'lar yeniden render ediliyordu.

**Çözüm:**
- `selectNodeEditingUIState` selektörü artık ham array yerine türetilmiş `isSingleNodeSelected: boolean` döner
- Sadece "tam olarak 1 node seçili mi?" durumu değiştiğinde render tetiklenir
- N node ile N² render yerine sıfır gereksiz render

**Problem:** Her node `state.nodes.find(n => n.id === nodeId)` çalıştırıyordu → O(N) × N bileşen = O(N²) toplam

**Çözüm:** Modül seviyesinde `Map<string, Node>` cache:
```typescript
function getNodesMap(nodes: Node[]): Map<string, Node>
// nodes array referansı değişmediği sürece Map yeniden oluşturulmaz
// Tüm N bileşen paylaşımlı O(N) Map'ten O(1) ile okur
```

**Yeni selektörler eklendi:**
- `selectEdgeEditingUIState` — Kenar bileşenleri için `isSingleEdgeSelected` optimizasyonu
- `useEdgeEditingState()` hook'u
- `useContextMenuNodeType(nodeId)` — Sadece sağ tıklanan node'un tipine subscribe olur

### 9.2 Struktural Paylaşım ile Güncelleme (`store/useDiagramStore.ts`, `store/slices/diagramSlice.ts`)

**Problem:** `updateNodeDimensions` tüm node'ları `nodes.map()` ile yeniden oluşturuyordu — değişmemiş node'lar bile yeni nesne referansı alıyordu.

**Çözüm (struktural paylaşım):**
```typescript
// Önce: O(N) map, tüm node'lar yeni nesne
nodes.map(node => node.id === nodeId ? {...node, ...dims} : node)

// Sonra: findIndex + sadece ilgili index değişir
const index = nodes.findIndex(n => n.id === nodeId);
const nextNodes = [...nodes];
nextNodes[index] = { ...node, ...dims };
// Diğer node'lar orijinal referansını korur
```

**Problem:** Boyut değişmemişse bile store yazma tetikleniyordu.

**Çözüm:** Değişmezse erken çıkış:
```typescript
if (node.width === width && node.height === height && node.position.x === x ...) return;
```

**`deleteNodesAndEdges` optimizasyonu:**
```typescript
// Önce: Array.includes() — O(N) her eleman için
nodeIds.includes(node.id)

// Sonra: Set.has() — O(1)
const nodeIdSet = new Set(nodeIds);
nodeIdSet.has(node.id)
```

**`duplicateNodesAndEdges` optimizasyonu:**
- `nodeIds.includes()` → `nodeIdSet.has()` dönüşümü
- Deselect sırasında yapısal paylaşım: `node.selected ? {...node, selected: false} : node`

**`alignNodes` optimizasyonu:**
- `nodeIds.includes()` → `nodeIdSet.has()` dönüşümü

**`updateNodeColor` basitleştirme:**
```typescript
// Önce: ayrı map işlemi
set({ nodes: nodes.map(n => n.id === nodeId ? {...n, data: {...n.data, color}} : n) })

// Sonra: mevcut updateNode'u kullan
get().updateNode(nodeId, { color });
```

### 9.3 Kanvas Render Optimizasyonları (`components/canvas/CanvasView.tsx`)

**Modül seviyesi sabitler:**
```typescript
const SNAP_GRID: [number, number] = [15, 15];
const DEFAULT_EDGE_OPTIONS = { type: 'labeled' } as const;
// Her render'da yeni nesne oluşturmaz → React Flow gereksiz iç işlem yapmaz
```

**Viewport culling eşiği:**
```typescript
const VIEWPORT_CULLING_THRESHOLD = 200;
// 200+ node: sadece görünür viewport içindekiler DOM'a render edilir
```

**MiniMap renk fonksiyonu memoize edildi:**
```typescript
const miniMapNodeColor = useCallback(
  (node: Node) => node.data?.color ?? customTheme.node ?? ...,
  [customTheme.node],
);
// Önceden: her CanvasView render'ında MiniMap tüm node'ları yeniden boyardı
```

**rAF ile seçim throttle:**
```typescript
const selectionRafRef = useRef<number | null>(null);
const onSelectionChange = useCallback(({ nodes, edges }) => {
  cancelAnimationFrame(selectionRafRef.current);
  selectionRafRef.current = requestAnimationFrame(() => {
    setSelectedNodeIds(...);
    setSelectedEdgeIds(...);
  });
}, [...]);
// 500 node box-select: 120+ event/sn → ≤60 store yazma/sn
```

**`handleOpenTemplates` stabilize edildi:**
```typescript
// Önceki: her render yeni lambda → EmptyState.memo bypassed
onOpenTemplates={() => setTemplateGalleryOpen(true)}

// Sonraki: stabil referans
const handleOpenTemplates = useCallback(() => setTemplateGalleryOpen(true), [...]);
```

**`helperLines` CanvasView selektöründen kaldırıldı:**
- Sürükleme sırasında 60fps güncelleme AlignmentGuides bileşeniyle izole edildi
- CanvasView artık her sürükleme frame'inde yeniden render edilmiyor

**Structural sharing for Ctrl+A:**
```typescript
// Önceki: seçili olsun olmasın tüm node'lar yeni nesne
nodes.map(node => ({ ...node, selected: true }))

// Sonraki: sadece henüz seçili olmayanlar yeni nesne alır
nodes.map(node => (node.selected ? node : { ...node, selected: true }))
```

### 9.4 Alignment Guides Optimizasyonu (`canvas/hooks/useNodeAlignmentGuides.ts`)

**Yeni limitler:**
```typescript
const ALIGNMENT_GUIDE_NODE_LIMIT = 150;
// 150+ node: guide hesaplaması tamamen devre dışı
// 150 node, 60fps = 9.000 hesap/sn; 500+ node = 30.000+/sn

const ALIGNMENT_PROXIMITY_RADIUS = 500;
// 50-150 node arası: sadece 500px yakınındaki node'lar aday sayılır
```

**Candidate filtresi:**
```typescript
const candidateNodes = currentNodes.length > 50
  ? currentNodes.filter(n =>
      Math.abs(n.position.x - node.position.x) < ALIGNMENT_PROXIMITY_RADIUS &&
      Math.abs(n.position.y - node.position.y) < ALIGNMENT_PROXIMITY_RADIUS
    )
  : currentNodes;
```

**AlignmentGuides bileşeni (`components/canvas/components/AlignmentGuides.tsx`):**
- Props kaldırıldı, doğrudan UIStore'a subscribe eder
- `spacingIndicators` desteği eklendi (eşit aralık görsel önerisi)
- Spacing indicator bileşeni: boyutlu dashed border + label badge

### 9.5 Node Bileşeni Optimizasyonları

**`NodeBase.tsx`:**
```typescript
// Önceki: her render yeni nesne
getCategoryColors(category)           // yeni obje
getNodeLabelColor(backgroundOverride) // yeni hesap
['node-shell', ...].filter().join()   // yeni dizi+string
{ width, height, '--node-*': ... }    // yeni style nesne

// Sonraki: useMemo ile memoize
const colors = useMemo(() => getCategoryColors(category), [category]);
const labelColor = useMemo(() => getNodeLabelColor(backgroundOverride), [backgroundOverride]);
const rootClassName = useMemo(() => [...].join(' '), [className, isActive]);
const nodeStyle = useMemo(() => ({...}), [width, height, backgroundOverride, colors, labelColor]);
```

**`DatabaseNode.tsx`, `DocumentNode.tsx`, `SwimlaneNode.tsx`:**
- `useDiagramStore` ve `useUIStore` doğrudan kullanımı kaldırıldı
- `useNodeData(id)` ve `useNodeEditingState()` optimized selector'ları kullanılıyor
- `useMemo` ile className, style, colors, definition stabilize edildi

**`DecisionNode.tsx`, `AnnotationNode.tsx`:**
- Benzer selector + memoization optimizasyonları

**`NodeShell.tsx`:**
- Minor stabilizasyon düzeltmesi

**`NodeTypeDropdown.tsx`:**
- Callback optimizasyonları

**`NodeActionToolbar.tsx`:**
- Gereksiz yeniden render'ları engelleyen düzeltmeler

### 9.6 Kenar (Edge) Optimizasyonları

**`LabeledEdge.tsx`:**
```typescript
// Modül seviyesi sabit
const EDGE_TRANSITION = createTransition(['stroke', 'stroke-width', 'filter']);

// getBezierPath memoize
const [edgePath, labelX, labelY] = useMemo(
  () => getBezierPath({...}),
  [sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition],
);

// Style nesneleri memoize
const edgeStyle = useMemo(() => ({...}), [style, data?.animated]);
const labelContainerStyle = useMemo(() => ({...}), [labelX, labelY]);

// onLabelClick stabilize
const onLabelClick = useCallback(e => {...}, [id]);
```

**`EdgeActionToolbar.tsx`:**
- `useEdgeEditingState()` optimized selector ile refactor
- Gereksiz render'lar engellendi

### 9.7 Resize Handle Optimizasyonu (`components/ResizeHandles.tsx`)

**Problem:** Yüksek frekans pointer event'lerinde (144Hz ekran, stylus) her move'da store güncelleme tetikleniyordu.

**Çözüm:** rAF tabanlı throttling:
```typescript
const pendingDimRef = useRef<{width, height, x, y} | null>(null);
const resizeRafRef = useRef<number | null>(null);

// pointermove'da:
pendingDimRef.current = { width, height, x, y };
if (!resizeRafRef.current) {
  resizeRafRef.current = requestAnimationFrame(() => {
    updateNodeDimensions(nodeId, pendingDimRef.current);
  });
}

// pointerup'da: flush + cleanup
```

### 9.8 Sidebar Optimizasyonu (`components/Sidebar.tsx`)

**Problem:** `activeTool` değiştiğinde Sidebar yeniden render ediliyor, `.map()` içindeki inline lambda'lar her seferinde yeni referans oluşturuyordu → `SidebarItem.memo` bypassed.

**Çözüm:** `ConnectedSidebarItem` wrapper bileşeni:
```typescript
const ConnectedSidebarItem: FC<ConnectedSidebarItemProps> = memo(function ConnectedSidebarItem({
  item, collapsed, activeTool, onItemClick, onDragStart, onDragEnd
}) {
  const onClick = useCallback(() => onItemClick(item), [onItemClick, item]);
  const onDragStart = useCallback(e => handleDragStart(e, item), [handleDragStart, item]);
  return <SidebarItem ... onClick={onClick} onDragStart={onDragStart} />;
});
```

Sonuç: `activeTool` değiştiğinde sadece aktif/pasif olan item'lar yeniden render edilir, diğerleri atlar.

### 9.9 Context Menu Optimizasyonu (`components/ContextMenu.tsx`)

**Problem:** `useDiagramStore(state => state.nodes)` tüm nodes array'ine subscribe — herhangi bir node değiştiğinde ContextMenu yeniden render ediliyordu.

**Çözüm:**
```typescript
// Önceki: tüm nodes array → O(N) find her render
const nodes = useDiagramStore(state => state.nodes);
const currentNode = nodes.find(n => n.id === contextMenu.nodeId);

// Sonraki: sadece ilgili node'un tipi
const currentNodeType = useContextMenuNodeType(nodeId);
```

Ayrıca tüm handler fonksiyonları `useCallback` ile stabilize edildi ve `if (!contextMenu.open) return null` kontrolü event handler'lardan **önce** değil artık **sonra** (hooks sonrası) konumlandırıldı (React hooks kuralı düzeltmesi).

### 9.10 Template Gallery & ExportMenu Küçük Düzeltmeler

- **TemplateGallery.tsx:** Stabilizasyon düzeltmeleri, klavye navigasyonu iyileştirme
- **ExportMenu.tsx:** Minor callback ve ref düzeltmeleri
- **Header.tsx:** Yeniden render optimizasyonları
- **SidebarCategory.tsx:** Minor prop stabilizasyonu

---

## 10. Şablonlar (`data/templates.ts`)

5 hazır şablon:

| Şablon | Açıklama |
|---|---|
| Blank | Boş kanvas |
| Approval Flow | Onay süreci akışı |
| Software Release | Yazılım yayın süreci |
| Customer Support | Müşteri destek akışı |
| Employee Onboarding | İşe alım süreci |

---

## 11. Bileşen Arayüzleri

### Header
- Diyagram başlığı ve altyaşıyı
- Kayıt durum göstergesi (localStorage/cloud)
- Geri al / Yeniden yap butonları
- Tema toggle (açık/koyu)
- Tema paneli açma
- Şablonlar butonu
- Dışa aktarma menüsü (PNG, PDF, JSON import)
- Kanvası temizle
- Buluta kaydet
- Diyagram ID göstergesi

### Sidebar
- Katlanabilir panel (genişlik animasyonlu)
- Çekirdek araçlar: Seçim, El ile kaydırma
- Plugin sidebar öğeleri
- Node kategorileri (Flowchart, Product, Technical, Content, Advanced)
- Sürükle-bırak ile node oluşturma
- Sürükleme önizlemesi (SVG ikon + etiket)

### Canvas
- React Flow viewport
- Noktalı grid arka planı
- Node ve kenar render
- Seçim davranışı (tıkla / kutu seç)
- Pan ve zoom
- Otomatik yerleşim butonu
- Görünümü ortala butonu
- Boş durum (şablon galerisi bağlantısı)

### TemplateGallery
- Modal dialog
- Şablon arama
- Kategori filtreleme
- Mini SVG önizleme
- Klavye navigasyonu (Tab trap, ESC kapat)

### NodeActionToolbar
- Node üzerinde seçince görünen araç çubuğu
- Tip değiştirici dropdown
- Renk seçici (preset renkler + null/varsayılan)
- Bağlantı kolu göster/gizle
- Sil

---

## 12. Tasarım Prensipleri

### Performans
1. Zustand `useShallow` ile seçici abonelik
2. `useCallback` / `useMemo` ile stabil referanslar
3. Yapısal paylaşım: değişmeyen node'lar orijinal referansını korur
4. `Set.has()` yerine `Array.includes()` büyük listeler için
5. `requestAnimationFrame` ile event throttling (seçim, boyutlandırma)
6. Modül seviyesi sabitler (React Flow prop'ları için)
7. 200+ node: viewport culling
8. 150+ node: alignment guide devre dışı
9. Node Map cache: O(N²) → O(N)

### State Yönetimi
- Sorumluluk ayrımı: diagram / UI / history / theme
- `.getState()` ile render tetiklemeden imperativ okuma
- Türetilmiş boolean'lar ham array'ler yerine

### Bileşen Mimarisi
- Sarmalayıcı bileşenler (ConnectedSidebarItem) memo'yu korumak için
- Factory pattern ile node bileşeni üretimi
- Plugin sandbox: yerleşik tiplere dokunulmuyor

### UX/UI
- Miro benzeri etkileşim modeli
- Glassmorphism overlay'ler
- Progressive disclosure (katlanabilir sidebar)
- Zengin görsel geri bildirim (hover, active, drag state)
- Spacing indicator'lar ile eşit aralık önerisi

---

## 13. Bilinen Kısıtlamalar ve Notlar

1. **Backend in-memory:** Sunucu yeniden başlatılırsa tüm bulut diyagramlar silinir. Production için veritabanı gerekli.
2. **Viewport culling trade-off:** 200+ node'da, ekranın tamamen dışına kaydırılan bir node'un yerel React state'i (örn. devam eden etiket düzenleme) kaybedilebilir.
3. **Alignment guides limiti:** 150+ node'da otomatik hizalama kılavuzları devre dışı bırakılır (kasıtlı performans tercihi).
4. **Image node:** Şu an basit bir wrapper; resim yükleme/URL mekanizması tam implement edilmemiş.
5. **Backend URL sabit:** `http://localhost:3001` hardcoded; environment variable değil.

---

## 14. Geliştirme Ortamı

```bash
# Frontend geliştirme (port 5173)
npm run dev

# Frontend production build
npm run build

# Önizleme
npm run preview

# Lint
npm run lint

# Backend (port 3001)
cd backend && node server.js
```

---

## 15. Planlanan / Yapılabilecek Geliştirmeler

Aşağıdakiler mevcut kod tabanında eksik veya kısmen implement edilmiş durumdadır:

1. **Veritabanı entegrasyonu:** Backend için PostgreSQL/SQLite kalıcı depolama
2. **Image node:** Resim yükleme, URL girişi, aspect-ratio kilitleme
3. **Gerçek zamanlı işbirliği:** WebSocket tabanlı çok kullanıcılı düzenleme
4. **Kullanıcı kimlik doğrulama:** Kişisel diyagram yönetimi
5. **Genişletilmiş şablon galerisi:** Daha fazla hazır şablon
6. **Kenar stilleri:** Düz çizgi, ok, kesik çizgi seçenekleri
7. **Node kilit özelliği:** Belirli node'ları sabitlemek için
8. **Dışa aktarma iyileştirmeleri:** SVG dışa aktarma, embed kodu
9. **Minimap node önizlemesi:** Hover'da node detayı
10. **Erişilebilirlik (a11y):** ARIA attribute'ları, klavye odak yönetimi iyileştirme

---

*Bu rapor, Flow Diagram Builder projesinin 29 Mart 2026 itibarıyla durumunu yansıtmaktadır. Proje aktif geliştirme aşamasındadır.*
