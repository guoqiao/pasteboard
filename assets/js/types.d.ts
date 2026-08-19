/**
 * Ambient types for the browser-side Pasteboard code.
 * The client bundles are plain scripts (module: none), so these globals
 * (jQuery, the module loader, Spinner, Modernizr, ...) are declared here.
 */

// Global console.log shorthand, set up by common.ts
declare function log(...args: any[]): void;

// Provided by lib/canvas-to-blob.min.js
declare function dataURLtoBlob(data: string): Blob;

// Spin.js
declare class Spinner {
  constructor(options: any);
  spin(target?: HTMLElement): Spinner;
  stop(): void;
}

// Modernizr 2.5.3 (custom build)
declare const Modernizr: {
  draganddrop?: boolean;
  csstransforms3d?: boolean;
};

interface Window {
  log: (...args: any[]) => void;
  moduleLoader: {
    addModule(name: string, module: (parent: any) => any): void;
    loadAll(parent: any): void;
    load(module: string, parent: any): void;
  };
  drawBackgroundOverlay: () => void;
  RECENT_UPLOADS: Array<{ link: string; raw: string }>;
  SOCKET_PORT: number;
  dataURLtoBlob: (data: string) => Blob;
  webkitURL?: { createObjectURL(object: any): string };
}

// The shared parent object that modules are loaded onto.
interface Pasteboard {
  [key: string]: any;
}

type JQEventHandler = (eventObject: any, ...args: any[]) => any;
type JQEventHandlerMap = { [eventName: string]: JQEventHandler };

interface JQueryDeferred {
  success(callback: (data: any, textStatus?: string, jqXHR?: any) => any): JQueryDeferred;
  error(callback: (jqXHR: any, textStatus?: string, errorThrown?: any) => any): JQueryDeferred;
}

interface JQuery {
  readonly length: number;
  [index: number]: HTMLElement;

  on(events: string, handler: JQEventHandler): JQuery;
  on(events: string, selector: string, handler: JQEventHandler): JQuery;
  on(events: JQEventHandlerMap): JQuery;
  off(events?: string, handler?: JQEventHandler): JQuery;
  off(events: string, selector: string, handler?: JQEventHandler): JQuery;
  one(events: string, handler: JQEventHandler): JQuery;
  trigger(eventType: string, extraParameters?: any): JQuery;

  css(propertyName: string, value?: any): JQuery;
  css(properties: any): JQuery;

  width(): number;
  width(value: number | string): JQuery;
  height(): number;
  height(value: number | string): JQuery;
  outerWidth(): number;
  outerHeight(): number;

  addClass(className: string): JQuery;
  removeClass(className?: string): JQuery;
  hasClass(className: string): boolean;
  toggleClass(className: string): JQuery;

  attr(name: string): string;
  attr(name: string, value: any): JQuery;
  attr(properties: any): JQuery;

  data(name?: string): any;
  data(name: string, value: any): JQuery;

  text(): string;
  text(text: string): JQuery;
  val(): string;
  val(value: string): JQuery;
  html(): string;
  html(htmlString: string): JQuery;

  append(content: any): JQuery;
  appendTo(target: any): JQuery;
  prepend(content: any): JQuery;
  remove(): JQuery;
  detach(): JQuery;
  empty(): JQuery;

  focus(): JQuery;
  hide(): JQuery;
  show(): JQuery;
  stop(): JQuery;
  delay(duration: number): JQuery;

  each(iterator: (index: number, element: HTMLElement) => any): JQuery;
  find(selector: string): JQuery;
  end(): JQuery;

  resize(handler?: JQEventHandler): JQuery;
  click(handler?: JQEventHandler): JQuery;

  scrollTop(): number;
  scrollTop(value: number): JQuery;
  scrollLeft(): number;
  scrollLeft(value: number): JQuery;
  offset(): { top: number; left: number };

  get(index: number): HTMLElement;

  transition(properties: any, duration?: number, complete?: () => void): JQuery;
  transition(properties: any, complete: () => void): JQuery;
}

interface JQueryStatic {
  (selector: string): JQuery;
  (element: HTMLElement): JQuery;
  (elementArray: HTMLElement[]): JQuery;
  (object: any): JQuery;
  (callback: () => void): JQuery;
  (htmlString: string): JQuery;

  extend(target: any, ...sources: any[]): any;
  get(url: string, success?: (data: any) => any): JQueryDeferred;
  post(url: string, data?: any, success?: (data: any) => any): JQueryDeferred;
  getJSON(url: string, success?: (data: any) => any): JQueryDeferred;
  browser: { mozilla?: boolean };
}

declare const $: JQueryStatic;
