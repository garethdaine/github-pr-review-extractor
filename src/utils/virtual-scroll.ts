// Virtual scrolling utility for large lists

interface VirtualScrollOptions {
  container: HTMLElement;
  itemHeight: number;
  renderItem: (item: any, index: number) => HTMLElement;
  items: any[];
  overscan?: number; // Number of items to render outside visible area
}

class VirtualScroll {
  private container: HTMLElement;
  private itemHeight: number;
  private renderItem: (item: any, index: number) => HTMLElement;
  private items: any[];
  private overscan: number;
  private scrollTop: number = 0;
  private containerHeight: number = 0;
  private visibleStart: number = 0;
  private visibleEnd: number = 0;
  private renderedItems: HTMLElement[] = [];
  private wrapper: HTMLElement | null = null;

  constructor(options: VirtualScrollOptions) {
    this.container = options.container;
    this.itemHeight = options.itemHeight;
    this.renderItem = options.renderItem;
    this.items = options.items;
    this.overscan = options.overscan || 3;

    this.init();
  }

  private init() {
    // Create wrapper for virtual scrolling
    this.wrapper = document.createElement('div');
    this.wrapper.style.position = 'relative';
    this.wrapper.style.height = `${this.items.length * this.itemHeight}px`;
    this.wrapper.style.overflow = 'hidden';

    // Create viewport
    const viewport = document.createElement('div');
    viewport.style.position = 'absolute';
    viewport.style.top = '0';
    viewport.style.left = '0';
    viewport.style.right = '0';
    viewport.style.height = '100%';
    viewport.style.overflow = 'auto';
    viewport.id = 'virtual-scroll-viewport';

    // Create content container
    const content = document.createElement('div');
    content.id = 'virtual-scroll-content';
    content.style.position = 'relative';

    viewport.appendChild(content);
    this.wrapper.appendChild(viewport);

    // Clear container and add wrapper
    this.container.innerHTML = '';
    this.container.appendChild(this.wrapper);

    // Set up scroll listener
    viewport.addEventListener('scroll', () => {
      this.scrollTop = viewport.scrollTop;
      this.update();
    });

    // Initial render
    this.update();
  }

  private update() {
    if (!this.wrapper) return;

    const viewport = this.wrapper.querySelector('#virtual-scroll-viewport') as HTMLElement;
    const content = this.wrapper.querySelector('#virtual-scroll-content') as HTMLElement;

    if (!viewport || !content) return;

    this.containerHeight = viewport.clientHeight;
    const itemCount = Math.ceil(this.containerHeight / this.itemHeight);

    this.visibleStart = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.overscan);
    this.visibleEnd = Math.min(
      this.items.length,
      this.visibleStart + itemCount + this.overscan * 2
    );

    // Clear previous items
    content.innerHTML = '';
    this.renderedItems = [];

    // Render visible items
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      const item = this.items[i];
      if (!item) continue;

      const element = this.renderItem(item, i);
      element.style.position = 'absolute';
      element.style.top = `${i * this.itemHeight}px`;
      element.style.left = '0';
      element.style.right = '0';
      element.style.height = `${this.itemHeight}px`;

      content.appendChild(element);
      this.renderedItems.push(element);
    }
  }

  updateItems(newItems: any[]) {
    this.items = newItems;
    if (this.wrapper) {
      const viewport = this.wrapper.querySelector('#virtual-scroll-viewport') as HTMLElement;
      if (viewport) {
        this.wrapper.style.height = `${this.items.length * this.itemHeight}px`;
        this.update();
      }
    }
  }

  destroy() {
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }
}

export default VirtualScroll;











