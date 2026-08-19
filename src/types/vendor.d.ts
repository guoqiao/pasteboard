/**
 * Ambient type declarations for the vintage 2012-era dependencies this
 * project depends on. Most of these packages predate @types entirely,
 * so we declare just enough surface area for the code to type-check.
 */

declare module "express" {
  import http = require("http");

  namespace express {
    interface Request {
      params: any;
      query: any;
      body: any;
      cookies: any;
      headers: any;
      app: Application;
    }

    interface Response {
      send(body?: any, status?: number): void;
      json(body: any): void;
      render(view: string, data?: any): void;
      set(field: string, value: string): void;
      cookie(name: string, value: any, options?: any): void;
      clearCookie(name: string): void;
      redirect(url: string): void;
      getHeaders(): any;
    }

    interface Application {
      configure(...args: any[]): void;
      use(...args: any[]): void;
      set(name: string, value: any): this;
      set(name: string, value: any, ...args: any[]): this;
      get(name: string): any;
      get(path: string, handler: (req: Request, res: Response) => void): this;
      post(path: string, handler: (req: Request, res: Response) => void): this;
      put(path: string, handler: (req: Request, res: Response) => void): this;
      del(path: string, handler: (req: Request, res: Response) => void): this;
      listen(port: number, callback?: () => void): http.Server;
      settings: any;
      router: any;
    }

    function favicon(path: string): any;
    function limit(bytes: string): any;
    function logger(format: string): any;
    function cookieParser(): any;
    function methodOverride(): any;
    function static(path: string): any;
    function errorHandler(): any;
  }

  function express(): express.Application;

  export = express;
}

declare module "request" {
  namespace request {
    interface Options {
      url?: string;
      uri?: string;
      method?: string;
      headers?: any;
      body?: any;
      qs?: any;
      json?: boolean;
    }

    interface Request {
      pipe(destination: any): any;
    }

    type Callback = (error: any, response: any, body: any) => void;
  }

  function request(options: request.Options | string, callback?: request.Callback): request.Request;

  namespace request {
    function del(options: request.Options, callback?: (error: any) => void): void;
  }

  export = request;
}

declare module "formidable" {
  interface File {
    path: string;
    size: number;
    type: string;
  }

  interface Fields {
    [key: string]: string;
  }

  interface Files {
    [key: string]: File;
  }

  export class IncomingForm {
    on(event: "fileBegin", handler: (name: string, file: File) => void): this;
    on(event: "aborted", handler: () => void): this;
    parse(
      req: any,
      callback: (err: any, fields: Fields, files: Files) => void
    ): void;
  }
}

declare module "async" {
  export function parallel(
    tasks: any,
    callback?: (err: any, results?: any) => void
  ): void;
  export function series(
    tasks: any[],
    callback?: (err: any, results?: any) => void
  ): void;
}

declare module "knox" {
  interface Client {
    putFile(
      sourcePath: string,
      destinationPath: string,
      headers: any,
      callback: (err: any, response?: any) => void
    ): void;
    deleteFile(name: string, callback?: (err: any) => void): void;
  }

  function createClient(options: any): Client;

  export = createClient;
}

declare module "easyimage" {
  interface CropOptions {
    src: string;
    dst: string;
    cropwidth?: any;
    cropheight?: any;
    x?: any;
    y?: any;
    gravity?: string;
  }

  function crop(
    options: CropOptions,
    callback: (err: any, image?: any) => void
  ): void;

  export = crop;
}

declare module "ua-parser" {
  namespace uaParser {
    interface ParseResult {
      family: string;
    }
  }

  const uaParser: {
    parseUA(userAgent?: string): uaParser.ParseResult;
  };

  export = uaParser;
}

declare module "fs.extra" {
  import fs = require("fs");

  function move(
    sourcePath: string,
    destinationPath: string,
    callback: (err?: Error) => void
  ): void;
  function unlink(path: string, callback?: (err?: Error) => void): void;

  export = fs;
  export { move };
}

declare module "websocket" {
  import http = require("http");

  namespace websocket {
    interface IServerConfig {
      httpServer: http.Server;
      autoAcceptConnections?: boolean;
    }

    interface IRequest {
      origin: string;
      httpRequest: http.IncomingMessage;
      accept(protocols: any, origin?: string): IConnection;
      reject(): void;
    }

    interface IConnection {
      sendUTF(message: string): void;
      on(event: string, handler: (...args: any[]) => void): void;
    }

    class server {
      constructor(config: IServerConfig);
      on(event: "request", handler: (request: IRequest) => void): void;
    }
  }

  export = websocket;
}

declare module "underscore" {
  interface UnderscoreStatic {
    defer(callback: (...args: any[]) => void, ...args: any[]): void;
  }

  const _: UnderscoreStatic;
  export = _;
}

declare module "less" {
  interface RenderOptions {
    paths?: string[];
    filename?: string;
    compress?: boolean;
  }

  interface RenderOutput {
    css: string;
  }

  function render(
    input: string,
    options?: RenderOptions
  ): Promise<RenderOutput>;

  export { render };
}