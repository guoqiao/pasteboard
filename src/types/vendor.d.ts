/**
 * Ambient type declarations for the dependencies this project depends on.
 * These packages either predate @types or expose more surface area than the
 * code uses, so we declare just enough for the code to type-check.
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
      connection: any;
    }

    interface Response {
      send(body?: any): void;
      json(body: any): void;
      render(view: string, data?: any): void;
      set(field: string, value: string): void;
      setHeader(field: string, value: string | string[]): this;
      status(code: number): Response;
      cookie(name: string, value: any, options?: any): void;
      clearCookie(name: string): void;
      redirect(url: string): void;
      getHeaders(): any;
      headersSent: boolean;
      statusCode: number;
    }

    interface Application {
      use(...args: any[]): void;
      set(name: string, value: any): this;
      get(name: string): any;
      get(path: string, handler: (req: Request, res: Response) => void): this;
      post(path: string, handler: (req: Request, res: Response) => void): this;
      put(path: string, handler: (req: Request, res: Response) => void): this;
      del(path: string, handler: (req: Request, res: Response) => void): this;
      listen(port: number, callback?: () => void): http.Server;
      settings: any;
    }

    function static(path: string): any;
  }

  function express(): express.Application;

  export = express;
}

declare module "serve-favicon" {
  function serveFavicon(path: string): any;
  export = serveFavicon;
}

declare module "morgan" {
  function morgan(format: string): any;
  export = morgan;
}

declare module "cookie-parser" {
  function cookieParser(): any;
  export = cookieParser;
}

declare module "method-override" {
  function methodOverride(): any;
  export = methodOverride;
}

declare module "errorhandler" {
  function errorHandler(): any;
  export = errorHandler;
}

declare module "formidable" {
  interface File {
    filepath: string;
    size: number;
    mimetype: string;
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

declare module "fs-extra" {
  export function move(
    sourcePath: string,
    destinationPath: string,
    callback: (err?: Error) => void
  ): void;
  export function unlink(path: string, callback?: (err?: Error) => void): void;
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
